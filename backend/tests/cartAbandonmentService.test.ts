// Pure-logic tests for cartAbandonmentService. We mock the
// Prisma singleton so we never need a real DB. The tests
// exercise the dedupe + expire + notification flow with fake
// rows, then assert the sweeper picks up the right ones.
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Hoist the prisma mocks too so they survive vi.resetModules().
const prismaMocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  findFirst: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  updateMany: vi.fn(),
  deleteMany: vi.fn()
}));
const findManyMock = prismaMocks.findMany;
const findFirstMock = prismaMocks.findFirst;
const createMock = prismaMocks.create;
const updateMock = prismaMocks.update;
const updateManyMock = prismaMocks.updateMany;
const deleteManyMock = prismaMocks.deleteMany;

vi.mock('../src/lib/prisma', () => ({
  default: {
    cartAbandonment: {
      findMany: (...args: any[]) => prismaMocks.findMany(...args),
      findFirst: (...args: any[]) => prismaMocks.findFirst(...args),
      create: (...args: any[]) => prismaMocks.create(...args),
      update: (...args: any[]) => prismaMocks.update(...args),
      updateMany: (...args: any[]) => prismaMocks.updateMany(...args),
      deleteMany: (...args: any[]) => prismaMocks.deleteMany(...args)
    }
  }
}));

// Mock sendToUser so we can assert which payloads would have
// been dispatched, without actually hitting the web push API.
// We use a hoisted mock so the factory picks up the same fn
// across the vi.resetModules() boundaries inside our tests.
const { sendToUserMock } = vi.hoisted(() => ({ sendToUserMock: vi.fn() }));
vi.mock('../src/services/pushService', () => ({
  sendToUser: (...args: any[]) => sendToUserMock(...args)
}));

// Reset module-level state so the test sweeper handle from a
// previous test doesn't bleed across describes.
// We use mockClear (not mockReset, which would also reset
// implementations set per-test) and rely on the hoisted mocks
// to share references between vi.mock factories.
beforeEach(() => {
  sendToUserMock.mockClear();
  findManyMock.mockReset();
  findFirstMock.mockReset();
  createMock.mockReset();
  updateMock.mockReset();
  updateManyMock.mockReset();
  deleteManyMock.mockReset();
});

describe('cartAbandonmentService — trackActivity', () => {
  it('creates a new pending row when no prior abandonment exists', async () => {
    findFirstMock.mockResolvedValue(null);
    createMock.mockResolvedValue({ id: 'new-row' });

    const mod = await import('../src/services/cartAbandonmentService');
    await mod.trackActivity({
      userId: 'u-1',
      guestId: null,
      items: [
        { id: 'p-1', name: 'Vitamin C', basePriceKgs: 10, quantity: 1, imageUrl: '/uploads/x.webp' }
      ],
      totalKgs: 900
    });

    expect(createMock).toHaveBeenCalledTimes(1);
    const call = createMock.mock.calls[0][0];
    expect(call.data.userId).toBe('u-1');
    expect(call.data.status).toBe('pending');
    expect(call.data.lastProductId).toBe('p-1');
    expect(call.data.lastProductName).toBe('Vitamin C');
    expect(call.data.cartTotalKgs).toBe(900);
  });

  it('updates the existing pending row instead of creating a duplicate', async () => {
    findFirstMock.mockResolvedValue({ id: 'existing', status: 'pending' });
    updateMock.mockResolvedValue({ id: 'existing' });

    const mod = await import('../src/services/cartAbandonmentService');
    await mod.trackActivity({
      userId: 'u-1',
      guestId: null,
      items: [{ id: 'p-2', name: 'Omega 3', basePriceKgs: 20, quantity: 1 }],
      totalKgs: 1800
    });

    expect(createMock).not.toHaveBeenCalled();
    expect(updateMock).toHaveBeenCalledTimes(1);
    const call = updateMock.mock.calls[0][0];
    expect(call.where.id).toBe('existing');
    expect(call.data.lastProductName).toBe('Omega 3');
  });

  it('skips tracking when neither userId nor guestId is present', async () => {
    const mod = await import('../src/services/cartAbandonmentService');
    await mod.trackActivity({
      userId: null,
      guestId: null,
      items: [{ id: 'p-1', name: 'X', basePriceKgs: 1, quantity: 1 }],
      totalKgs: 90
    });
    expect(createMock).not.toHaveBeenCalled();
    expect(updateMock).not.toHaveBeenCalled();
  });

  it('clears any prior abandonment when the cart is empty', async () => {
    deleteManyMock.mockResolvedValue({ count: 1 });
    const mod = await import('../src/services/cartAbandonmentService');
    await mod.trackActivity({
      userId: 'u-1',
      guestId: null,
      items: [],
      totalKgs: 0
    });
    expect(deleteManyMock).toHaveBeenCalledTimes(1);
    expect(createMock).not.toHaveBeenCalled();
  });
});

