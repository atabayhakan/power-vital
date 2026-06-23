// Cursor-based pagination helpers.
//
// Why cursor and not offset?
//   • Offset pagination gets slower linearly as the page number grows
//     (LIMIT N OFFSET 100000 still scans 100000 rows). Cursors use the
//     index on (createdAt, id) to seek directly.
//   • When rows are inserted/deleted between requests, offset-based pages
//     show duplicates or skip rows. Cursor + stable id keeps the page
//     boundary consistent.
//   • Cursor pagination is append-only friendly — perfect for log tails,
//     event histories, and any time-series view.
//
// The cursor format is base64url(JSON([sortValue, id])).
//   • sortValue is the timestamp / numeric we order by.
//   • id is the row's UUID — tie-breaker when sortValue collides.
//
// On decode failure (tampered URL, old format) we return null so the
// caller can fall back to "start from the beginning".

export interface Cursor {
  v: number;     // CURSOR_VERSION marker
  value: number; // the sort value (unix ms for time, plain number otherwise)
  id: string;    // tie-breaker id
}

const CURSOR_VERSION = 1;

const b64urlEncode = (s: string): string =>
  Buffer.from(s, 'utf8').toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const b64urlDecode = (s: string): string | null => {
  try {
    const padded = s.replace(/-/g, '+').replace(/_/g, '/')
      + '==='.slice((s.length + 3) % 4);
    return Buffer.from(padded, 'base64').toString('utf8');
  } catch { return null; }
};

export const encodeCursor = (value: number, id: string): string =>
  b64urlEncode(JSON.stringify({ v: CURSOR_VERSION, value, id }));

export const decodeCursor = (raw: string | undefined | null): Cursor | null => {
  if (!raw) return null;
  const json = b64urlDecode(raw);
  if (!json) return null;
  try {
    const parsed = JSON.parse(json);
    if (parsed.v !== CURSOR_VERSION) return null;
    if (typeof parsed.value !== 'number' || typeof parsed.id !== 'string') return null;
    return { v: parsed.v, value: parsed.value, id: parsed.id };
  } catch { return null; }
};

/**
 * Parse the standard ?cursor=&limit= query params.
 *  • limit is clamped to MAX (200) just like offset pagination.
 *  • cursor is opaque — pass through whatever the client sent.
 */
export const parseCursor = (
  raw: { cursor?: string; limit?: string | number } | undefined,
  defaultLimit = 50
): { cursor: Cursor | null; limit: number; take: number } => {
  const rawLimit = raw?.limit === undefined ? defaultLimit : Number(raw.limit);
  // NaN / 0 / negative all collapse to 1 (the smallest legal page)
  const safeLimit = Number.isFinite(rawLimit) && rawLimit > 0 ? rawLimit : 1;
  const limit = Math.min(200, safeLimit);
  return {
    cursor: decodeCursor(raw?.cursor),
    limit,
    take: limit + 1 // fetch one extra to detect "is there a next page?"
  };
};

/**
 * Build the Prisma WHERE clause that means "rows after this cursor".
 * Tie-breaks on id so the order is stable even when many rows share
 * a timestamp (e.g. log lines in the same millisecond).
 */
export const afterCursorWhere = (cursor: Cursor, sortField = 'createdAt') => {
  // (sortField, id) < (cursor.value, cursor.id)  in DESC order
  // OR equivalently for DESC ordering:
  //   sortField < cursor.value
  //   OR (sortField = cursor.value AND id < cursor.id)
  return {
    OR: [
      { [sortField]: { lt: new Date(cursor.v) } },
      {
        [sortField]: new Date(cursor.v),
        id: { lt: cursor.id }
      }
    ]
  };
};

/**
 * Strip the sentinel row + return both the page and the next cursor.
 * Callers pass in `take + 1` rows; the extra row signals "more pages".
 */
export const splitPage = <T extends { id: string; [k: string]: any }>(
  rows: T[],
  limit: number,
  sortField = 'createdAt'
): { items: T[]; nextCursor: string | null; hasMore: boolean } => {
  if (rows.length > limit) {
    const items = rows.slice(0, limit);
    const last = items[items.length - 1];
    const lastVal = (last as any)[sortField];
    // Normalise the sort value to a number. Accepts:
    //   • Date object         → .getTime()
    //   • ISO date string     → new Date(str).getTime()
    //   • numeric string/num  → Number()
    //   • anything else       → Date(string) as a last resort
    let value: number;
    if (lastVal instanceof Date) {
      value = lastVal.getTime();
    } else if (typeof lastVal === 'string') {
      const d = new Date(lastVal);
      value = isNaN(d.getTime()) ? Number(lastVal) : d.getTime();
    } else {
      value = Number(lastVal);
    }
    return { items, nextCursor: encodeCursor(value, last.id), hasMore: true };
  }
  return { items: rows, nextCursor: null, hasMore: false };
};
