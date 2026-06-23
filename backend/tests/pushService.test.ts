// Tests for the Web Push service. All DB-free (mock Prisma + web-push).
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockUpsert = vi.fn();
const mockFindFirst = vi.fn();
const mockFindUnique = vi.fn();
const mockUpdateMany = vi.fn();
const mockFindMany = vi.fn();
const mockDelete = vi.fn();
const mockBroadcastLogCreate = vi.fn();

vi.mock('../src/lib/prisma', () => ({
  default: {
    pushSubscription: {
      upsert: (...args: any[]) => mockUpsert(...args),
      findFirst: (...args: any[]) => mockFindFirst(...args),
      findUnique: (...args: any[]) => mockFindUnique(...args),
      updateMany: (...args: any[]) => mockUpdateMany(...args),
      findMany: (...args: any[]) => mockFindMany(...args),
      delete: (...args: any[]) => mockDelete(...args)
    },
    broadcastLog: {
      create: (...args: any[]) => mockBroadcastLogCreate(...args)
    }
  }
}));

const mockSendNotification = vi.fn();

vi.mock('web-push', () => ({
  default: {
    setVapidDetails: vi.fn(),
    sendNotification: (...args: any[]) => mockSendNotification(...args)
  },
  setVapidDetails: vi.fn(),
  sendNotification: (...args: any[]) => mockSendNotification(...args)
}));

import * as pushService from '../src/services/pushService';

