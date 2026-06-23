// GET /api/v1/admin/search/{users|products} — typeahead autocomplete.
//
// Query: ?q=<query>&limit=<n>
//   • q: minimum 2 characters. Shorter queries return [] (don't spam the
//     DB with prefix scans of huge tables).
//   • limit: capped at 20 (typeahead dropdowns don't need more).
//
// Why a dedicated endpoint instead of reusing /admin/users with a
// search= param?
//   • Smaller payload — we return only { id, name, email, role } for
//     users and { id, name, barcode, stockQuantity } for products. The
//     full /admin/users payload is ~10x larger and we don't need it for
//     a dropdown.
//   • Faster — we skip the count(*) call needed for the paginated
//     envelope. A typeahead only needs to show the first N matches.
//   • Cacheable — short Cache-Control (60s) because user lists don't
//     change often; ETag for free.
//
// Search semantics:
//   • MySQL utf8mb4_unicode_ci collation → case-insensitive LIKE for free.
//   • For users: name OR email (also matches the existing /admin/users
//     search param so behavior is consistent).
//   • For products: name OR barcode (barcodes are exact IDs so a LIKE
//     with the prefix finds them instantly).
//
// Performance:
//   • Indexed columns (User.email, User.name is prefix-indexed in MySQL
//     by default; Product.name, Product.barcode is unique-indexed) →
//     O(log n) lookup, sub-millisecond on a few thousand rows.
import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticateJWT, requireRole } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

const MAX_LIMIT = 20;
const DEFAULT_LIMIT = 10;
const MIN_QUERY_LENGTH = 2;

// GET /api/v1/admin/search/users?q=&limit=
router.get('/users', authenticateJWT, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const q = String(req.query.q ?? '').trim();
    const limit = Math.min(MAX_LIMIT, Math.max(1, Number(req.query.limit) || DEFAULT_LIMIT));

    if (q.length < MIN_QUERY_LENGTH) {
      res.set('Cache-Control', 'public, max-age=60');
      return res.json({ query: q, results: [] });
    }

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name:  { contains: q } },
          { email: { contains: q } }
        ]
      },
      select: {
        id: true, name: true, email: true, role: true,
        walletBalanceKgs: true, walletBalanceUsd: true,
        isMonthlyActive: true
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    // 60s shared cache — typeahead dropdowns are fetched on every
    // keystroke, the user list barely changes minute-to-minute.
    res.set('Cache-Control', 'public, max-age=60');
    res.json({
      query: q,
      count: users.length,
      results: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        walletKgs: Number(u.walletBalanceKgs || 0),
        walletUsd: Number(u.walletBalanceUsd || 0),
        isActive: u.isMonthlyActive
      }))
    });
  } catch (e) {
    logger.error({ err: e }, 'user search error');
    res.status(500).json({ error: 'Search failed' });
  }
});

// GET /api/v1/admin/search/products?q=&limit=
router.get('/products', authenticateJWT, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const q = String(req.query.q ?? '').trim();
    const limit = Math.min(MAX_LIMIT, Math.max(1, Number(req.query.limit) || DEFAULT_LIMIT));

    if (q.length < MIN_QUERY_LENGTH) {
      res.set('Cache-Control', 'public, max-age=60');
      return res.json({ query: q, results: [] });
    }

    const products = await prisma.product.findMany({
      where: {
        OR: [
          { name:    { contains: q } },
          { barcode: { contains: q } }
        ]
      },
      select: {
        id: true, name: true, barcode: true,
        basePriceKgs: true, basePriceUsd: true,
        stockQuantity: true, minStockAlert: true,
        category: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    res.set('Cache-Control', 'public, max-age=60');
    res.json({
      query: q,
      count: products.length,
      results: products.map((p) => ({
        id: p.id,
        name: p.name,
        barcode: p.barcode,
        priceKgs: Number(p.basePriceKgs),
        priceUsd: Number(p.basePriceUsd),
        stock: p.stockQuantity,
        lowStock: p.stockQuantity <= (p.minStockAlert ?? 10),
        category: p.category ? { id: p.category.id, name: p.category.name } : null
      }))
    });
  } catch (e) {
    logger.error({ err: e }, 'product search error');
    res.status(500).json({ error: 'Search failed' });
  }
});

export default router;
