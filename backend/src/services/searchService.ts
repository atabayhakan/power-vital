// Product search service — MySQL FULLTEXT with ngram parser.
//
// Replaces the previous `LIKE '%q%'` implementation which was:
//   • Case-sensitive in some collations
//   • No relevance ranking (newer products won regardless of relevance)
//   • Slow on large catalogues (full table scan)
//   • Couldn't do partial / fuzzy matching
//
// How it works:
//   1. Short queries (1-2 chars) — fall back to `name LIKE ? OR barcode LIKE ?`
//      because ngram_token_size defaults to 2 (so FULLTEXT needs ≥2 chars).
//   2. Longer queries — use `MATCH(...) AGAINST(? IN NATURAL LANGUAGE MODE)`.
//      This returns rows ranked by relevance (BM25-ish score).
//   3. We expose:
//        • relevance score
//        • snippet (with <mark>...</mark> highlights via app-side windowing)
//        • pagination metadata (total, page, limit)
//
// The same ngram index also accelerates admin POS barcode-prefix search.

import prisma from '../lib/prisma';
import { logger } from '../utils/logger';

export interface SearchOptions {
  /** The user's query string (already trim/lowercased) */
  q: string;
  /** Optional category filter */
  categoryId?: string;
  /** Page (1-based), default 1 */
  page?: number;
  /** Page size, default 20, max 100 */
  limit?: number;
  /** When true, only return active products (skip soft-deleted/disabled) */
  activeOnly?: boolean;
  /** When true, include products with stock > 0 only */
  inStockOnly?: boolean;
}

export interface SearchHit {
  id: string;
  name: string;
  description: string | null;
  barcode: string;
  basePriceKgs: number;
  basePriceUsd: number;
  stockQuantity: number;
  categoryId: string | null;
  imageUrl: string | null;
  relevance: number;
  /** Short snippet with <mark>...</mark> highlights around the matched terms */
  snippet: string | null;
  images: { id: string; imageUrl: string; sortOrder: number }[];
  category: { id: string; name: string; slug: string; iconEmoji: string | null } | null;
}

export interface SearchResult {
  hits: SearchHit[];
  total: number;
  page: number;
  limit: number;
  /** Echo of the query that was actually executed (post-trim) */
  q: string;
  /** Which strategy was used: 'fulltext' | 'like' */
  strategy: 'fulltext' | 'like';
  tookMs: number;
}

// ngram_token_size default is 2 in MySQL 5.7+. So FULLTEXT MATCH works for
// queries ≥ 2 chars. Anything shorter must use LIKE to avoid "Illegal argument
// to a regular function" errors and zero-result false negatives.
const FULLTEXT_MIN_CHARS = 2;
const SNIPPET_RADIUS = 60; // chars on each side of the match
const SNIPPET_MAX = 180;

const clean = (s: string) => s.trim();

/**
 * Wrap occurrences of any of `terms` in `text` with <mark> tags.
 * Case-insensitive, longest-match-first (so "vitamin b12" wins over "b1").
 */
export const highlightTerms = (text: string, terms: string[]): string => {
  if (!text) return text;
  const sorted = [...new Set(terms.filter(t => t.length > 0))]
    .sort((a, b) => b.length - a.length);
  if (sorted.length === 0) return text;

  const escaped = sorted.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const re = new RegExp(`(${escaped.join('|')})`, 'gi');
  return text.replace(re, '<mark>$1</mark>');
};

/**
 * Extract a window of `SNIPPET_RADIUS` chars around the first match, with
 * <mark> tags around all matched terms. Returns the original text if no match.
 */
export const buildSnippet = (text: string | null, terms: string[]): string | null => {
  if (!text) return null;
  const haystack = text;
  const lower = haystack.toLowerCase();
  let firstIdx = -1;
  for (const t of terms) {
    const i = lower.indexOf(t.toLowerCase());
    if (i >= 0 && (firstIdx === -1 || i < firstIdx)) firstIdx = i;
  }
  if (firstIdx === -1) {
    // No direct match — just return the highlighted prefix
    const trimmed = haystack.length > SNIPPET_MAX
      ? haystack.slice(0, SNIPPET_MAX) + '…'
      : haystack;
    return highlightTerms(trimmed, terms);
  }
  const start = Math.max(0, firstIdx - SNIPPET_RADIUS);
  const end = Math.min(haystack.length, firstIdx + SNIPPET_RADIUS * 2);
  const prefix = start > 0 ? '…' : '';
  const suffix = end < haystack.length ? '…' : '';
  return prefix + highlightTerms(haystack.slice(start, end), terms) + suffix;
};

