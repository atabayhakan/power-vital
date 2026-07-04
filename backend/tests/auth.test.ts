import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import authRouter from '../src/routes/auth';
import prisma from '../src/lib/prisma';
import { buildTestApp, cleanDatabase, closePrisma, makeToken } from './testHelpers';

const app = buildTestApp({ path: '/api/v1/auth', router: authRouter });

beforeAll(async () => {
  await cleanDatabase();
});

afterAll(async () => {
  await closePrisma();
});

beforeEach(async () => {
  await prisma.user.deleteMany({ where: { email: { in: ['alice@test.com', 'bob@test.com'] } } });
});

describe('POST /api/v1/auth/register', () => {
  it('creates a new user with valid data', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Alice', email: 'alice@test.com', password: 'secret123' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('userId');
    expect(res.body.message).toMatch(/success/i);

    const user = await prisma.user.findUnique({ where: { email: 'alice@test.com' } });
    expect(user).not.toBeNull();
    expect(user?.role).toBe('customer');
    expect(user?.passwordHash).not.toBe('secret123'); // hashed
  });

  it('rejects missing required fields', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'alice@test.com' });

    // validate() returns the standard envelope: { error: 'Validation
    // failed', issues: [{ path, message, code }] } — the per-field detail
    // lives in `issues`, not the top-level `error`.
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
    const missingPaths = res.body.issues.map((i: { path: string }) => i.path);
    expect(missingPaths).toContain('name');
    expect(missingPaths).toContain('password');
  });

  it('rejects duplicate email', async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Bob', email: 'bob@test.com', password: 'secret123' });

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Bob 2', email: 'bob@test.com', password: 'secret456' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/email/i);
  });
});

describe('POST /api/v1/auth/login', () => {
  beforeEach(async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Alice', email: 'alice@test.com', password: 'secret123' });
  });

  it('returns token + user on valid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'alice@test.com', password: 'secret123' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe('alice@test.com');
    expect(res.body.user.role).toBe('customer');
  });

  it('rejects invalid email format (zod validation)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'not-an-email', password: 'secret123' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
    expect(res.body.issues).toBeInstanceOf(Array);
    expect(res.body.issues[0].path).toBe('email');
    expect(res.body.issues[0].message).toMatch(/email/i);
  });

  it('rejects short password (zod validation, < 6 chars)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'alice@test.com', password: '12345' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
    expect(res.body.issues[0].path).toBe('password');
    expect(res.body.issues[0].message).toMatch(/password/i);
  });

  it('rejects wrong password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'alice@test.com', password: 'wrong-password' });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid/i);
  });

  it('rejects unknown email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nobody@test.com', password: 'secret123' });

    expect(res.status).toBe(401);
  });
});

describe('GET /api/v1/auth/me', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns the authenticated user', async () => {
    const reg = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Alice', email: 'alice@test.com', password: 'secret123' });
    const userId = reg.body.userId;

    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'alice@test.com', password: 'secret123' });

    const token = login.body.token;
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(userId);
    expect(res.body.email).toBe('alice@test.com');
    expect(res.body).not.toHaveProperty('passwordHash'); // never leaked
  });

  it('rejects an invalid token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer not-a-valid-jwt');
    expect(res.status).toBe(401);
  });
});
