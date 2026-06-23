// Unit tests for impersonation service + middleware behavior.
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockUpsert = vi.fn();
const mockFindUnique = vi.fn();
const mockUpdateMany = vi.fn();
const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockFindMany = vi.fn();

vi.mock('../src/lib/prisma', () => ({
  default: {
    user: {
      findUnique: (...args: any[]) => mockFindUnique(...args),
      upsert: (...args: any[]) => mockUpsert(...args)
    },
    impersonationSession: {
      create: (...args: any[]) => mockCreate(...args),
      findUnique: (...args: any[]) => mockFindUnique(...args),
      findMany: (...args: any[]) => mockFindMany(...args),
      update: (...args: any[]) => mockUpdate(...args),
      updateMany: (...args: any[]) => mockUpdateMany(...args)
    }
  }
}));

import {
  startImpersonation,
  endImpersonation,
  touchSession,
  ImpersonationError,
  MAX_SESSION_MS
} from '../src/services/impersonationService';

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-06-19T15:00:00Z'));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('startImpersonation', () => {
  it('creates a 60-minute session for valid target', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'u-1', name: 'Ali', email: 'ali@x', role: 'customer'
    });
    mockUpdateMany.mockResolvedValue({ count: 0 });
    mockCreate.mockResolvedValue({
      id: 'sess-1',
      expiresAt: new Date(Date.now() + MAX_SESSION_MS),
      adminId: 'admin-1',
      targetId: 'u-1'
    });

    const result = await startImpersonation({
      adminId: 'admin-1',
      targetId: 'u-1',
      reason: 'support ticket #42'
    });

    expect(result.id).toBe('sess-1');
    expect(result.expiresAt.getTime() - Date.now()).toBe(MAX_SESSION_MS);
    // The service now writes the relation via Prisma's nested `connect`
    // syntax (not flat adminId/targetId scalars) so MySQL's strict
    // mode is happy and we don't need to define a compound unique.
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        admin: { connect: { id: 'admin-1' } },
        target: { connect: { id: 'u-1' } },
        reason: 'support ticket #42'
      })
    }));
  });

  it('rejects self-impersonation', async () => {
    await expect(startImpersonation({
      adminId: 'admin-1',
      targetId: 'admin-1'
    })).rejects.toThrow(ImpersonationError);

    try {
      await startImpersonation({ adminId: 'admin-1', targetId: 'admin-1' });
    } catch (e: any) {
      expect(e.code).toBe('cannot_impersonate_self');
    }
  });

  it('rejects target_not_found', async () => {
    mockFindUnique.mockResolvedValue(null);
    await expect(startImpersonation({
      adminId: 'admin-1',
      targetId: 'missing-user-id'
    })).rejects.toThrow(ImpersonationError);
  });

  it('rejects impersonation of another admin', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'other-admin', name: 'Ayşe', email: 'ayse@x', role: 'admin'
    });
    await expect(startImpersonation({
      adminId: 'admin-1',
      targetId: 'other-admin'
    })).rejects.toMatchObject({ code: 'cannot_impersonate_admin' });
  });

  it('ends any prior active sessions for the admin', async () => {
    mockFindUnique.mockResolvedValue({ id: 'u-1', name: 'Ali', email: 'ali@x', role: 'customer' });
    mockUpdateMany.mockResolvedValue({ count: 1 }); // one prior session ended
    mockCreate.mockResolvedValue({
      id: 'sess-2',
      expiresAt: new Date(),
      adminId: 'admin-1',
      targetId: 'u-1'
    });
    await startImpersonation({ adminId: 'admin-1', targetId: 'u-1' });
    expect(mockUpdateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { adminId: 'admin-1', endedAt: null },
      data: expect.objectContaining({ endedByAdmin: false })
    }));
  });
});

describe('endImpersonation', () => {
  it('returns 0 when no active session exists', async () => {
    mockUpdateMany.mockResolvedValue({ count: 0 });
    const n = await endImpersonation('sess-1');
    expect(n).toBe(0);
  });

  it('returns 1 and sets endedAt + endedByAdmin (no adminId filter → system expiry)', async () => {
    mockUpdateMany.mockResolvedValue({ count: 1 });
    // endImpersonation(sessionId, adminId?, endedByAdmin=true)
    // When called with no adminId (system/inactivity expiry) the where
    // clause only matches by id+endedAt:null.
    const n = await endImpersonation('sess-1');
    expect(n).toBe(1);
    expect(mockUpdateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'sess-1', endedAt: null },
      data: expect.objectContaining({ endedByAdmin: true })
    }));
  });

  it('admin-scoped end: refuses to end another admin\'s session', async () => {
    mockUpdateMany.mockResolvedValue({ count: 0 });
    const n = await endImpersonation('sess-other', 'admin-1');
    expect(n).toBe(0);
    expect(mockUpdateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'sess-other', endedAt: null, adminId: 'admin-1' },
      data: expect.objectContaining({ endedByAdmin: true })
    }));
  });
});

describe('touchSession', () => {
  it('returns null when session does not exist', async () => {
    mockFindUnique.mockResolvedValue(null);
    expect(await touchSession('nope')).toBeNull();
  });

  it('returns null when session is already ended', async () => {
    mockFindUnique.mockResolvedValue({
      id: 's1', adminId: 'a1', targetId: 'u1',
      startedAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
      endedAt: new Date()
    });
    expect(await touchSession('s1')).toBeNull();
  });

  it('returns null and auto-ends when session has expired', async () => {
    mockFindUnique.mockResolvedValue({
      id: 's1', adminId: 'a1', targetId: 'u1',
      startedAt: new Date(Date.now() - 100_000),
      expiresAt: new Date(Date.now() - 1),
      endedAt: null
    });
    mockUpdate.mockResolvedValue({});
    expect(await touchSession('s1')).toBeNull();
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 's1' },
      data: expect.objectContaining({ endedByAdmin: false })
    }));
  });

  it('returns ActiveSession when valid', async () => {
    mockFindUnique.mockResolvedValue({
      id: 's1', adminId: 'a1', targetId: 'u1',
      startedAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
      endedAt: null
    });
    const s = await touchSession('s1');
    expect(s).toMatchObject({ id: 's1', adminId: 'a1', targetId: 'u1' });
  });
});
