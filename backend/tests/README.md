# Backend Tests (Vitest + supertest)

## What we test
- **auth** — register/login/me + zod validation + JWT token handling
- **checkout** — order creation, stock firewall, atomic stock decrement, idempotency
- **ocr** — strict verify: amount mismatch → `pending` (NEVER auto-paid), OCR engine failure → manual review
- **i18n** — locale helpers, TranslationCenter fill-missing + AI failure leaves slots empty

## MySQL is required
The Prisma schema is `provider="mysql"` (no SQLite fallback). Tests run against a
**dedicated test database** to keep dev/prod data safe. The suite wipes all
tables between tests (see `tests/testHelpers.ts:cleanDatabase`).

## One-time setup

### Option A — Docker (recommended)
```bash
docker run -d --name pv-mysql-test \
  -p 3306:3306 \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=pv_test \
  -e MYSQL_USER=pv_test \
  -e MYSQL_PASSWORD=pv_test_pw \
  mysql:8

# wait for it to be healthy
docker exec pv-mysql-test mysqladmin ping -h 127.0.0.1 -u root -proot --wait=30

# create the schema
cd backend
npx prisma db push
```

### Option B — Local MySQL/MariaDB
1. Install MySQL 8 (or MariaDB 10.6+)
2. `mysql -u root -p` → `CREATE DATABASE pv_test; CREATE USER 'pv_test'@'localhost' IDENTIFIED BY 'pv_test_pw'; GRANT ALL ON pv_test.* TO 'pv_test'@'localhost';`
3. `cd backend && npx prisma db push`

### Option C — Remote MySQL
Point `backend/.env.test` `DATABASE_URL` at any reachable MySQL — the suite will
reset it on every `beforeAll`.

## Configure
```bash
cd backend
cp .env.test.example .env.test
# edit if your MySQL host/credentials differ from the defaults
```

## Run
```bash
npm test              # one-shot
npm run test:watch    # TDD
npm run test:coverage # with v8 coverage report (html/ + text)
npm run test:ci       # verbose for CI logs
```

## Layout
```
tests/
  setup.ts            # loads .env.test before any module
  testHelpers.ts      # buildTestApp(), cleanDatabase(), closePrisma(), makeToken()
  auth.test.ts        # 11 tests
  checkout.test.ts    # 9 tests
  ocr.test.ts         # 8 tests  (tesseract.js stubbed via vi.mock)
  i18n.test.ts        # 12 tests (aiTranslator stubbed via vi.mock)
```

## Why Vitest (not Jest)
- TypeScript-native (no ts-jest/babel chain)
- Same `describe/it/expect` API as Jest — easy migration later
- Faster cold start (esbuild-powered)
- Plays nicely with the existing `tsx` toolchain (Vite ecosystem)
