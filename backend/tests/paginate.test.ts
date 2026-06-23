// Unit tests for the pagination helper.
import { describe, it, expect } from 'vitest';
import { envelope, parsePagination, MAX_LIMIT, DEFAULT_LIMIT } from '../src/utils/paginate';

describe('parsePagination', () => {
  it('defaults to page=1, limit=50 when called with no input', () => {
    const r = parsePagination(undefined);
    expect(r).toEqual({ page: 1, limit: 50, skip: 0, take: 50 });
  });

  it('respects a custom default limit', () => {
    const r = parsePagination(undefined, { limit: 10 });
    expect(r.limit).toBe(10);
    expect(r.take).toBe(10);
  });

  it('parses string inputs from req.query (Express delivers them as strings)', () => {
    const r = parsePagination({ page: '3', limit: '25' } as any);
    expect(r).toEqual({ page: 3, limit: 25, skip: 50, take: 25 });
  });

  it('clamps limit to MAX_LIMIT', () => {
    const r = parsePagination({ limit: 9999 } as any);
    expect(r.limit).toBe(MAX_LIMIT);
  });

  it('floors negative or zero page to 1', () => {
    expect(parsePagination({ page: 0 } as any).page).toBe(1);
    expect(parsePagination({ page: -5 } as any).page).toBe(1);
  });

  it('floors negative or zero limit to 1', () => {
    expect(parsePagination({ limit: 0 } as any).limit).toBe(1);
    expect(parsePagination({ limit: -100 } as any).limit).toBe(1);
  });

  it('computes skip correctly for page > 1', () => {
    const r = parsePagination({ page: 4, limit: 20 } as any);
    expect(r.skip).toBe(60);
    expect(r.take).toBe(20);
  });
});

describe('envelope', () => {
  it('wraps items + total + page + limit + hasMore', () => {
    const env = envelope([{ id: 1 }, { id: 2 }], 100, 1, 10);
    expect(env).toEqual({
      items: [{ id: 1 }, { id: 2 }],
      total: 100,
      page: 1,
      limit: 10,
      hasMore: true
    });
  });

  it('sets hasMore=false on the last page', () => {
    const env = envelope([{ id: 91 }], 91, 10, 10);
    expect(env.hasMore).toBe(false);
  });

  it('sets hasMore=true when total is unknown and we got a full page', () => {
    const env = envelope(new Array(10).fill({ id: 1 }), null, 1, 10);
    expect(env.hasMore).toBe(true);
  });

  it('sets hasMore=false when total is unknown and the page was short', () => {
    const env = envelope([{ id: 1 }], null, 1, 10);
    expect(env.hasMore).toBe(false);
  });

  it('falls back to items.length when total is null', () => {
    const env = envelope([{ id: 1 }, { id: 2 }, { id: 3 }], null, 1, 10);
    expect(env.total).toBe(3);
  });
});