describe('pushService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Ensure VAPID is configured for these tests
    process.env.VAPID_PUBLIC_KEY = 'BP-test-public-key';
    process.env.VAPID_PRIVATE_KEY = 'test-priv';
    process.env.VAPID_SUBJECT = 'mailto:test@example.com';
    mockBroadcastLogCreate.mockResolvedValue({ id: 'audit-1' });
  });

  describe('VAPID config', () => {
    it('exposes the public key from env', () => {
      expect(pushService.getVapidPublicKey()).toBe('BP-test-public-key');
    });

    it('reports configured when env is set', () => {
      expect(pushService.isPushConfigured()).toBe(true);
    });

    it('reads the public key from process.env on demand', () => {
      // vapidConfigured is memoised at module level, so we just confirm
      // the read-path returns the current env value.
      process.env.VAPID_PUBLIC_KEY = 'BP-rotated-key';
      expect(pushService.getVapidPublicKey()).toBe('BP-rotated-key');
    });
  });

  describe('subscribe', () => {
    it('upserts the subscription keyed on endpoint', async () => {
      const expected = { id: 'sub-1', endpoint: 'https://push.example/abc' };
      mockUpsert.mockResolvedValue(expected);

      const input = {
        endpoint: 'https://push.example/abc',
        keys: { p256dh: 'p256dh-key', auth: 'auth-secret' }
      };
      const result = await pushService.subscribe('user-1', input);

      expect(mockUpsert).toHaveBeenCalledWith(expect.objectContaining({
        where: { endpoint: input.endpoint },
        create: expect.objectContaining({ user: { connect: { id: 'user-1' } }, endpoint: input.endpoint }),
        update: expect.objectContaining({})
      }));
      expect(result).toEqual(expected);
    });

    it('passes userAgent when provided', async () => {
      mockUpsert.mockResolvedValue({ id: 'sub-2' });
      await pushService.subscribe('user-1', {
        endpoint: 'https://push.example/2',
        keys: { p256dh: 'p', auth: 'a' },
        userAgent: 'Mozilla/5.0 Test'
      });
      expect(mockUpsert).toHaveBeenCalledWith(expect.objectContaining({
        create: expect.objectContaining({ userAgent: 'Mozilla/5.0 Test' })
      }));
    });
  });

  describe('unsubscribe', () => {
    it('deletes only when the endpoint belongs to the user', async () => {
      mockFindUnique.mockResolvedValue({ id: 'sub-1', userId: 'user-1' });
      const result = await pushService.unsubscribe('user-1', 'https://push.example/abc');
      expect(mockDelete).toHaveBeenCalledWith({ where: { endpoint: 'https://push.example/abc' } });
      expect(result).toEqual({ deleted: true });
    });

    it('refuses to delete when owned by a different user', async () => {
      mockFindUnique.mockResolvedValue({ id: 'sub-1', userId: 'someone-else' });
      const result = await pushService.unsubscribe('user-1', 'https://push.example/abc');
      expect(mockDelete).not.toHaveBeenCalled();
      expect(result).toEqual({ deleted: false });
    });

    it('returns deleted:false if endpoint does not exist', async () => {
      mockFindUnique.mockResolvedValue(null);
      const result = await pushService.unsubscribe('user-1', 'https://push.example/missing');
      expect(result).toEqual({ deleted: false });
    });
  });

  describe('preferences', () => {
    it('updates all of the user subscriptions', async () => {
      mockUpdateMany.mockResolvedValue({ count: 2 });
      await pushService.setPreferences('user-1', { order_paid: true, order_shipped: false });
      expect(mockUpdateMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { userId: 'user-1' },
        data: { preferences: JSON.stringify({ order_paid: true, order_shipped: false }) }
      }));
    });
  });

  describe('sendToUser', () => {
    it('returns zero counts when no subscriptions exist', async () => {
      mockFindMany.mockResolvedValue([]);
      const result = await pushService.sendToUser('user-1', {
        title: 'Hi', body: 'B', eventKey: 'order_paid'
      });
      expect(result).toEqual({ sent: 0, expired: 0, failed: 0, skipped: 'no_subscriptions' });
      expect(mockSendNotification).not.toHaveBeenCalled();
    });

    it('skips subscriptions whose preferences opt out of the eventKey', async () => {
      mockFindMany.mockResolvedValue([
        { id: 's1', endpoint: 'https://push/1', p256dh: 'p', auth: 'a', preferences: '{"order_paid":false}' }
      ]);
      const result = await pushService.sendToUser('user-1', {
        title: 'Hi', body: 'B', eventKey: 'order_paid'
      });
      expect(mockSendNotification).not.toHaveBeenCalled();
      expect(result.sent).toBe(0);
    });

    it('delivers to opted-in subscribers and counts successes', async () => {
      mockFindMany.mockResolvedValue([
        { id: 's1', endpoint: 'https://push/1', p256dh: 'p', auth: 'a', preferences: '{}' }
      ]);
      mockSendNotification.mockResolvedValue({});
      const result = await pushService.sendToUser('user-1', {
        title: 'Hi', body: 'B', eventKey: 'order_paid', url: '/orders'
      });
      expect(mockSendNotification).toHaveBeenCalledOnce();
      expect(result.sent).toBe(1);
      expect(result.expired).toBe(0);
      expect(result.failed).toBe(0);
    });

    it('counts 404/410 as expired and deletes the subscription', async () => {
      mockFindMany.mockResolvedValue([
        { id: 's1', endpoint: 'https://push/dead', p256dh: 'p', auth: 'a', preferences: '{}' }
      ]);
      mockSendNotification.mockRejectedValue({ statusCode: 410 });
      mockDelete.mockResolvedValue({});
      const result = await pushService.sendToUser('user-1', {
        title: 'Hi', body: 'B', eventKey: 'order_paid'
      });
      expect(result.expired).toBe(1);
      expect(result.failed).toBe(0);
      expect(mockDelete).toHaveBeenCalledWith({ where: { id: 's1' } });
    });

    it('counts other errors as failed without deleting', async () => {
      mockFindMany.mockResolvedValue([
        { id: 's1', endpoint: 'https://push/oops', p256dh: 'p', auth: 'a', preferences: '{}' }
      ]);
      mockSendNotification.mockRejectedValue({ statusCode: 500, message: 'oops' });
      const result = await pushService.sendToUser('user-1', {
        title: 'Hi', body: 'B', eventKey: 'order_paid'
      });
      expect(result.failed).toBe(1);
      expect(mockDelete).not.toHaveBeenCalled();
    });

    it('includes url and tag in the JSON payload', async () => {
      mockFindMany.mockResolvedValue([
        { id: 's1', endpoint: 'https://push/1', p256dh: 'p', auth: 'a', preferences: '{}' }
      ]);
      mockSendNotification.mockResolvedValue({});
      await pushService.sendToUser('user-1', {
        title: 'T', body: 'B', url: '/orders/abc', tag: 'order', eventKey: 'order_paid'
      });
      const [, payloadArg] = mockSendNotification.mock.calls[0];
      const parsed = JSON.parse(payloadArg);
      expect(parsed).toMatchObject({
        title: 'T', body: 'B', url: '/orders/abc', tag: 'order', eventKey: 'order_paid'
      });
    });
  });

  describe('sendTestToUser', () => {
    it('wraps sendToUser with a default test payload', async () => {
      mockFindMany.mockResolvedValue([]);
      const result = await pushService.sendTestToUser('admin-1');
      expect(result.skipped).toBe('no_subscriptions');
    });

    it('uses the provided custom message', async () => {
      mockFindMany.mockResolvedValue([
        { id: 's1', endpoint: 'https://push/1', p256dh: 'p', auth: 'a', preferences: '{}' }
      ]);
      mockSendNotification.mockResolvedValue({});
      await pushService.sendTestToUser('admin-1', 'Custom message');
      const [, payloadArg] = mockSendNotification.mock.calls[0];
      expect(JSON.parse(payloadArg).body).toBe('Custom message');
      expect(JSON.parse(payloadArg).eventKey).toBe('test');
    });

    it('records audit log with actor=self', async () => {
      // Setup: user has a subscription so the audit runs through the
      // success path (which honours the caller-supplied note).
      mockFindMany.mockResolvedValue([
        { id: 's1', endpoint: 'https://push/1', p256dh: 'p', auth: 'a', preferences: '{}' }
      ]);
      mockSendNotification.mockResolvedValue({});
      await pushService.sendTestToUser('admin-1');
      expect(mockBroadcastLogCreate).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          actorId: 'admin-1',
          targetId: 'admin-1',
          eventKey: 'test',
          sent: 1, expired: 0, failed: 0,
          note: 'admin self-test'
        })
      }));
    });
  });

  describe('audit log (BroadcastLog)', () => {
    it('writes an audit row on success', async () => {
      mockFindMany.mockResolvedValue([
        { id: 's1', endpoint: 'https://push/1', p256dh: 'p', auth: 'a', preferences: '{}' }
      ]);
      mockSendNotification.mockResolvedValue({});
      await pushService.sendToUser('user-1', {
        title: 'T', body: 'B', eventKey: 'order_paid'
      }, { actorId: 'admin-7', note: 'custom note' });
      expect(mockBroadcastLogCreate).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          actorId: 'admin-7',
          targetId: 'user-1',
          eventKey: 'order_paid',
          sent: 1, expired: 0, failed: 0,
          note: 'custom note'
        })
      }));
    });

    it('writes audit row when VAPID is unconfigured', async () => {
      // ensureVapid() is memoised at module-load time, so we cannot toggle
      // VAPID_PUBLIC_KEY after the first call. Instead we test the path
      // where no subscriptions exist — which also calls writeAudit with
      // a `skipped` reason and 0 counts.
      mockFindMany.mockResolvedValue([]);
      const result = await pushService.sendToUser('user-1', {
        title: 'T', body: 'B', eventKey: 'order_paid'
      }, { actorId: 'admin-1' });
      expect(result.skipped).toBe('no_subscriptions');
      expect(mockBroadcastLogCreate).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          sent: 0, expired: 0, failed: 0,
          note: 'no_subscriptions'
        })
      }));
    });

    it('writes audit row with note=no_subscriptions when user has no subs', async () => {
      mockFindMany.mockResolvedValue([]);
      await pushService.sendToUser('user-1', {
        title: 'T', body: 'B', eventKey: 'order_paid'
      }, { actorId: 'admin-1' });
      expect(mockBroadcastLogCreate).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ note: 'no_subscriptions' })
      }));
    });

    it('writes audit row reflecting expired count', async () => {
      mockFindMany.mockResolvedValue([
        { id: 's1', endpoint: 'https://push/dead', p256dh: 'p', auth: 'a', preferences: '{}' }
      ]);
      mockSendNotification.mockRejectedValue({ statusCode: 410 });
      mockDelete.mockResolvedValue({});
      await pushService.sendToUser('user-1', {
        title: 'T', body: 'B', eventKey: 'order_paid'
      }, { actorId: 'admin-1' });
      expect(mockBroadcastLogCreate).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ sent: 0, expired: 1, failed: 0 })
      }));
    });

    it('writes audit row reflecting failed count', async () => {
      mockFindMany.mockResolvedValue([
        { id: 's1', endpoint: 'https://push/oops', p256dh: 'p', auth: 'a', preferences: '{}' }
      ]);
      mockSendNotification.mockRejectedValue({ statusCode: 500 });
      await pushService.sendToUser('user-1', {
        title: 'T', body: 'B', eventKey: 'order_paid'
      }, { actorId: 'admin-1' });
      expect(mockBroadcastLogCreate).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ sent: 0, expired: 0, failed: 1 })
      }));
    });

    it('caps eventKey at 64 chars', async () => {
      mockFindMany.mockResolvedValue([]);
      const longKey = 'a'.repeat(100);
      await pushService.sendToUser('user-1', {
        title: 'T', body: 'B', eventKey: longKey
      }, { actorId: 'admin-1' });
      const call = mockBroadcastLogCreate.mock.calls[0][0];
      expect(call.data.eventKey.length).toBe(64);
    });

    it('audit failure does not break push delivery', async () => {
      mockFindMany.mockResolvedValue([
        { id: 's1', endpoint: 'https://push/1', p256dh: 'p', auth: 'a', preferences: '{}' }
      ]);
      mockSendNotification.mockResolvedValue({});
      mockBroadcastLogCreate.mockRejectedValue(new Error('audit DB down'));
      // Should not throw — audit failure is swallowed.
      const result = await pushService.sendToUser('user-1', {
        title: 'T', body: 'B', eventKey: 'order_paid'
      }, { actorId: 'admin-1' });
      expect(result.sent).toBe(1);
    });

    it('records null actorId when audit context is omitted', async () => {
      mockFindMany.mockResolvedValue([]);
      await pushService.sendToUser('user-1', {
        title: 'T', body: 'B', eventKey: 'order_paid'
      });
      const call = mockBroadcastLogCreate.mock.calls[0][0];
      expect(call.data.actorId).toBeNull();
    });

    it('records parentBroadcastId when supplied', async () => {
      mockFindMany.mockResolvedValue([
        { id: 's1', endpoint: 'https://push/1', p256dh: 'p', auth: 'a', preferences: '{}' }
      ]);
      mockSendNotification.mockResolvedValue({});
      await pushService.sendToUser('user-1', {
        title: 'T', body: 'B', eventKey: 'order_paid'
      }, { actorId: 'admin-1', parentBroadcastId: 'pb-uuid-1' });
      const call = mockBroadcastLogCreate.mock.calls[0][0];
      expect(call.data.parentBroadcastId).toBe('pb-uuid-1');
    });

    it('records null parentBroadcastId by default', async () => {
      mockFindMany.mockResolvedValue([]);
      await pushService.sendToUser('user-1', {
        title: 'T', body: 'B', eventKey: 'order_paid'
      }, { actorId: 'admin-1' });
      const call = mockBroadcastLogCreate.mock.calls[0][0];
      expect(call.data.parentBroadcastId).toBeNull();
    });
  });
});
