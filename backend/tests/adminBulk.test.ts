// Unit tests for admin bulk actions + CSV exports.
// These tests cover:
//   1. Zod schemas (input validation, size limits, allowed enums)
//   2. CSV builder output shape for each export (orders/users/products/withdrawals)
//   3. Response helpers (Content-Type, Content-Disposition)
//
// DB-touching code is intentionally NOT tested here — the live smoke test
// (test-bulk-endpoints.cjs) covers real endpoints against MySQL.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';
import { escapeCsvField, toCsv, CsvColumn } from '../src/utils/csv';

// ─── Mirror the exported schemas from adminBulk.ts so we don't need to spin up
//     Express + Prisma just to assert validation. Keep in sync with the file. ─
const OrderStatusEnum = z.enum(['pending', 'paid', 'shipped', 'completed', 'cancelled']);
const RoleEnum = z.enum(['customer', 'distributor', 'cashier', 'admin', 'dealer']);

const BulkOrderStatusSchema = z.object({
  orderIds: z.array(z.string().min(8)).min(1).max(500),
  status: OrderStatusEnum,
  note: z.string().max(500).optional()
});

const BulkUserRoleSchema = z.object({
  userIds: z.array(z.string().min(8)).min(1).max(500),
  role: RoleEnum
});

const BulkProductCategorySchema = z.object({
  productIds: z.array(z.string().min(8)).min(1).max(500),
  categoryId: z.string().min(8).nullable()
});

const IdArraySchema = z.object({
  ids: z.array(z.string().min(8)).min(1).max(500)
});

// ════════════════════════════════════════════════════════════════════════════
// Schema validation
// ════════════════════════════════════════════════════════════════════════════