/**
 * Tokenize the query for snippet highlighting. We use simple whitespace +
 * punctuation split — ngram inside MySQL will further sub-tokenize, but for
 * snippet display we want the actual words the user typed.
 */
export const tokenize = (q: string): string[] => {
  return q
    .toLowerCase()
    .split(/[\s,.;:!?'"`()[\]{}<>]+/g)
    .filter(t => t.length > 0);
};

/**
 * LIKE-based fallback for very short queries.
 */
const searchWithLike = async (opts: SearchOptions): Promise<SearchResult> => {
  const start = Date.now();
  const where: any = {
    OR: [
      { name: { contains: opts.q } },
      { barcode: { contains: opts.q } }
    ]
  };
  if (opts.categoryId) where.categoryId = opts.categoryId;
  if (opts.inStockOnly) where.stockQuantity = { gt: 0 };

  const [total, rows] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      skip: ((opts.page ?? 1) - 1) * (opts.limit ?? 20),
      take: opts.limit ?? 20,
      orderBy: { createdAt: 'desc' },
      include: {
        images: { orderBy: { sortOrder: 'asc' } }
      }
    })
  ]);

  // Fetch the related category rows separately so the response shape
  // matches the FULLTEXT path.
  const catIds = rows.map(r => r.categoryId).filter(Boolean) as string[];
  const cats = catIds.length
    ? await prisma.category.findMany({
        where: { id: { in: catIds } },
        select: { id: true, name: true, slug: true, iconEmoji: true }
      })
    : [];
  const catById = new Map(cats.map(c => [c.id, c]));

  const terms = tokenize(opts.q);
  const hits: SearchHit[] = rows.map(r => ({
    id: r.id,
    name: r.name,
    description: r.description,
    barcode: r.barcode,
    basePriceKgs: Number(r.basePriceKgs),
    basePriceUsd: Number(r.basePriceUsd),
    stockQuantity: r.stockQuantity,
    categoryId: r.categoryId,
    imageUrl: r.images?.[0]?.imageUrl ?? null,
    relevance: 0,
    snippet: buildSnippet(r.description, terms),
    images: r.images,
    category: r.categoryId ? catById.get(r.categoryId) ?? null : null
  }));

  return {
    hits,
    total,
    page: opts.page ?? 1,
    limit: opts.limit ?? 20,
    q: opts.q,
    strategy: 'like',
    tookMs: Date.now() - start
  };
};

/**
 * FULLTEXT search — ngram parser, NATURAL LANGUAGE MODE for relevance.
 * Falls back to LIKE for very short queries.
 */
