// Admin cart-recovery analytics.
//
// The in-memory `CartAbandonment` rows power the push reminder
// flow but are not queryable by SQL. This service builds the
// aggregated metrics the dashboard needs by combining:
//   • CartAbandonment rows (pending / notified / converted / expired)
//   • getAllCounts() from presence (active viewers per product)
//   • recentOrderCount() from inventory (FOMO counters)
//   • Product join (so we can show names + thumbnails + prices)
//
// The dashboard refreshes every 30s; expensive aggregations are
// cached in-memory for 15s to keep the admin route cheap.

import prisma from '../lib/prisma';
import { getAllCounts as getPresenceAll } from './presenceService';
import { recentOrderCount as inventoryRecentCount } from './inventoryService';

interface CacheEntry<T> {
  at: number;
  value: T;
}

const cache = new Map<string, CacheEntry<any>>();
const CACHE_TTL_MS = 15 * 1000;

const getCached = async <T>(key: string, loader: () => Promise<T>): Promise<T> => {
  const now = Date.now();
  const hit = cache.get(key) as CacheEntry<T> | undefined;
  if (hit && now - hit.at < CACHE_TTL_MS) return hit.value;
  const value = await loader();
  cache.set(key, { at: now, value });
  return value;
};

export interface CartRecoveryKpis {
  pending: number;
  notified: number;
  converted: number;
  expired: number;
  conversionRate: number;          // converted / (converted + notified)
  pendingValueKgs: number;         // sum of cartTotalKgs where pending
  pendingValueUsd: number;
  recoveredValueKgs: number;       // sum of converted carts' totalKgs
  recoveredValueUsd: number;
  activeSessions: number;          // presence sum
  recentOrdersLast10m: number;     // inventory FOMO counter
  topProducts: Array<{ productId: string; name: string; imageUrl: string; abandonedCount: number; totalValueKgs: number; lastSeenAt: string }>;
  recent: Array<{ id: string; userId: string | null; guestId: string | null; status: string; cartTotalKgs: number; lastActivityAt: string; productName?: string; productImage?: string }>;
}

/**
 * Aggregate all the cart-recovery KPIs in a single call. Returns
 * 0s + empty arrays if no data is available (e.g. no abandoned
 * carts yet today). All numbers are safe to display in the
 * admin dashboard.
 */