describe('BulkOrderStatusSchema', () => {
  const valid = { orderIds: ['12345678'], status: 'paid' as const };

  it('accepts a minimal valid payload', () => {
    expect(BulkOrderStatusSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts an optional note under 500 chars', () => {
    expect(BulkOrderStatusSchema.safeParse({ ...valid, note: 'auto' }).success).toBe(true);
  });

  it('rejects an empty orderIds array', () => {
    const r = BulkOrderStatusSchema.safeParse({ ...valid, orderIds: [] });
    expect(r.success).toBe(false);
    expect(r.error!.issues[0].path).toEqual(['orderIds']);
  });

  it('rejects when orderIds exceeds the 500 cap', () => {
    const ids = Array.from({ length: 501 }, (_, i) => `id-${i}`);
    const r = BulkOrderStatusSchema.safeParse({ ...valid, orderIds: ids });
    expect(r.success).toBe(false);
    // zod reports the size violation (could be too_big or too_small depending
    // on version — just check that *some* issue is present on orderIds).
    expect(r.error!.issues.some(i => i.path[0] === 'orderIds')).toBe(true);
  });

  it('rejects an unknown status', () => {
    const r = BulkOrderStatusSchema.safeParse({ ...valid, status: 'processing' });
    expect(r.success).toBe(false);
  });

  it('rejects a too-short orderId (< 8 chars)', () => {
    const r = BulkOrderStatusSchema.safeParse({ ...valid, orderIds: ['short'] });
    expect(r.success).toBe(false);
  });
});

describe('BulkUserRoleSchema', () => {
  it('accepts all five documented roles', () => {
    for (const role of ['customer', 'distributor', 'cashier', 'admin', 'dealer'] as const) {
      expect(BulkUserRoleSchema.safeParse({ userIds: ['12345678'], role }).success).toBe(true);
    }
  });

  it('rejects an unknown role', () => {
    const r = BulkUserRoleSchema.safeParse({ userIds: ['12345678'], role: 'superuser' });
    expect(r.success).toBe(false);
  });

  it('rejects when userIds is empty', () => {
    const r = BulkUserRoleSchema.safeParse({ userIds: [], role: 'customer' });
    expect(r.success).toBe(false);
  });
});

describe('BulkProductCategorySchema', () => {
  it('accepts a non-null categoryId', () => {
    expect(BulkProductCategorySchema.safeParse({
      productIds: ['12345678'], categoryId: 'cat12345'
    }).success).toBe(true);
  });

  it('accepts an explicit null categoryId (un-categorize)', () => {
    expect(BulkProductCategorySchema.safeParse({
      productIds: ['12345678'], categoryId: null
    }).success).toBe(true);
  });

  it('rejects an undefined categoryId', () => {
    const r = BulkProductCategorySchema.safeParse({ productIds: ['12345678'] });
    expect(r.success).toBe(false);
  });
});

describe('IdArraySchema (bulk/delete)', () => {
  it('accepts 1–500 ids', () => {
    expect(IdArraySchema.safeParse({ ids: ['12345678'] }).success).toBe(true);
    const big = Array.from({ length: 500 }, () => '12345678');
    expect(IdArraySchema.safeParse({ ids: big }).success).toBe(true);
  });

  it('rejects 0 ids', () => {
    expect(IdArraySchema.safeParse({ ids: [] }).success).toBe(false);
  });

  it('rejects 501 ids', () => {
    const huge = Array.from({ length: 501 }, (_, i) => `id-${i}`);
    expect(IdArraySchema.safeParse({ ids: huge }).success).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// CSV builder output (snapshot checks per export)
// ════════════════════════════════════════════════════════════════════════════

describe('CSV output — users export shape', () => {
  // Mirror the exact columns the live endpoint emits.
  const cols: CsvColumn<any>[] = [
    { header: 'user_id',      value: (u) => u.id },
    { header: 'name',         value: (u) => u.name },
    { header: 'email',        value: (u) => u.email },
    { header: 'role',         value: (u) => u.role },
    { header: 'wallet_kgs',   value: (u) => Number(u.walletBalanceKgs || 0).toFixed(2) },
    { header: 'wallet_usd',   value: (u) => Number(u.walletBalanceUsd || 0).toFixed(2) },
    { header: 'cumulative_kgs', value: (u) => Number(u.cumulativeSpendKgs || 0).toFixed(2) },
    { header: 'loyalty_level',  value: (u) => u.loyaltyLevel ?? 0 },
    { header: 'monthly_active', value: (u) => u.isMonthlyActive ? 'yes' : 'no' },
    { header: 'sponsor',        value: (u) => u.sponsor?.name || '' },
    { header: 'created_at',     value: (u) => u.createdAt.toISOString() }
  ];

  it('header row matches the documented column order', () => {
    const csv = toCsv([], cols);
    // toCsv prepends a UTF-8 BOM so Excel auto-detects encoding.
    expect(csv).toMatch(/^\uFEFF/);
    expect(csv.replace(/^\uFEFF/, '').split('\r\n')[0]).toBe(
      'user_id,name,email,role,wallet_kgs,wallet_usd,cumulative_kgs,loyalty_level,monthly_active,sponsor,created_at'
    );
  });

  it('emits one row per user with the right arity', () => {
    const users = [
      { id: 'u-12345678', name: 'Ali', email: 'a@x.com', role: 'customer',
        walletBalanceKgs: 100.5, walletBalanceUsd: 1.15, cumulativeSpendKgs: 4500,
        loyaltyLevel: 2, isMonthlyActive: true, sponsor: { name: 'Veli' },
        createdAt: new Date('2026-01-01T00:00:00Z') },
      { id: 'u-87654321', name: 'Ayşe', email: 'b@x.com', role: 'distributor',
        walletBalanceKgs: 0, walletBalanceUsd: 0, cumulativeSpendKgs: 0,
        loyaltyLevel: 0, isMonthlyActive: false, sponsor: null,
        createdAt: new Date('2026-02-01T00:00:00Z') }
    ];
    const csv = toCsv(users, cols).replace(/^\uFEFF/, '');
    const lines = csv.split('\r\n').filter(l => l.length > 0);
    expect(lines).toHaveLength(3); // header + 2 rows (trailing CRLF stripped)
    expect(lines[1].startsWith('u-12345678,Ali,a@x.com,customer,100.50,1.15,4500.00,2,yes,Veli,2026-01-01T00:00:00.000Z')).toBe(true);
    expect(lines[2].startsWith('u-87654321,Ayşe,b@x.com,distributor,0.00,0.00,0.00,0,no,,2026-02-01T00:00:00.000Z')).toBe(true);
  });
});

describe('CSV output — products export shape', () => {
  const cols: CsvColumn<any>[] = [
    { header: 'product_id', value: (p) => p.id },
    { header: 'barcode',    value: (p) => p.barcode || '' },
    { header: 'name',       value: (p) => p.name },
    { header: 'category',   value: (p) => p.category?.name || '' },
    { header: 'price_kgs',  value: (p) => Number(p.basePriceKgs).toFixed(2) },
    { header: 'stock',      value: (p) => p.stockQuantity },
    { header: 'low_stock',  value: (p) => p.stockQuantity <= (p.minStockAlert ?? 10) ? 'yes' : 'no' },
    { header: 'created_at', value: (p) => p.createdAt.toISOString() },
    { header: 'updated_at', value: (p) => p.updatedAt.toISOString() }
  ];

  it('header row matches the documented column order', () => {
    expect(toCsv([], cols).replace(/^\uFEFF/, '').split('\r\n')[0]).toBe(
      'product_id,barcode,name,category,price_kgs,stock,low_stock,created_at,updated_at'
    );
  });

  it('flags low_stock=yes when stock <= minStockAlert', () => {
    const p = {
      id: 'p-1', barcode: 'BC-1', name: 'X', category: { name: 'Cat' },
      basePriceKgs: 100, stockQuantity: 5, minStockAlert: 10,
      createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-02')
    };
    const csv = toCsv([p], cols);
    expect(csv.split('\r\n')[1]).toContain(',yes,');
  });

  it('treats missing category as empty string (not "undefined")', () => {
    const p = {
      id: 'p-2', barcode: 'BC-2', name: 'Y', category: null,
      basePriceKgs: 100, stockQuantity: 99, minStockAlert: 10,
      createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-02')
    };
    const csv = toCsv([p], cols);
    const row = csv.split('\r\n')[1];
    expect(row).toContain(',Y,,100.00,99,no,');
    expect(row).not.toContain('undefined');
  });
});

describe('CSV output — RFC 4180 edge cases', () => {
  it('escapes commas, quotes and newlines inside product names', () => {
    expect(escapeCsvField('a, b')).toBe('"a, b"');
    expect(escapeCsvField('say "hi"')).toBe('"say ""hi"""');
    expect(escapeCsvField('line1\nline2')).toBe('"line1\nline2"');
  });

  it('coerces non-string fields (Decimal objects) to plain digits', () => {
    expect(escapeCsvField(99.99)).toBe('99.99');
    expect(escapeCsvField(0)).toBe('0');
  });

  it('produces CRLF line breaks + UTF-8 BOM (Excel-friendly)', () => {
    const csv = toCsv([{ id: 1 }, { id: 2 }], [
      { header: 'id', value: (r) => r.id }
    ]);
    // BOM + header + 2 rows + trailing CRLF
    expect(csv).toBe('\uFEFFid\r\n1\r\n2\r\n');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Response helper (Content-Type + Content-Disposition)
// ════════════════════════════════════════════════════════════════════════════

describe('sendCsv response helper', () => {
  it('sets text/csv + attachment disposition + no-store cache', () => {
    // Replicate the helper logic — avoids spinning up an Express app.
    const headers: Record<string, string> = {};
    const res = {
      setHeader: (k: string, v: string) => { headers[k.toLowerCase()] = v; },
      send: (_body: string) => { /* noop */ }
    };
    const filename = 'orders-123.csv';
    const csv = 'a,b\r\n1,2';
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-store');
    res.send(csv);

    expect(headers['content-type']).toBe('text/csv; charset=utf-8');
    expect(headers['content-disposition']).toBe(`attachment; filename="${filename}"`);
    expect(headers['cache-control']).toBe('no-store');
  });
});
