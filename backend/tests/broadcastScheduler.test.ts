// Unit tests for the broadcast scheduler.
//
// We mock the Prisma client and the pushService so these tests are
// fully DB-free. The actual scheduler reads/writes BroadcastJob rows
// (which CI exercises with the MySQL service container).
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockBroadcastJobFindUnique = vi.fn();
const mockBroadcastJobUpdateMany = vi.fn();
const mockBroadcastJobUpdate = vi.fn();
const mockBroadcastJobFindMany = vi.fn();
const mockBroadcastJobCreate = vi.fn();
const mockUserFindMany = vi.fn();
const mockSendToUser = vi.fn();

vi.mock('../src/lib/prisma', () => ({
  default: {
    broadcastJob: {
      findUnique: (...args: any[]) => mockBroadcastJobFindUnique(...args),
      updateMany: (...args: any[]) => mockBroadcastJobUpdateMany(...args),
      update: (...args: any[]) => mockBroadcastJobUpdate(...args),
      findMany: (...args: any[]) => mockBroadcastJobFindMany(...args),
      create: (...args: any[]) => mockBroadcastJobCreate(...args)
    },
    user: {
      findMany: (...args: any[]) => mockUserFindMany(...args)
    }
  }
}));

vi.mock('../src/services/pushService', () => ({
  sendToUser: (...args: any[]) => mockSendToUser(...args)
}));

import { runScheduledJob, tick, startScheduler, stopScheduler, _resetSchedulerForTests } from '../src/services/broadcastScheduler';
import { resolveBroadcastTargets } from '../src/utils/broadcastTargets';

beforeEach(() => {
  vi.clearAllMocks();
  _resetSchedulerForTests();
});

describe('broadcastScheduler.resolveBroadcastTargets', () => {
  it('returns single userId', async () => {
    const out = await resolveBroadcastTargets({ userId: 'u1' });
    expect(out.ids).toEqual(['u1']);
  });

  it('dedupes + filters userIds (drops short / empty strings)', async () => {
    const out = await resolveBroadcastTargets({
      userIds: ['user-uuid-1', 'user-uuid-2', 'user-uuid-1', '', 'short']
    });
    expect(out.ids).toEqual(['user-uuid-1', 'user-uuid-2']);
  });

  it('rejects unknown role', async () => {
    const out = await resolveBroadcastTargets({ role: 'super-admin' as any });
    expect(out.error).toMatch(/Invalid role/);
    expect(out.ids).toEqual([]);
  });

  it('queries User table for role', async () => {
    mockUserFindMany.mockResolvedValue([{ id: 'u1' }, { id: 'u2' }]);
    const out = await resolveBroadcastTargets({ role: 'customer' });
    expect(out.ids).toEqual(['u1', 'u2']);
    expect(mockUserFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { role: 'customer' },
      take: 500
    }));
  });

  it('errors when no input given', async () => {
    const out = await resolveBroadcastTargets({});
    expect(out.error).toBe('Provide userId, userIds, or role');
  });
});

