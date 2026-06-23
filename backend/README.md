# Backend — Power Vital

Node 20 + Express 5 + TypeScript (strict) + Prisma 5 (MySQL) + zod.

📖 **Full repo docs**: see the [root README](../README.md).

## Quick Start

```bash
npm ci
cp .env.example .env       # DATABASE_URL, JWT_SECRET, CORS_ORIGINS, …
npx prisma generate
npx prisma db push         # applies schema to your DB
npx prisma db execute --file prisma/migrations/add_fulltext_search.sql --schema prisma/schema.prisma
npm run dev                # tsx watch → :3000
```

## Scripts

| Script | What |
|---|---|
| `npm run dev` | tsx watch + auto-reload |
| `npm test` | 108 DB-free tests (Vitest) |
| `npm run test:watch` | Vitest in watch mode |
| `npm run test:coverage` | + v8 coverage report (html/ + text) |
| `npm run test:ci` | Verbose reporter for CI logs |

## Stack

- **Express 5** + middleware chain: requestId → pino-http → helmet → CORS → cookie-parser → json → per-route rate limit → route
- **Prisma 5** (MySQL) — 18 models
- **zod 4** — 30+ schemas in `src/validators/`, every body/query/params validated
- **Pino 10** — structured logging with auto-redaction (passwords/tokens/JWTs never written)
- **express-rate-limit 8** — per-endpoint limits, IPv6-safe (`ipKeyGenerator`)
- **cookie-parser** + HttpOnly cookies for refresh tokens
- **nodemailer** (optional SMTP transport for admin notifications)
- **Vitest 4** — testing
- **swagger-ui-express** + `@asteasolutions/zod-to-openapi` — auto-generated OpenAPI 3.1

## Key Directories

```
src/
├── routes/        # 18 route modules (one per resource)
├── services/      # business logic (image, search, token, notification, …)
├── workers/       # background jobs (bonusWorker, translationSweeper, exchangeRate)
├── i18n/          # locales + TranslationCenter + fields registry
├── validators/    # zod schemas — single source of truth for input AND OpenAPI
├── utils/         # logger, httpLogger, rateLimit, refreshCookie
├── openapi/       # OpenAPI 3.1 spec generation (auto from zod)
└── lib/           # shared Prisma singleton (singleton pattern)
```

## Test Suite

142 tests · **108 DB-free + 34 MySQL integration**

See `tests/README.md` for the full MySQL Docker setup. CI runs against a MySQL 8
service container (see `.github/workflows/ci.yml`).

## Background Workers

These start automatically when `npm run dev` or `npm start` is run (via imports
in `src/index.ts`):

- **`bonusWorker`** — BullMQ job consumer for MLM bonus distribution
- **`translationSweeper`** — every 3 min, fills missing TR/RU/KG translations for any record
- **`exchangeRateScheduler`** — daily USD/KGS rate fetch

## Endpoints

See the live OpenAPI spec:
- **Local**: http://localhost:3000/api/docs (Swagger UI)
- **JSON**: http://localhost:3000/api/docs.json

## Deploy

Production deployment is automated via GitHub Actions. See
[`CI-CD.md`](../CI-CD.md) for the full pipeline + rollback runbook.

## Backup

Daily MySQL backup + restore verification is automated via cron. See
[`BACKUP.md`](../BACKUP.md) for the retention policy + restore procedure.
