import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import contactRouter from '../src/routes/contact';
import adminRouter from '../src/routes/admin';
import prisma from '../src/lib/prisma';
import { buildTestApp, cleanDatabase, closePrisma, makeToken } from './testHelpers';

const app = buildTestApp(
  { path: '/api/v1/contact', router: contactRouter },
  { path: '/api/v1/admin', router: adminRouter }
);

beforeAll(async () => {
  await cleanDatabase();
});

afterAll(async () => {
  await closePrisma();
});

const seedUser = async (email: string, role = 'customer') => {
  return prisma.user.create({
    data: { name: email.split('@')[0], email, passwordHash: 'test-hash', role }
  });
};

const authFor = async (userId: string, role = 'customer') => `Bearer ${await makeToken(userId, role)}`;

beforeEach(async () => {
  await prisma.contactMessage.deleteMany();
  await prisma.user.deleteMany({ where: { email: { in: ['cm-alice@test.com', 'cm-admin@test.com'] } } });
});

describe('POST /api/v1/contact', () => {
  it('rejects a guest message without email (400)', async () => {
    const res = await request(app)
      .post('/api/v1/contact')
      .send({ name: 'Guest', message: 'Merhaba, ürünleriniz hakkında bilgi almak istiyorum.' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/email/i);

    const count = await prisma.contactMessage.count();
    expect(count).toBe(0);
  });

  it('accepts a guest message with email (201) and defaults source to contact', async () => {
    const res = await request(app)
      .post('/api/v1/contact')
      .send({ name: 'Guest', email: 'guest@example.com', subject: 'Bilgi', message: 'Kargo süreleri hakkında bilgi almak istiyorum.' });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();

    const row = await prisma.contactMessage.findUnique({ where: { id: res.body.id } });
    expect(row).not.toBeNull();
    expect(row?.status).toBe('new');
    expect(row?.source).toBe('contact');
    expect(row?.userId).toBeNull();
    expect(row?.email).toBe('guest@example.com');
  });

  it('rejects a missing message body (400 validation)', async () => {
    const res = await request(app)
      .post('/api/v1/contact')
      .send({ email: 'guest@example.com', subject: 'No message here' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
    const paths = res.body.issues.map((i: { path: string }) => i.path);
    expect(paths).toContain('message');
  });

  it('rejects an invalid guest email format (400 validation)', async () => {
    const res = await request(app)
      .post('/api/v1/contact')
      .send({ email: 'not-an-email', message: 'Bu bir test mesajıdır.' });
    expect(res.status).toBe(400);
  });

  it('attaches userId and derives name/email for logged-in users (no body email needed)', async () => {
    const alice = await seedUser('cm-alice@test.com');

    const res = await request(app)
      .post('/api/v1/contact')
      .set('Authorization', await authFor(alice.id))
      .send({ subject: 'order', message: 'Siparişim kargoya verilmedi, yardımcı olur musunuz?', source: 'support' });

    expect(res.status).toBe(201);

    const row = await prisma.contactMessage.findUnique({ where: { id: res.body.id } });
    expect(row?.userId).toBe(alice.id);
    expect(row?.email).toBe('cm-alice@test.com'); // derived from profile
    expect(row?.name).toBe('cm-alice');           // derived from profile
    expect(row?.source).toBe('support');
  });

  it('ignores an invalid/expired token and falls back to guest rules', async () => {
    const res = await request(app)
      .post('/api/v1/contact')
      .set('Authorization', 'Bearer garbage-token')
      .send({ email: 'guest@example.com', message: 'Bu mesaj misafir olarak kabul edilmeli.' });

    expect(res.status).toBe(201);
    const row = await prisma.contactMessage.findUnique({ where: { id: res.body.id } });
    expect(row?.userId).toBeNull();
  });
});

describe('GET /api/v1/admin/contact-messages', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/v1/admin/contact-messages');
    expect(res.status).toBe(401);
  });

  it('returns 403 for a non-admin user', async () => {
    const alice = await seedUser('cm-alice@test.com');
    const res = await request(app)
      .get('/api/v1/admin/contact-messages')
      .set('Authorization', await authFor(alice.id));
    expect(res.status).toBe(403);
  });

  it('returns a paginated envelope with submitter info, newest first', async () => {
    const admin = await seedUser('cm-admin@test.com', 'admin');
    const alice = await seedUser('cm-alice@test.com');

    // One guest message + one logged-in support message
    await request(app)
      .post('/api/v1/contact')
      .send({ email: 'guest@example.com', message: 'İlk mesaj — iletişim formu.' });
    await request(app)
      .post('/api/v1/contact')
      .set('Authorization', await authFor(alice.id))
      .send({ subject: 'return', message: 'İkinci mesaj — destek formu.', source: 'support' });

    const res = await request(app)
      .get('/api/v1/admin/contact-messages')
      .set('Authorization', await authFor(admin.id, 'admin'));

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ total: 2, page: 1, limit: 50, hasMore: false });
    expect(res.body.items.length).toBe(2);

    // Newest first — the support message was created last
    const [newest] = res.body.items;
    expect(newest.source).toBe('support');
    expect(newest.user?.email).toBe('cm-alice@test.com');
    expect(newest.status).toBe('new');
  });

  it('filters by ?status=', async () => {
    const admin = await seedUser('cm-admin@test.com', 'admin');

    const first = await request(app)
      .post('/api/v1/contact')
      .send({ email: 'a@example.com', message: 'Okunacak mesaj bir.' });
    await request(app)
      .post('/api/v1/contact')
      .send({ email: 'b@example.com', message: 'Yeni kalacak mesaj iki.' });

    // Mark the first one as read
    await request(app)
      .put(`/api/v1/admin/contact-messages/${first.body.id}`)
      .set('Authorization', await authFor(admin.id, 'admin'))
      .send({ status: 'read' });

    const newOnly = await request(app)
      .get('/api/v1/admin/contact-messages?status=new')
      .set('Authorization', await authFor(admin.id, 'admin'));
    expect(newOnly.body.total).toBe(1);
    expect(newOnly.body.items[0].status).toBe('new');

    const readOnly = await request(app)
      .get('/api/v1/admin/contact-messages?status=read')
      .set('Authorization', await authFor(admin.id, 'admin'));
    expect(readOnly.body.total).toBe(1);
    expect(readOnly.body.items[0].id).toBe(first.body.id);
  });
});