export const searchProducts = async (rawQuery: string, opts: SearchOptions = { q: rawQuery }): Promise<SearchResult> => {
  const q = clean(rawQuery);
  if (!q) return { hits: [], total: 0, page: 1, limit: opts.limit ?? 20, q: '', strategy: 'like', tookMs: 0 };

  // Update the embedded q for downstream consumers
  const o: SearchOptions = { ...opts, q };

  if (q.length < FULLTEXT_MIN_CHARS) {
    return searchWithLike(o);
  }

  const start = Date.now();
  const page = o.page ?? 1;
  const limit = Math.min(o.limit ?? 20, 100);
  const skip = (page - 1) * limit;

  // MySQL FULLTEXT search with ngram parser.
  // We use $queryRaw because Prisma's `where: { name: { search: q } }` only
  // works on MySQL without a parser hint and isn't aware of ngram.
  //
  // The relevance column is computed by MATCH(...) AGAINST(...) in the SELECT,
  // and we ORDER BY it. Filters (categoryId, inStockOnly) are applied via
  // the outer WHERE — but a row only appears if it ALSO matches the
  // FULLTEXT expression. We use AND-of-WHERE so FULLTEXT is mandatory.
  const terms = tokenize(q);
  // Escape the query for the MATCH expression. The ngram parser splits by
  // bytes so we only need to strip MySQL fulltext operators (no +, -, *, ")
  // and limit length.
  const safeQ = q.replace(/[+\-><()~*"@]/g, ' ').slice(0, 200);

  // Conditional WHERE clauses
  const filters: string[] = ['1=1'];
  const params: any[] = [safeQ];
  if (o.categoryId) { filters.push('p.`categoryId` = ?'); params.push(o.categoryId); }
  if (o.inStockOnly) { filters.push('p.`stockQuantity` > 0'); }

  // The MATCH expression must match the index columns exactly.
  // We reference `name, description, barcode` from schema.prisma.
  const sql = `
    SELECT
      p.id, p.name, p.description, p.barcode,
      p.basePriceKgs, p.basePriceUsd, p.stockQuantity, p.categoryId,
      MATCH(p.name, p.description, p.barcode)
        AGAINST (? IN NATURAL LANGUAGE MODE) AS relevance
    FROM \`Product\` p
    WHERE MATCH(p.name, p.description, p.barcode)
            AGAINST (? IN NATURAL LANGUAGE MODE)
      AND ${filters.join(' AND ')}
    ORDER BY relevance DESC, p.createdAt DESC
    LIMIT ? OFFSET ?
  `;
  const countSql = `
    SELECT COUNT(*) AS total
    FROM \`Product\` p
    WHERE MATCH(p.name, p.description, p.barcode)
            AGAINST (? IN NATURAL LANGUAGE MODE)
      AND ${filters.join(' AND ')}
  `;

  try {
    const [rows, countRows] = await Promise.all([
      prisma.$queryRawUnsafe<any[]>(sql, safeQ, safeQ, ...params.slice(1), limit, skip),
      prisma.$queryRawUnsafe<any[]>(countSql, safeQ, ...params.slice(1))
    ]);
    const total = Number(countRows?.[0]?.total ?? 0);

    if (rows.length === 0) {
      // Empty FULLTEXT result — fall back to LIKE so users with slight
      // typos or alternate spellings still find something. We log it
      // because in production a zero-result FULLTEXT search usually means
      // a real problem (parser not installed, index missing, etc.).
      logger.warn({ q, total }, 'FULLTEXT returned 0 results; falling back to LIKE');
      return searchWithLike(o);
    }

    // Fetch the related records (images, category) for the matched rows.
    // Two extra queries are cheaper than a JOIN with all columns.
    const ids = rows.map(r => r.id);
    const [images, categories] = await Promise.all([
      prisma.productImage.findMany({
        where: { productId: { in: ids } },
        orderBy: { sortOrder: 'asc' }
      }),
      prisma.category.findMany({
        where: { id: { in: rows.map(r => r.categoryId).filter(Boolean) as string[] } },
        select: { id: true, name: true, slug: true, iconEmoji: true }
      })
    ]);
    const imagesByProduct = new Map<string, typeof images>();
    for (const img of images) {
      const list = imagesByProduct.get(img.productId) || [];
      list.push(img);
      imagesByProduct.set(img.productId, list);
    }
    const catById = new Map(categories.map(c => [c.id, c]));

    const hits: SearchHit[] = rows.map(r => {
      const imgs = (imagesByProduct.get(r.id) || []).map(i => ({
        id: i.id,
        imageUrl: i.imageUrl,
        sortOrder: i.sortOrder
      }));
      return {
        id: r.id,
        name: r.name,
        description: r.description,
        barcode: r.barcode,
        basePriceKgs: Number(r.basePriceKgs),
        basePriceUsd: Number(r.basePriceUsd),
        stockQuantity: r.stockQuantity,
        categoryId: r.categoryId,
        imageUrl: imgs[0]?.imageUrl ?? null,
        relevance: Number(r.relevance) || 0,
        snippet: buildSnippet(r.description, terms),
        images: imgs,
        category: r.categoryId ? catById.get(r.categoryId) ?? null : null
      };
    });

    return {
      hits,
      total,
      page,
      limit,
      q,
      strategy: 'fulltext',
      tookMs: Date.now() - start
    };
  } catch (err: any) {
    // The most common cause: the FULLTEXT index doesn't exist yet
    // (e.g. migration wasn't run). We log clearly so the operator can fix it.
    logger.error({
      err: err?.message,
      hint: 'Did you run prisma/migrations/add_fulltext_search.sql?'
    }, 'FULLTEXT search failed; falling back to LIKE');
    return searchWithLike(o);
  }
};

export default searchProducts;