describe('cartAbandonmentService — markConverted', () => {
  it('flips status to converted for the matching user', async () => {
    updateManyMock.mockResolvedValue({ count: 1 });
    const mod = await import('../src/services/cartAbandonmentService');
    await mod.markConverted('u-1', null);
    expect(updateManyMock).toHaveBeenCalledTimes(1);
    const call = updateManyMock.mock.calls[0][0];
    expect(call.data.status).toBe('converted');
    expect(call.data.convertedAt).toBeInstanceOf(Date);
  });
});

describe('cartAbandonmentService — clearAbandonment', () => {
  it('removes the row so the sweeper stops nagging', async () => {
    deleteManyMock.mockResolvedValue({ count: 1 });
    const mod = await import('../src/services/cartAbandonmentService');
    await mod.clearAbandonment('u-1', null);
    expect(deleteManyMock).toHaveBeenCalledTimes(1);
    const call = deleteManyMock.mock.calls[0][0];
    expect(call.where.OR).toBeDefined();
  });
});

describe('cartAbandonmentService — sweepAbandonedCarts', () => {
  it('skips rows that are still inside the 1h window', async () => {
    findManyMock.mockResolvedValueOnce([]); // no rows past cutoff
    updateManyMock.mockResolvedValue({ count: 0 }); // expire sweep
    const mod = await import('../src/services/cartAbandonmentService');
    const result = await mod.sweepAbandonedCarts();
    expect(result.processed).toBe(0);
    expect(sendToUserMock).not.toHaveBeenCalled();
  });

  it('dispatches a push for a row past the 1h cutoff', async () => {
    findManyMock.mockResolvedValueOnce([
      {
        id: 'old-1',
        userId: 'u-99',
        guestId: null,
        status: 'pending',
        lastProductId: 'p-1',
        lastProductName: 'Vitamin C',
        lastProductImg: '/uploads/x.webp',
        cartItems: JSON.stringify([
          { id: 'p-1', name: 'Vitamin C', basePriceKgs: 10, quantity: 1 }
        ]),
        cartTotalKgs: 900,
        lastActivityAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
      }
    ]);
    updateManyMock.mockResolvedValue({ count: 1 });
    sendToUserMock.mockResolvedValue({ sent: 1, failed: 0, expired: 0 });
    const mod = await import('../src/services/cartAbandonmentService');
    const result = await mod.sweepAbandonedCarts();
    expect(result.processed).toBe(1);
    expect(sendToUserMock).toHaveBeenCalledTimes(1);
    const [userId, payload] = sendToUserMock.mock.calls[0];
    expect(userId).toBe('u-99');
    expect(payload.eventKey).toBe('cart_abandoned');
    expect(payload.title).toContain('корзин'); // default RU title
    expect(payload.body).toContain('Vitamin C');
    expect(payload.data.url).toBe('/checkout');
  });

  it('skips a row whose status was changed to notified between the find and the update', async () => {
    // findMany returns the row
    findManyMock.mockResolvedValueOnce([
      { id: 'r-1', userId: 'u-1', cartItems: '[]', cartTotalKgs: 0, lastProductName: 'X' }
    ]);
    // First updateMany = "mark as notified" — count 0 (someone else flipped it)
    updateManyMock.mockResolvedValueOnce({ count: 0 });
    // Second updateMany = expiry sweep — count 0
    updateManyMock.mockResolvedValueOnce({ count: 0 });
    const mod = await import('../src/services/cartAbandonmentService');
    const result = await mod.sweepAbandonedCarts();
    expect(result.skipped).toBe(1);
    expect(sendToUserMock).not.toHaveBeenCalled();
  });

  it('skips guest carts (userId=null) — no endpoint to deliver to', async () => {
    findManyMock.mockResolvedValueOnce([]); // server-side query filters userId: { not: null }
    updateManyMock.mockResolvedValue({ count: 0 });
    const mod = await import('../src/services/cartAbandonmentService');
    const result = await mod.sweepAbandonedCarts();
    expect(result.processed).toBe(0);
  });

  it('marks very old rows as expired in the same tick', async () => {
    findManyMock.mockResolvedValueOnce([]);
    // The second findMany is the expiry sweep
    updateManyMock.mockResolvedValueOnce({ count: 3 });
    const mod = await import('../src/services/cartAbandonmentService');
    const result = await mod.sweepAbandonedCarts();
    expect(result.expired).toBe(3);
  });

  it('catches errors per row and keeps ticking', async () => {
    findManyMock.mockResolvedValueOnce([
      { id: 'r-1', userId: 'u-1', cartItems: '[]', cartTotalKgs: 0, lastProductName: 'X' }
    ]);
    // First updateMany = the "mark as notified" call → count 1
    updateManyMock.mockResolvedValueOnce({ count: 1 });
    // Second updateMany = the expiry sweep → count 0
    updateManyMock.mockResolvedValueOnce({ count: 0 });
    sendToUserMock.mockRejectedValueOnce(new Error('push failed'));
    const mod = await import('../src/services/cartAbandonmentService');
    const result = await mod.sweepAbandonedCarts();
    expect(result.errors).toBe(1);
  });
});

