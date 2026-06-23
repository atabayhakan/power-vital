# Power Vital — E-commerce + MLM Platform

> Power Vital LLC'nin resmi e-ticaret + çok katmanlı pazarlama (MLM) platformu.
> TR / RU / KG / EN lokalizasyon, KGS + USD para birimi, gamified ascension,
> AI-destekli ürün yönetimi.

[![CI](https://github.com/powervital/pv-platform/actions/workflows/ci.yml/badge.svg)](https://github.com/powervital/pv-platform/actions/workflows/ci.yml)
[![Deploy](https://github.com/powervital/pv-platform/actions/workflows/deploy.yml/badge.svg)](https://github.com/powervital/pv-platform/actions/workflows/deploy.yml)
[![Backend Tests](https://img.shields.io/badge/tests-142_total-108%20DB--free-success)](backend/tests)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/license-Private-red)](#)

🌐 **Production**: [powervital.kg](https://powervital.kg) · [powervital.org](https://powervital.org)
📚 **API Docs**: [/api/docs](https://powervital.kg/api/docs) (Swagger UI)

---

## 🏗️ Mimari

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  Vue 3 + TypeScript + Vite (PWA)                              │
│  • i18n: TR (primary) · RU · KG · EN                           │
│  • State: Pinia · Router · Composables                        │
│  • Image: AVIF + WebP + responsive srcset + lazy hydration     │
│  • Axios interceptor: auto-refresh on 401                      │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTPS · JWT (15m) + Refresh (7d)
                             │ HttpOnly cookie `pv_refresh`
┌────────────────────────────▼────────────────────────────────┐
│                         BACKEND                               │
│  Node.js 20 · Express 5 · TypeScript strict                    │
│                                                                │
│  ┌─ Middleware ──────────────────────────────────────────┐  │
│  │  requestId → pino-http (structured logs + redaction)  │  │
│  │  → helmet (security headers) → CORS → json            │  │
│  │  → cookie-parser → per-route rate limit                │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                                │
│  ┌─ Validators (zod) ────────────────────────────────────┐  │
│  │  30+ schemas, body/query/params triple-validated       │  │
│  │  OpenAPI 3.1 spec auto-generated from zod              │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                                │
│  ┌─ Services ────────────────────────────────────────────┐  │
│  │  • TranslationCenter — AI auto-translate (Gemini)     │  │
│  │  • SearchService     — MySQL FULLTEXT + ngram         │  │
│  │  • ImageService      — WebP/AVIF + responsive        │  │
│  │  • TokenService      — JWT + refresh + replay detect │  │
│  │  • NotificationService — admin email alerts          │  │
│  │  • Backup / Restore-verify (cron)                    │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                                │
│  ┌─ Workers ─────────────────────────────────────────────┐  │
│  │  • bonusWorker (MLM payouts)                          │  │
│  │  • translationSweeper (continuous i18n fill)          │  │
│  │  • exchangeRateScheduler (daily USD/KGS)              │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────┬────────────┬──────────────┬─────────────┬──────────┘
           │            │              │             │
      ┌────▼────┐  ┌────▼────┐    ┌─────▼─────┐  ┌────▼────┐
      │ MySQL  │  │  Redis  │    │   SMTP    │  │ Gemini  │
      │  8.0   │  │  7.x    │    │  (email)  │  │   API   │
      └────────┘  └─────────┘    └───────────┘  └─────────┘
```

## 📂 Repo Layout

```
.
├── backend/                # Node 20 + Express 5 + Prisma 5
│   ├── src/
│   │   ├── routes/        # 18 route modules, each protected by zod
│   │   ├── services/      # business logic (translation, search, …)
│   │   ├── workers/       # background jobs (bonus, i18n sweep)
│   │   ├── validators/    # zod schemas — single source of truth
│   │   ├── i18n/          # translation registry + locales
│   │   ├── utils/         # logger, rateLimit, httpLogger
│   │   ├── openapi/       # OpenAPI 3.1 spec generation
│   │   ├── routes/health.ts  # /health + /health/ready
│   │   └── index.ts       # app entry
│   ├── prisma/
│   │   ├── schema.prisma  # 18 models
│   │   └── migrations/    # FULLTEXT index + RefreshToken
│   ├── scripts/           # backup.js + restore-verify.js
│   └── tests/             # 142 tests (108 DB-free + 34 MySQL integration)
├── frontend/               # Vue 3 + Vite + Pinia
│   └── src/
│       ├── components/    # blocks/ + common/ (LazyImage, etc.)
│       ├── composables/   # useTranslate, useImageSrcset, useIntersectionObserver
│       ├── views/         # routed pages
│       └── stores/        # Pinia stores
├── .github/workflows/      # CI + Deploy (GitHub Actions)
├── CI-CD.md                # pipeline runbook
└── BACKUP.md               # backup runbook
```

## 🚀 Hızlı Başlangıç

### Önkoşullar
- Node.js 20+
- MySQL 8.0+ (prod) veya SQLite (dev fallback)
- Redis 7.x (optional, rate-limit store)

### Backend
```bash
cd backend
cp .env.example .env       # DATABASE_URL, JWT_SECRET, CORS_ORIGINS, ...
npm ci
npx prisma generate
npx prisma db push         # SQLite veya MySQL
npx prisma db execute --file prisma/migrations/add_fulltext_search.sql --schema prisma/schema.prisma
npm run dev                # tsx watch — hot reload
```

### Frontend
```bash
cd frontend
npm ci
npm run dev                # Vite dev server :5173
```

### Test
```bash
cd backend
npm test                   # 108 DB-free tests (Vitest)
npm run test:coverage      # + v8 coverage report
```

### Docker (alternatif)
```bash
docker run -d --name pv-mysql -p 3306:3306 \
  -e MYSQL_DATABASE=pv_test -e MYSQL_USER=pv_test -e MYSQL_PASSWORD=pv_test_pw \
  mysql:8.0
# Then point DATABASE_URL=mysql://pv_test:pv_test_pw@127.0.0.1:3306/pv_test
```

## 🔐 Güvenlik

| Katman | Uygulama |
|---|---|
| **Transport** | HTTPS only (nginx + Let's Encrypt) |
| **Auth** | JWT access (15dk) + refresh (7g) HttpOnly cookie |
| **Replay detection** | Refresh token reuse → revoke whole family |
| **Passwords** | bcryptjs, cost 10 |
| **Rate limiting** | Per-endpoint (login 5/15dk, AI 20/dk, OCR 10/dk, …) |
| **Headers** | Helmet (CSP, X-Frame-Options, HSTS-ready) |
| **CORS** | Explicit allowlist via `CORS_ORIGINS` env |
| **Validation** | zod on every body/query/params; `strict()` mode |
| **Logging** | pino with redaction (passwords / tokens never logged) |
| **Open redirect** | `X-Request-Id` correlation for forensics |
| **Backups** | Daily mysqldump + 7/4/12 rotation + weekly restore-verify |

## 🌐 i18n & Çoklu Para Birimi

| Locale | Status | Use |
|---|---|---|
| 🇹🇷 Türkçe | **primary** | UI + product content source language |
| 🇷🇺 Русский | auto-AI | translated on save + continuous sweep |
| 🇰🇬 Кыргызча | auto-AI | translated on save + continuous sweep |
| 🇬🇧 English | manual | admin-triggered only |

| Currency | Use |
|---|---|
| KGS (primary) | All checkout, wallet, finance |
| USD | Catalog display + exchange-rate-based threshold (100 USD = free shipping banner) |

## 🛡️ Rate Limit Tablosu

| Endpoint | Limit | Per | Reason |
|---|---|---|---|
| `POST /auth/login` | 5 / 15dk | IP | Brute force |
| `POST /auth/register` | 3 / 1h | IP | Spam hesap |
| `PUT /auth/change-password` | 5 / 1h | user | Köküye kullanım |
| `POST /auth/refresh` | 30 / dk | IP | Token rotation flood |
| `POST /ai/translate` | 20 / dk | user | Gemini cost guard |
| `POST /admin/i18n/translate-batch` | 5 / dk | user | Batch = N×AI call |
| `POST /checkout/:orderId/verify` | 10 / dk | IP | Tesseract CPU |
| `POST /reviews` | 3 / 1h | user | Spam review |
| `GET /products/search` | 60 / dk | IP | Search abuse |
| Tüm diğer /api/* (default) | 300 / dk | IP | Genel |

## 🔍 Arama

MySQL FULLTEXT index (ngram parser) — TR/RU/KG/EN partial match:

```sql
ALTER TABLE Product ADD FULLTEXT INDEX product_fulltext_idx (name, description, barcode)
  WITH PARSER ngram;
```

- Sorgu < 2 char → LIKE fallback
- ≥ 2 char → FULLTEXT + BM25 relevance
- Response: `{ hits, total, page, limit, q, strategy, tookMs, snippet }`
- `snippet` HTML <mark>...</mark> ile highlight'lı

## 💾 Backup & DR

- **Script**: `backend/scripts/backup.js` (cron-friendly, Node, cross-platform)
- **Rotation**: 7 daily + 4 weekly + 12 monthly
- **Optional S3 push**: `--upload` flag
- **Restore-verify**: `backend/scripts/restore-verify.js` (her Cmt çalışır)
- **Full runbook**: [BACKUP.md](BACKUP.md)

## 🚢 CI/CD

| Workflow | Tetikleyici | Yaptığı |
|---|---|---|
| `ci.yml` | push / PR to main,develop | backend lint + test + build · frontend type-check + build · audit |
| `deploy.yml` | manual `workflow_dispatch` | release artifact → rsync to prod → PM2 restart → /health smoke |

- MySQL 8 service container (ephemeral, integration tests use it)
- Production deploys require GitHub Environment reviewer (`production`)
- Rollback: `ssh prod "ln -sfn releases/previous current && pm2 restart pv-backend"`

Full runbook: [CI-CD.md](CI-CD.md)

## 📚 API

OpenAPI 3.1 spec is auto-generated from the zod validators.

- **Live**: `GET /api/docs.json` (raw spec) · `GET /api/docs` (Swagger UI)
- **Local**: http://localhost:3000/api/docs after `npm run dev`
- **16 tag groups**: Auth, Products, Categories, Slider, Settings, CMS Pages, Orders, Checkout, Finance, Exchange Rate, System, Admin, AI / i18n, Media, Product Reviews, Store Reviews, Health

Generate typed client (TypeScript):
```bash
npx openapi-typescript http://localhost:3000/api/docs.json -o src/api/types.ts
```

## 🧪 Test Suite

142 tests total · **108 DB-free + 34 MySQL integration**

| Suite | Count | What |
|---|---|---|
| `logger.test.ts` | 5 | Pino redaction contract (passwords/tokens never appear) |
| `openapi.test.ts` | 7 | Spec is valid, jobs/secrets/tags present |
| `imageService.test.ts` | 4 | WebP/AVIF variants + withoutEnlargement |
| `searchService.test.ts` | 22 | Tokenize, highlight, snippet, routing, fallback |
| `backup.test.ts` | 4 | CLI validation + rotation algorithm |
| `ci.test.ts` | 13 | Workflow YAML jobs/secrets/rollback |
| `rateLimit.test.ts` | 12 | Limit enforcement, key isolation, presets |
| `tokenService.test.ts` | 13 | Sign/verify/rotate/replay detection |
| `notificationService.test.ts` | 12 | Per-recipient locale, preferences, error swallow |
| `useImageSrcset.test.ts` | 7 | Frontend helper, runs in backend vitest |
| `i18nStringArray.test.ts` | 5 | Product.benefits string-array translation |
| `pushService.test.ts` | 26 | VAPID, subscribe/unsubscribe, preferences, audit log |
| `adminEvents.test.ts` | 8 | SSE bus publish/subscribe/refcount |
| `metrics.test.ts` | 16 | Counter/Histogram + middleware + snapshot |
| `securityHeaders.test.ts` | 12 | CSP / HSTS / X-Frame / Permissions-Policy |
| `prometheus.test.ts` | 11 | text/plain v0.0.4 exporter |
| `adminLogs.test.ts` | 8 | Tail endpoint, parse, filter, since |
| `migrations.test.ts` | 29 | SQL shape + idempotency + 3 migrations |
| auth/checkout/ocr/i18n | 6 failed | Need MySQL (run in CI container) |

### Frontend (Vitest + happy-dom + @vue/test-utils)

| Suite | Count | What |
|---|---|---|
| `useImageSrcset.test.ts` | 10 | Pure-JS srcset builder |
| `LazyImage.test.ts` | 8 | `<picture>` structure, eager/lazy, external URLs |
| `AdminMetricsWidget.test.ts` | 9 | Aggregation + template (axios mocked) |
| `i18n.test.ts` | 14 | TR/RU/KG JSON parity (448 keys × 3 locales = 100%) |

## 🤝 Contributing

1. Branch from `main` (or `develop` for features)
2. Run the local pre-PR check (see [CI-CD.md](CI-CD.md#local-pre-pr-check))
3. PR → CI runs automatically; reviewers see the green/red badge
4. After 1 approval + green CI → squash-merge to `main`
5. Trigger production deploy via `workflow_dispatch` (manual, requires reviewer)

## 📄 Lisans

Private — © Power Vital LLC. Tüm hakları saklıdır.
