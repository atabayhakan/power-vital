import { PrismaClient } from '../../prisma/generated/client';

// ────────────────────────────────────────────────────────────────────────────
// Shared PrismaClient singleton.
//
// Previously every route/service/worker file did `new PrismaClient()`, opening
// ~18 separate connection pools and risking DB connection exhaustion. This
// module exposes ONE client for the whole process. In development we stash it
// on globalThis so hot-reload doesn't keep spawning new clients.
// ────────────────────────────────────────────────────────────────────────────
const globalForPrisma = globalThis as unknown as { __pvPrisma?: PrismaClient };

const prisma = globalForPrisma.__pvPrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__pvPrisma = prisma;
}

export default prisma;
