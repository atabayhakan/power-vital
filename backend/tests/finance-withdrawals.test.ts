import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import financeRouter from '../src/routes/finance';
import prisma from '../src/lib/prisma';
import { buildTestApp, cleanDatabase, closePrisma, makeToken } from './testHelpers';

const app = buildTestApp({ path: '/api/v1/finance', router: financeRouter });

beforeAll(async () => {
  await cleanDatabase();
});

afterAll(async () => {
  await closePrisma();
});

// Seed a user directly (no register round-trip needed — makeToken signs the id)
const seedUser = async (email: string, walletKgs = 0, walletUsd = 0) => {
  return prisma.user.create({
    data: {
      name: email.split('@')[0],
      email,
      passwordHash: 'test-hash',
      walletBalanceKgs: walletKgs,
      walletBalanceUsd: walletUsd
    }
  });
};

const authFor = async (userId: string) => `Bearer ${await makeToken(userId)}`;

beforeEach(async () => {
  await prisma.withdrawalRequest.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.user.deleteMany({ where: { email: { in: ['wd-alice@test.com', 'wd-bob@test.com'] } } });
});

describe('POST /api/v1/finance/withdraw', () => {
  it('rejects with 400 when balance is insufficient (no rows written)', async () => {
    const alice = await seedUser('wd-alice@test.com', 100);

    const res = await request(app)
      .post('/api/v1/finance/withdraw')
      .set('Authorization', await authFor(alice.id))
      .send({ amount: 500, bankInfo: 'MBank 0555 00 00 00' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/insufficient/i);

    // 🛡️ Atomicity: failed request must leave zero trace
    const requests = await prisma.withdrawalRequest.findMany({ where: { userId: alice.id } });
    const txs = await prisma.transaction.findMany({ where: { userId: alice.id } });
    expect(requests.length).toBe(0);
    expect(txs.length).toBe(0);

    const after = await prisma.user.findUnique({ where: { id: alice.id } });
    expect(Number(after?.walletBalanceKgs)).toBe(100);
  });

  it('creates a pending request with 201 and decrements the wallet atomically', async () => {
    const alice = await seedUser('wd-alice@test.com', 1000);

    const res = await request(app)
      .post('/api/v1/finance/withdraw')
      .set('Authorization', await authFor(alice.id))
      .send({ amount: 250, bankInfo: 'O!Money 0700 11 22 33' });

    expect(res.status).toBe(201);
    expect(res.body.withdrawal.status).toBe('pending');
    expect(res.body.withdrawal.currency).toBe('KGS');
    expect(res.body.withdrawal.bankInfo).toBe('O!Money 0700 11 22 33');

    const after = await prisma.user.findUnique({ where: { id: alice.id } });
    expect(Number(after?.walletBalanceKgs)).toBe(750);

    const tx = await prisma.transaction.findFirst({ where: { userId: alice.id, type: 'withdrawal' } });
    expect(tx).not.toBeNull();
    expect(Number(tx?.amount)).toBe(250);
  });

  it('rejects unauthenticated requests with 401', async () => {
    const res = await request(app)
      .post('/api/v1/finance/withdraw')
      .send({ amount: 100 });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/v1/finance/withdrawals', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/v1/finance/withdrawals');
    expect(res.status).toBe(401);
  });

  it('returns the caller\'s own requests in a paginated envelope, newest first', async () => {
    const alice = await seedUser('wd-alice@test.com', 1000);

    // Two withdrawals — the second one is newer and must come first
    await request(app)
      .post('/api/v1/finance/withdraw')
      .set('Authorization', await authFor(alice.id))
      .send({ amount: 100, bankInfo: 'first' });
    await request(app)
      .post('/api/v1/finance/withdraw')
      .set('Authorization', await authFor(alice.id))
      .send({ amount: 200, bankInfo: 'second' });

    const res = await request(app)
      .get('/api/v1/finance/withdrawals')
      .set('Authorization', await authFor(alice.id));

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ total: 2, page: 1, limit: 50, hasMore: false });
    expect(res.body.items.length).toBe(2);

    const [newest, oldest] = res.body.items;
    expect(Number(newest.amount)).toBe(200);
    expect(Number(oldest.amount)).toBe(100);
    expect(newest.status).toBe('pending');
    expect(newest.bankInfo).toBe('second');

    // 🛡️ Safe-field whitelist: userId must NOT leak to the client
    expect(newest).not.toHaveProperty('userId');
  });

  it('never returns other users\' requests', async () => {
    const alice = await seedUser('wd-alice@test.com', 500);
    const bob = await seedUser('wd-bob@test.com', 500);

    await request(app)
      .post('/api/v1/finance/withdraw')
      .set('Authorization', await authFor(bob.id))
      .send({ amount: 300, bankInfo: 'bob-mega' });

    const res = await request(app)
      .get('/api/v1/finance/withdrawals')
      .set('Authorization', await authFor(alice.id));

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(0);
    expect(res.body.items.length).toBe(0);
  });

  it('honours page/limit pagination', async () => {
    const alice = await seedUser('wd-alice@test.com', 1000);
    for (const amount of [10, 20, 30]) {
      await request(app)
        .post('/api/v1/finance/withdraw')
        .set('Authorization', await authFor(alice.id))
        .send({ amount });
    }

    const page1 = await request(app)
      .get('/api/v1/finance/withdrawals?page=1&limit=2')
      .set('Authorization', await authFor(alice.id));
    expect(page1.body.items.length).toBe(2);
    expect(page1.body.total).toBe(3);
    expect(page1.body.hasMore).toBe(true);

    const page2 = await request(app)
      .get('/api/v1/finance/withdrawals?page=2&limit=2')
      .set('Authorization', await authFor(alice.id));
    expect(page2.body.items.length).toBe(1);
    expect(page2.body.hasMore).toBe(false);
  });
});
