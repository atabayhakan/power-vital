// Shared broadcast target resolver — used by both:
//   • routes/push.ts     (immediate POST /push/broadcast)
//   • services/broadcastScheduler.ts (delayed jobs)
//
// Resolves a "target spec" (userId / userIds[] / role) into an array
// of user IDs. Validates inputs the same way regardless of caller so
// the rules can't drift between the two paths.

import prisma from '../lib/prisma';

const VALID_ROLES = ['customer', 'cashier', 'dealer', 'distributor', 'admin'];

export interface ResolveInput {
  userId?: string;
  userIds?: string[];
  role?: string;
}

export interface ResolveOutput {
  ids: string[];
  error?: string;
}

export const resolveBroadcastTargets = async (input: ResolveInput): Promise<ResolveOutput> => {
  if (input.userId) {
    return { ids: [input.userId] };
  }
  if (Array.isArray(input.userIds)) {
    if (input.userIds.length === 0) return { ids: [], error: 'userIds must be non-empty' };
    const cleaned = [...new Set(
      input.userIds
        .filter((x): x is string => typeof x === 'string')
        .map(x => x.trim())
        .filter(x => x.length >= 8 && x.length <= 64)
    )];
    if (cleaned.length === 0) return { ids: [], error: 'No valid userIds' };
    return { ids: cleaned };
  }
  if (input.role && typeof input.role === 'string') {
    if (!VALID_ROLES.includes(input.role)) {
      return { ids: [], error: `Invalid role; must be one of: ${VALID_ROLES.join(', ')}` };
    }
    const rows = await prisma.user.findMany({
      where: { role: input.role },
      select: { id: true },
      take: 500
    });
    return { ids: rows.map(r => r.id) };
  }
  return { ids: [], error: 'Provide userId, userIds, or role' };
};