export const getCartRecoveryKpis = async (): Promise<CartRecoveryKpis> => {
  return getCached('kpis', async () => {
    // Count by status
    const groups = await prisma.cartAbandonment.groupBy({
      by: ['status'],
      _count: { _all: true },
      _sum: { cartTotalKgs: true, cartTotalUsd: true }
    });
    const empty = { pending: 0, notified: 0, converted: 0, expired: 0, sumKgs: 0, sumUsd: 0 };
    const counts = { ...empty };
    for (const g of groups) {
      const key = g.status as keyof typeof empty;
      if (key in counts) {
        counts[key] = g._count._all;
        counts.sumKgs += Number(g._sum.cartTotalKgs) || 0;
        counts.sumUsd += Number(g._sum.cartTotalUsd) || 0;
      }
    }

    // Recovered (converted) value — sum of carts that converted
    const convertedAgg = await prisma.cartAbandonment.aggregate({
      where: { status: 'converted' },
      _sum: { cartTotalKgs: true, cartTotalUsd: true }
    });

    // Pending value
    const pendingAgg = await prisma.cartAbandonment.aggregate({
      where: { status: { in: ['pending', 'notified'] } },
      _sum: { cartTotalKgs: true, cartTotalUsd: true }
    });

    const pendingValueKgs = Number(pendingAgg._sum.cartTotalKgs) || 0;
    const pendingValueUsd = Number(pendingAgg._sum.cartTotalUsd) || 0;
    const recoveredValueKgs = Number(convertedAgg._sum.cartTotalKgs) || 0;
    const recoveredValueUsd = Number(convertedAgg._sum.cartTotalUsd) || 0;

    // Conversion rate (avoid /0)
    const totalTouched = counts.notified + counts.converted;
    const conversionRate = totalTouched > 0 ? counts.converted / totalTouched : 0;

    // Top products by abandoned count
    const top = await prisma.cartAbandonment.groupBy({
      by: ['lastProductId'],
      _count: { _all: true },
      _sum: { cartTotalKgs: true },
      orderBy: { _count: { id: 'desc' } },
      take: 8,
      where: { lastProductId: { not: null }, status: { in: ['pending', 'notified', 'converted'] } }
    });

    const productIds = top.map((t) => t.lastProductId).filter(Boolean) as string[];
    const products = productIds.length
      ? await prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, name: true, images: true, translations: true }
        })
      : [];
    const productMap = new Map(products.map((p) => [p.id, p]));

    // Pick the first product image (raw JSON shape, similar to
    // what ProductGridBlock does on the frontend)
    const pickImage = (raw: any): string => {
      if (Array.isArray(raw) && raw.length > 0) {
        const first = raw[0];
        if (typeof first === 'string') return first;
        if (first?.imageUrl) return String(first.imageUrl);
      }
      return '';
    };
    const pickName = (p: any): string => {
      try {
        const tr = typeof p.translations === 'string' ? JSON.parse(p.translations) : p.translations;
        return tr?.ru?.name || tr?.kg?.name || tr?.en?.name || tr?.tr?.name || p.name || '—';
      } catch { return p.name || '—'; }
    };

    const topProducts = top.map((t) => {
      const p = t.lastProductId ? productMap.get(t.lastProductId) : null;
      return {
        productId: t.lastProductId || '',
        name: p ? pickName(p) : '—',
        imageUrl: p ? pickImage(p.images) : '',
        abandonedCount: t._count._all,
        totalValueKgs: Number(t._sum.cartTotalKgs) || 0,
        lastSeenAt: new Date().toISOString()
      };
    });

    // Recent rows for the activity table
    const recent = await prisma.cartAbandonment.findMany({
      orderBy: { lastActivityAt: 'desc' },
      take: 20,
      where: { status: { in: ['pending', 'notified', 'converted'] } }
    });
    const recentIds = recent.map((r) => r.lastProductId).filter(Boolean) as string[];
    const recentProducts = recentIds.length
      ? await prisma.product.findMany({
          where: { id: { in: recentIds } },
          select: { id: true, name: true, images: true, translations: true }
        })
      : [];
    const recentMap = new Map(recentProducts.map((p) => [p.id, p]));
    const recentRows = recent.map((r) => {
      const p = r.lastProductId ? recentMap.get(r.lastProductId) : null;
      return {
        id: r.id,
        userId: r.userId,
        guestId: r.guestId,
        status: r.status,
        cartTotalKgs: Number(r.cartTotalKgs) || 0,
        lastActivityAt: r.lastActivityAt.toISOString(),
        productName: p ? pickName(p) : undefined,
        productImage: p ? pickImage(p.images) : undefined
      };
    });

    // Presence: sum of active viewers across all products
    const presence = getPresenceAll();
    const activeSessions = presence.reduce((s, p) => s + p.count, 0);

    // Inventory FOMO: aggregate recent orders across all
    // products that have abandonment in the last 10 min.
    // (We only call this for products with recent activity to
    // avoid an O(products) scan.)
    const recentTouched = await prisma.cartAbandonment.findMany({
      where: { lastActivityAt: { gt: new Date(Date.now() - 10 * 60 * 1000) } },
      select: { lastProductId: true },
      distinct: ['lastProductId']
    });
    const fomoIds = recentTouched.map((r) => r.lastProductId).filter(Boolean) as string[];
    let recentOrdersLast10m = 0;
    for (const id of fomoIds) recentOrdersLast10m += inventoryRecentCount(id, 10 * 60 * 1000);

    return {
      pending: counts.pending,
      notified: counts.notified,
      converted: counts.converted,
      expired: counts.expired,
      conversionRate,
      pendingValueKgs,
      pendingValueUsd,
      recoveredValueKgs,
      recoveredValueUsd,
      activeSessions,
      recentOrdersLast10m,
      topProducts,
      recent: recentRows
    };
  });
};

export const __test = { cache, CACHE_TTL_MS };

export default { getCartRecoveryKpis };
