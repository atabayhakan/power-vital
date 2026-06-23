// Test helpers: spin up an isolated Express app for supertest.
// We DO NOT import src/index.ts (it boots workers, schedulers, listens on PORT).
// Instead we build a minimal app with the same middleware + only the routes
// the relevant test file needs.
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import prisma from '../src/lib/prisma';

export const buildTestApp = (...routers: { path: string; router: express.Router }[]) => {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: '10mb' }));
  for (const { path: p, router } of routers) {
    app.use(p, router);
  }
  return app;
};

/** Wipe every table — order matters because of FK constraints. */
export const cleanDatabase = async () => {
  await prisma.$transaction([
    prisma.orderItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.priceRule.deleteMany(),
    prisma.productImage.deleteMany(),
    prisma.productReview.deleteMany(),
    prisma.storeReview.deleteMany(),
    prisma.transaction.deleteMany(),
    prisma.withdrawalRequest.deleteMany(),
    prisma.userWeeklyStats.deleteMany(),
    prisma.weeklyCycle.deleteMany(),
    prisma.product.deleteMany(),
    prisma.category.deleteMany(),
    prisma.heroSlide.deleteMany(),
    prisma.exchangeRate.deleteMany(),
    prisma.siteSettings.deleteMany(),
    prisma.page.deleteMany(),
    prisma.media.deleteMany(),
    prisma.mediaFolder.deleteMany(),
    prisma.systemConfig.deleteMany(),
    prisma.user.deleteMany()
  ]);
};

/** Disconnect prisma after the whole test run. */
export const closePrisma = async () => {
  await prisma.$disconnect();
};

/** Build a JWT signed with the test JWT_SECRET. */
export const makeToken = async (
  id: string,
  role: string = 'customer',
  expiresIn: string | number = '1h'
): Promise<string> => {
  const jwt = (await import('jsonwebtoken')).default;
  return jwt.sign({ id, role }, process.env.JWT_SECRET!, { expiresIn } as any);
};