describe('PUT /api/v1/admin/contact-messages/:id', () => {
  it('walks the status lifecycle new → read → resolved and persists adminNote', async () => {
    const admin = await seedUser('cm-admin@test.com', 'admin');

    const created = await request(app)
      .post('/api/v1/contact')
      .send({ email: 'guest@example.com', message: 'Ürün iade süreci hakkında soru.' });
    const id = created.body.id;

    const toRead = await request(app)
      .put(`/api/v1/admin/contact-messages/${id}`)
      .set('Authorization', await authFor(admin.id, 'admin'))
      .send({ status: 'read', adminNote: 'Müşteriye telefonla dönüş yapılacak' });
    expect(toRead.status).toBe(200);
    expect(toRead.body.status).toBe('read');
    expect(toRead.body.adminNote).toBe('Müşteriye telefonla dönüş yapılacak');

    const toResolved = await request(app)
      .put(`/api/v1/admin/contact-messages/${id}`)
      .set('Authorization', await authFor(admin.id, 'admin'))
      .send({ status: 'resolved' });
    expect(toResolved.status).toBe(200);
    expect(toResolved.body.status).toBe('resolved');
    // Note untouched when omitted from the body
    expect(toResolved.body.adminNote).toBe('Müşteriye telefonla dönüş yapılacak');

    const row = await prisma.contactMessage.findUnique({ where: { id } });
    expect(row?.status).toBe('resolved');
  });

  it('rejects non-admin updates with 403', async () => {
    const alice = await seedUser('cm-alice@test.com');
    const created = await request(app)
      .post('/api/v1/contact')
      .send({ email: 'guest@example.com', message: 'Bu mesaj korunmalı.' });

    const res = await request(app)
      .put(`/api/v1/admin/contact-messages/${created.body.id}`)
      .set('Authorization', await authFor(alice.id))
      .send({ status: 'read' });
    expect(res.status).toBe(403);
  });

  it('returns 404 for an unknown id', async () => {
    const admin = await seedUser('cm-admin@test.com', 'admin');
    const res = await request(app)
      .put('/api/v1/admin/contact-messages/does-not-exist')
      .set('Authorization', await authFor(admin.id, 'admin'))
      .send({ status: 'read' });
    expect(res.status).toBe(404);
  });

  it('rejects an empty update body (400)', async () => {
    const admin = await seedUser('cm-admin@test.com', 'admin');
    const created = await request(app)
      .post('/api/v1/contact')
      .send({ email: 'guest@example.com', message: 'Boş güncelleme testi.' });

    const res = await request(app)
      .put(`/api/v1/admin/contact-messages/${created.body.id}`)
      .set('Authorization', await authFor(admin.id, 'admin'))
      .send({});
    expect(res.status).toBe(400);
  });
});