describe('cartAbandonmentService — push body builder (localised titles)', () => {
  it('KG title uses the KG template', async () => {
    const mod = await import('../src/services/cartAbandonmentService');
    const payload = mod.__test.buildPushPayload({
      lastProductName: 'Vitamin C',
      cartTotalKgs: 900,
      cartItems: JSON.stringify([
        { id: 'p-1', name: 'Vitamin C', basePriceKgs: 10, quantity: 2 }
      ])
    }, 'kg');
    expect(payload.title).toContain('күтүп жатат');
    expect(payload.body).toContain('Vitamin C');
  });

  it('TR body uses the KGS suffix', async () => {
    const mod = await import('../src/services/cartAbandonmentService');
    const payload = mod.__test.buildPushPayload({
      lastProductName: 'Omega 3',
      cartTotalKgs: 1800,
      cartItems: JSON.stringify([
        { id: 'p-1', name: 'Omega 3', basePriceKgs: 20, quantity: 1 }
      ])
    }, 'tr');
    expect(payload.body).toContain('KGS');
  });

  it('falls back to RU when locale is unknown', async () => {
    const mod = await import('../src/services/cartAbandonmentService');
    const payload = mod.__test.buildPushPayload({
      lastProductName: 'Collagen',
      cartTotalKgs: 5000,
      cartItems: JSON.stringify([
        { id: 'p-1', name: 'Collagen', basePriceKgs: 50, quantity: 1 }
      ])
    }, 'xx');
    expect(payload.title).toContain('ждёт');
  });

  it('eventKey is always cart_abandoned', async () => {
    const mod = await import('../src/services/cartAbandonmentService');
    const payload = mod.__test.buildPushPayload({
      lastProductName: 'X', cartTotalKgs: 0, cartItems: '[]'
    }, 'ru');
    expect(payload.eventKey).toBe('cart_abandoned');
  });
});