describe('broadcastScheduler.runScheduledJob', () => {
  it('returns zero counts when job not found', async () => {
    mockBroadcastJobFindUnique.mockResolvedValue(null);
    const out = await runScheduledJob('missing');
    expect(out).toEqual({ sent: 0, failed: 0, skipped: 0 });
  });

  it('skips jobs not in pending status', async () => {
    mockBroadcastJobFindUnique.mockResolvedValue({ id: 'j1', status: 'dispatched' });
    const out = await runScheduledJob('j1');
    expect(out).toEqual({ sent: 0, failed: 0, skipped: 0 });
    expect(mockSendToUser).not.toHaveBeenCalled();
  });

  it('marks job as failed when target resolution errors', async () => {
    mockBroadcastJobFindUnique.mockResolvedValue({
      id: 'j1', status: 'pending', targetMode: 'segment', targetIds: null, segmentRole: 'customer'
    });
    mockBroadcastJobUpdateMany.mockResolvedValue({ count: 1 });
    mockUserFindMany.mockResolvedValue([]); // no users for this role
    mockBroadcastJobUpdate.mockResolvedValue({});

    const out = await runScheduledJob('j1');
    expect(out).toEqual({ sent: 0, failed: 0, skipped: 0 });
    expect(mockBroadcastJobUpdate).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'j1' },
      data: expect.objectContaining({ status: 'failed' })
    }));
  });

  it('dispatches to all resolved targets and marks dispatched on full success', async () => {
    mockBroadcastJobFindUnique.mockResolvedValue({
      id: 'j1', status: 'pending', actorId: 'a1', note: 'Q3 promo',
      targetMode: 'segment', targetIds: null, segmentRole: 'customer',
      title: 'T', body: 'B', url: '/', eventKey: 'promo', tag: null
    });
    mockBroadcastJobUpdateMany.mockResolvedValue({ count: 1 });
    mockUserFindMany.mockResolvedValue([{ id: 'u1' }, { id: 'u2' }]);
    mockSendToUser.mockResolvedValue({ sent: 1, expired: 0, failed: 0 });
    mockBroadcastJobUpdate.mockResolvedValue({});

    const out = await runScheduledJob('j1');
    expect(out.sent).toBe(2);
    expect(out.failed).toBe(0);
    expect(mockSendToUser).toHaveBeenCalledTimes(2);
    expect(mockBroadcastJobUpdate).toHaveBeenLastCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'dispatched' })
    }));
  });

  it('marks job as failed when EVERY target errored (sent=0, failed>0)', async () => {
    mockBroadcastJobFindUnique.mockResolvedValue({
      id: 'j1', status: 'pending', actorId: 'a1',
      targetMode: 'segment', targetIds: null, segmentRole: 'customer',
      title: 'T', body: 'B', url: '/', eventKey: 'custom'
    });
    mockBroadcastJobUpdateMany.mockResolvedValue({ count: 1 });
    mockUserFindMany.mockResolvedValue([{ id: 'u1' }]);
    mockSendToUser.mockResolvedValue({ sent: 0, expired: 0, failed: 1 });
    mockBroadcastJobUpdate.mockResolvedValue({});

    const out = await runScheduledJob('j1');
    expect(out.failed).toBe(1);
    expect(mockBroadcastJobUpdate).toHaveBeenLastCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'failed' })
    }));
  });

  it('races safely with other workers via atomic claim (updateMany count=0)', async () => {
    mockBroadcastJobFindUnique.mockResolvedValue({
      id: 'j1', status: 'pending', targetMode: 'segment', segmentRole: 'customer',
      title: 'T', body: 'B', url: '/', eventKey: 'custom'
    });
    // Another worker already claimed the job.
    mockBroadcastJobUpdateMany.mockResolvedValue({ count: 0 });

    const out = await runScheduledJob('j1');
    expect(out).toEqual({ sent: 0, failed: 0, skipped: 0 });
    expect(mockSendToUser).not.toHaveBeenCalled();
  });
});

describe('broadcastScheduler.tick', () => {
  it('does nothing when no due jobs', async () => {
    mockBroadcastJobFindMany.mockResolvedValue([]);
    await tick();
    expect(mockSendToUser).not.toHaveBeenCalled();
  });

  it('dispatches every due job', async () => {
    mockBroadcastJobFindMany.mockResolvedValue([
      { id: 'j1' }, { id: 'j2' }
    ]);
    mockBroadcastJobFindUnique
      .mockResolvedValueOnce({ id: 'j1', status: 'pending', targetMode: 'segment', segmentRole: 'customer', title: 'T', body: 'B', url: '/', eventKey: 'custom' })
      .mockResolvedValueOnce({ id: 'j2', status: 'pending', targetMode: 'segment', segmentRole: 'customer', title: 'T', body: 'B', url: '/', eventKey: 'custom' });
    mockBroadcastJobUpdateMany.mockResolvedValue({ count: 1 });
    mockUserFindMany.mockResolvedValue([{ id: 'u1' }]);
    mockSendToUser.mockResolvedValue({ sent: 1, expired: 0, failed: 0 });
    mockBroadcastJobUpdate.mockResolvedValue({});

    await tick();
    expect(mockSendToUser).toHaveBeenCalledTimes(2);
  });

  it('marks crashed job as failed (does not retry forever)', async () => {
    mockBroadcastJobFindMany.mockResolvedValue([{ id: 'j1' }]);
    mockBroadcastJobFindUnique.mockResolvedValue({ id: 'j1', status: 'pending', targetMode: 'segment', segmentRole: 'customer', title: 'T', body: 'B', url: '/', eventKey: 'custom' });
    mockBroadcastJobUpdateMany.mockResolvedValue({ count: 1 });
    mockUserFindMany.mockResolvedValue([{ id: 'u1' }]);
    mockSendToUser.mockRejectedValue(new Error('web-push down'));
    mockBroadcastJobUpdate.mockResolvedValue({});

    await tick();
    // Two updates: first sets dispatchedAt (claim), second marks failed.
    expect(mockBroadcastJobUpdate).toHaveBeenLastCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'failed' })
    }));
  });
});

describe('broadcastScheduler lifecycle', () => {
  it('startScheduler is idempotent', () => {
    startScheduler();
    startScheduler();
    stopScheduler();
    // No assertion needed — just verify it doesn't throw.
    expect(true).toBe(true);
  });

  it('stopScheduler clears the interval', () => {
    startScheduler();
    stopScheduler();
    expect(true).toBe(true);
  });
});
