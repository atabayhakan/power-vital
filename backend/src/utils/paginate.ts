// Pagination helpers — standard envelope across all list endpoints.
//
// Why an envelope?
//   • Frontend can render "page X of Y" + next/prev without an extra
//     count(*) round-trip.
//   • hasMore lets infinite-scroll components know when to stop without
//     knowing the total.
//
// Why `limit`/`page` and not cursor-based by default?
//   • Most admin views need sorted, filterable, page-jumping UX.
//   • Cursor pagination is opt-in for the high-volume endpoints (orders,
//     reviews, transactions) where it's worth the extra complexity.
//
// The envelope is intentionally additive — endpoints that already return a
// raw array continue to do so for backward compatibility. New endpoints
// SHOULD use this envelope; legacy endpoints are being migrated one by one
// (see migrations in admin/users, admin/withdrawals, etc.).
export interface PageEnvelope<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export const DEFAULT_LIMIT = 50;
export const MAX_LIMIT = 200;

/**
 * Normalise + clamp pagination input. Page is 1-indexed; limit is
 * capped to MAX_LIMIT so a single request can't OOM the DB or the
 * response serializer.
 */
export const parsePagination = (
  raw: PaginationParams | undefined,
  defaults: { page?: number; limit?: number } = {}
): { page: number; limit: number; skip: number; take: number } => {
  const page = Math.max(1, Math.floor(raw?.page ?? defaults.page ?? 1));
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, Math.floor(raw?.limit ?? defaults.limit ?? DEFAULT_LIMIT))
  );
  return { page, limit, skip: (page - 1) * limit, take: limit };
};

/**
 * Build a paginated envelope from raw rows + total count. The `total`
 * comes from a separate `prisma.model.count()` call — keep it optional
 * for endpoints that don't need page counts (e.g. live log tail).
 */
export const envelope = <T>(
  items: T[],
  total: number | null,
  page: number,
  limit: number
): PageEnvelope<T> => ({
  items,
  total: total ?? items.length,
  page,
  limit,
  // hasMore = "is there a next page?" — cheaper than computing total.
  // When total is unknown we fall back to "we got a full page, so maybe".
  hasMore: total === null ? items.length === limit : page * limit < total
});
