// Cursor pagination helper tests — covers encode/decode round-trip,
// tampering detection, limit clamping, afterCursorWhere Prisma clause,
// and splitPage sentinel-row logic.
import { describe, it, expect } from 'vitest';
import {
  encodeCursor, decodeCursor, parseCursor, afterCursorWhere, splitPage,
  Cursor
} from '../src/utils/cursorPaginate';

describe('encodeCursor / decodeCursor', () => {
  it('round-trips a cursor with a numeric value + id', () => {
    const c = encodeCursor(1700000000000, 'abc-123');
    expect(decodeCursor(c)).toEqual({ v: 1, id: 'abc-123', value: 1700000000000 } as any);
  });

  it('returns null when the cursor is missing', () => {
    expect(decodeCursor(null)).toBeNull();
    expect(decodeCursor(undefined)).toBeNull();
    expect(decodeCursor('')).toBeNull();
  });

  it('returns null for tampered (non-base64url) input', () => {
    expect(decodeCursor('!!!not-base64!!!')).toBeNull();
  });

  it('returns null for a JSON payload missing required fields', () => {
    // Valid base64 but bad JSON shape
    const bad = Buffer.from('{"v":1}', 'utf8').toString('base64')
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    expect(decodeCursor(bad)).toBeNull();
  });

  it('returns null for a future cursor version (incompatible)', () => {
    const future = Buffer.from(JSON.stringify({ v: 99, value: 1, id: 'x' }), 'utf8')
      .toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    expect(decodeCursor(future)).toBeNull();
  });

  it('produces a URL-safe string (no +, /, = characters)', () => {
    const c = encodeCursor(12345, 'uuid-with-dashes-and-stuff-67890');
    expect(c).not.toMatch(/[+/=]/);
  });
});

describe('parseCursor', () => {
  it('defaults to limit=50 when called with no input', () => {
    const r = parseCursor(undefined);
    expect(r.limit).toBe(50);
    expect(r.cursor).toBeNull();
    expect(r.take).toBe(51); // +1 sentinel
  });

  it('parses cursor + limit from string input', () => {
    const token = encodeCursor(1700, 'uuid-1');
    const r = parseCursor({ cursor: token, limit: '25' });
    expect(r.limit).toBe(25);
    expect(r.take).toBe(26);
    expect(r.cursor?.id).toBe('uuid-1');
  });

  it('clamps limit to the MAX of 200', () => {
    const r = parseCursor({ limit: 9999 });
    expect(r.limit).toBe(200);
    expect(r.take).toBe(201);
  });

  it('floors a limit of 0 (or negative) to 1', () => {
    expect(parseCursor({ limit: 0 }).limit).toBe(1);
    expect(parseCursor({ limit: -5 }).limit).toBe(1);
  });

  it('ignores an unparseable cursor (caller can fall back to start)', () => {
    const r = parseCursor({ cursor: 'garbage' });
    expect(r.cursor).toBeNull();
  });
});

describe('afterCursorWhere', () => {
  it('produces an OR-of-two-cases WHERE for DESC order on createdAt', () => {
    const c: Cursor = { v: 1700000000000, id: 'uuid-1' };
    const where = afterCursorWhere(c);
    // Two branches: strictly older, OR same time + lower id
    expect(where.OR).toHaveLength(2);
    expect(where.OR![0]).toMatchObject({ createdAt: { lt: new Date(1700000000000) } });
    expect(where.OR![1]).toMatchObject({ createdAt: new Date(1700000000000), id: { lt: 'uuid-1' } });
  });

  it('uses the caller-provided sortField', () => {
    const c: Cursor = { v: 500, id: 'x' };
    const where = afterCursorWhere(c, 'updatedAt');
    expect(where.OR![0]).toMatchObject({ updatedAt: { lt: new Date(500) } });
  });
});

describe('splitPage', () => {
  it('returns all rows + hasMore=false + null cursor when the page is short', () => {
    const rows = [{ id: 'a', createdAt: new Date(1) }, { id: 'b', createdAt: new Date(2) }];
    const out = splitPage(rows, 50);
    expect(out.items).toEqual(rows);
    expect(out.hasMore).toBe(false);
    expect(out.nextCursor).toBeNull();
  });

  it('strips the sentinel row and emits a nextCursor', () => {
    // We asked for limit=2 but the query returned 3 rows (the +1 sentinel)
    const rows = [
      { id: 'c', createdAt: new Date(30) },
      { id: 'b', createdAt: new Date(20) },
      { id: 'a', createdAt: new Date(10) } // sentinel — gets stripped
    ];
    const out = splitPage(rows, 2);
    expect(out.items).toHaveLength(2);
    expect(out.items[0].id).toBe('c');
    expect(out.items[1].id).toBe('b');
    expect(out.hasMore).toBe(true);
    expect(out.nextCursor).not.toBeNull();
    // The cursor should encode the LAST item of the page (b at value=20)
    const decoded = decodeCursor(out.nextCursor!);
    expect(decoded?.id).toBe('b');
    expect(decoded?.value).toBe(20);
  });

  it('handles exactly limit rows (no sentinel) as "no more"', () => {
    const rows = [
      { id: 'c', createdAt: new Date(30) },
      { id: 'b', createdAt: new Date(20) }
    ];
    const out = splitPage(rows, 2);
    expect(out.hasMore).toBe(false);
    expect(out.nextCursor).toBeNull();
  });
});
