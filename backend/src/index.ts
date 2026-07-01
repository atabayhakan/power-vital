import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import productRoutes from './routes/product';
import financeRoutes from './routes/finance';
import orderRoutes from './routes/order';
import systemRoutes from './routes/system';
import reviewsRoutes from './routes/reviews';
import storeReviewsRoutes from './routes/storeReviews';
import sliderRoutes from './routes/slider';
import categoryRoutes from './routes/category';
import settingsRoutes from './routes/settings';
import checkoutRoutes from './routes/checkout';
import uploadRoutes from './routes/upload';
import adminRoutes from './routes/admin';
import pagesRoutes from './routes/pages';
// aiRoutes is no longer mounted — see comment above. The file is
// kept for reference; we just don't wire it into the express app.
import adminI18nRoutes from './routes/adminI18n';
import healthRoutes from './routes/health';
import adminEventsRoutes, { adminEvents } from './routes/adminEvents';
import adminTrendsRoutes from './routes/adminTrends';
import adminSearchRoutes from './routes/adminSearch';
import adminAnalyticsRoutes from './routes/adminAnalytics';
import adminImpersonationRoutes from './routes/adminImpersonation';
import adminMetricsRoutes from './routes/adminMetrics';
import adminLogsRoutes from './routes/adminLogs';
import pushRoutes from './routes/push';
import cartRoutes from './routes/cart';
import presenceRoutes from './routes/presence';
import inventoryRoutes from './routes/inventory';
import adminCartRecoveryRoutes from './routes/adminCartRecovery';
import adminBulkRoutes from './routes/adminBulk';
import prometheusMetricsRoute from './routes/metrics';
import { metricsMiddleware } from './utils/metricsMiddleware';
import { prismaQueryTracker, attachQueryLogger } from './utils/prismaQueryLogger';
import prisma from './lib/prisma';
import path from 'path';
import fs from 'fs';
import cookieParser from 'cookie-parser';
import { requestId, httpLogger } from './utils/httpLogger';
import { logger } from './utils/logger';
import { registerAllRoutes } from './openapi/routes';
import { buildOpenApiDocument } from './openapi/registry';
import swaggerUi from 'swagger-ui-express';
import { limit, RATE_LIMITS } from './utils/rateLimit';

// Background Workers & Services
import './workers/bonusWorker';
import './workers/translationSweeper';

dotenv.config();

import rateLimit from 'express-rate-limit';

const app = express();
const PORT = process.env.PORT || 3000;

// 🛡️ Trust the nginx reverse proxy. Without this, express-rate-limit
// throws an ERR_ERL_UNEXPECTED_X_FORWARDED_FOR warning because nginx
// forwards the real client IP via X-Forwarded-For — and the limiter
// can't tell which hop is the actual user.
app.set('trust proxy', 1);

// Global fallback rate limit (300/min per IP) — applies to any /api
// route that DIDN'T opt in to a tighter per-endpoint limit. Per-endpoint
// limits (auth, AI, OCR, reviews, search) are MORE restrictive.
const apiLimiter = limit(RATE_LIMITS.default);

// Middleware order matters:
//  1. requestId  — assign ID before anything logs
//  2. httpLogger — pino-http logs the request (with ID)
//  3. helmet     — security headers (CSP, HSTS, X-Frame-Options, …)
//  4. cors       — preflight
//  5. json       — body parser
//  6. apiLimiter — rate limit only on /api (not /health)
app.use(requestId);
app.use(httpLogger as any);
// Helmet with a tight CSP. We allow:
//   - default 'self' for everything by default
//   - img-src 'self' data: https: (uploaded product images, AVIF/WebP, data URIs)
//   - script-src 'self' (no inline scripts; the Vite-built bundle is hashed)
//   - style-src 'self' 'unsafe-inline' (Vue scoped styles need this; remove in prod if you migrate to <style>)
//   - connect-src 'self' + Sentry endpoints (for error tracking ingest when DSN is set)
//   - font-src 'self' data:
//   - frame-ancestors 'none' (no embedding; clickjacking defense)
//   - upgrade-insecure-requests (force HTTPS in production)
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      scriptSrc: ["'self'"],
      // Vite dev mode injects styles inline — once we ship to production
      // with the built bundle this can drop to ["'self'"].
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      fontSrc: ["'self'", 'data:'],
      // Sentry browsersdk posts to *.sentry.io. If the DSN is not set,
      // these entries are harmless — the browser never opens the
      // connection. We use https: rather than a wildcard to keep the
      // policy tight.
      connectSrc: process.env.SENTRY_DSN
        ? ["'self'", 'https://*.sentry.io', 'https://*.ingest.sentry.io']
        : ["'self'"],
      mediaSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      formAction: ["'self'"],
      // In production we want browsers to upgrade any http:// requests
      // to https:// — combined with HSTS below this forces HTTPS.
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
    }
  },
  // HSTS: 1 year, include subdomains, allow preload list submission
  strictTransportSecurity: process.env.NODE_ENV === 'production' ? {
    maxAge: 31_536_000,         // 1 year
    includeSubDomains: true,
    preload: true
  } : false,
  // Defense against MIME sniffing — block IE/Chrome from guessing
  // Content-Type based on content
  xContentTypeOptions: true,
  // Don't allow our site to be framed anywhere — clickjacking
  xFrameOptions: { action: 'deny' },
  // Referrer: send only the origin on cross-origin, full URL on same-origin
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  // X-DNS-Prefetch-Control: off (no leak of DNS lookups)
  xDnsPrefetchControl: { allow: false },
  // Cross-Origin policies — defense in depth against side-channel attacks
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'same-origin' },
  crossOriginEmbedderPolicy: false  // we use no cross-origin embeds; can be true
}) as any);

// Permissions-Policy: disable a long list of browser features we don't
// use so an XSS attack can't enable them. Helmet 8 doesn't ship a
// built-in helper for this header so we set it manually.
app.use((_req, res, next) => {
  res.setHeader('Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), ' +
    'magnetometer=(), gyroscope=(), accelerometer=(), interest-cohort=()'
  );
  next();
});

// Response compression — gzip/deflate for any response over 1 kB.
// Skips already-compressed content (images, fonts) automatically.
// Substantial bandwidth saving on the public catalog endpoints.
app.use(compression({
  threshold: 1024,
  level: 6,
  // Don't bother compressing SSE streams or anything that already has
  // a content-encoding set (binary uploads etc).
  filter: (req, res) => {
    const ce = res.getHeader('Content-Encoding');
    if (ce) return false;
    if (req.headers.accept?.includes('text/event-stream')) return false;
    return compression.filter(req, res);
  }
}));

app.use(cors({
  origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
} as any));
app.use(express.json({ limit: '10mb' }) as any);
app.use(cookieParser() as any); // For HttpOnly refresh-token cookies
app.use(metricsMiddleware); // Track every request for /admin/metrics
// Query tracker MUST come BEFORE the rate limiter so N+1 detection
// captures the rate-limit rejection path too. It also resets per-request
// stats at the start of each HTTP request.
attachQueryLogger(prisma as any);
app.use(prismaQueryTracker.reset);
app.use('/api', apiLimiter as any); // Apply rate limiter to all /api routes

// Health endpoints (rate-limit-free, structured, no auth)
app.use('/health', healthRoutes as any);

// Prometheus scrape endpoint (no auth, text/plain). The metricsMiddleware
// already skips this path so it won't be counted in the live metrics.
app.use('/metrics', prometheusMetricsRoute as any);

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/finance', financeRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/system', systemRoutes);
app.use('/api/v1/reviews', reviewsRoutes);
app.use('/api/v1/store-reviews', storeReviewsRoutes);
app.use('/api/v1/slides', sliderRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/checkout', checkoutRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/pages', pagesRoutes);
// /api/v1/ai is intentionally not mounted — the admin manually
// owns translations now, and the public storefront falls back to
// the TR source when a locale is empty (see /lib/i18n fallback).

// ═══ ADMIN ROUTES ═══
//
// Express middleware order matters: SPECIFIC routes must be mounted
// BEFORE any catch-all on the same prefix, otherwise the catch-all
// shadows them and the more specific handlers never fire. We mount
// `/admin/i18n`, `/admin/metrics`, `/admin/logs`, `/admin/impersonation`
// and `/admin/cart-recovery` BEFORE `/admin` (catch-all from adminRoutes
// which only handles /dashboard, /users, /withdrawals).
//
// NOTE: `/admin/broadcast` reuses pushRoutes so the same handlers serve
// both `/admin/broadcast` and `/push/broadcast` URLs.
app.use('/api/v1/admin/i18n', adminI18nRoutes);
app.use('/api/v1/admin/metrics', adminMetricsRoutes);
app.use('/api/v1/admin/logs', adminLogsRoutes as any);
app.use('/api/v1/admin/impersonation', adminImpersonationRoutes);
app.use('/api/v1/admin/cart-recovery', adminCartRecoveryRoutes);
app.use('/api/v1/admin/bulk', adminBulkRoutes);
app.use('/api/v1/admin/broadcast', pushRoutes);
app.use('/api/v1/admin/events', adminEventsRoutes); // SSE — must mount BEFORE the catch-all /admin
app.use('/api/v1/admin/trends', adminTrendsRoutes);
app.use('/api/v1/admin/search', adminSearchRoutes);
app.use('/api/v1/admin/analytics', adminAnalyticsRoutes);
app.use('/api/v1/admin', adminRoutes);

app.use('/api/v1/push', pushRoutes);
app.use('/api/v1/cart', cartRoutes);
app.use('/api/v1/presence', presenceRoutes);
app.use('/api/v1/inventory', inventoryRoutes);

// Front-end error ingestion. Mounted BEFORE the admin catch-all so
// the public /report endpoint doesn't get shadowed. Rate limiting for
// the public /report route is applied inside errors.ts itself, scoped
// to just that route (not the admin-only /recent and /:id/resolve).
import errorsRoutes from './routes/errors';
app.use('/api/v1/errors', errorsRoutes);

// Serve uploaded files
// Use UPLOAD_DIR env var if set, else fallback relative to compiled __dirname
const staticUploadDir = process.env.UPLOAD_DIR
  ? process.env.UPLOAD_DIR
  : path.join(__dirname, '../uploads');
if (!fs.existsSync(staticUploadDir)) fs.mkdirSync(staticUploadDir, { recursive: true });
app.use('/uploads', express.static(staticUploadDir, {
  maxAge: '30d',
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.webp') || filePath.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      res.setHeader('Cache-Control', 'public, max-age=2592000, immutable');
    }
  }
}) as any);
logger.info({ uploadDir: staticUploadDir }, '/uploads static serving');

// OpenAPI spec + Swagger UI
// Generated at startup from the shared zod registry. Visit:
//   • http://localhost:3000/api/docs       — interactive Swagger UI
//   • http://localhost:3000/api/docs.json  — raw OpenAPI 3.1 spec
registerAllRoutes();
const openapiDocument = buildOpenApiDocument();
app.get('/api/docs.json', (_req, res) => res.json(openapiDocument));
app.use('/api/docs', swaggerUi.serve as any, swaggerUi.setup(openapiDocument, {
  customSiteTitle: 'Power Vital API Docs',
  customCss: '.swagger-ui .topbar { display: none }'
}) as any);
logger.info('OpenAPI docs at /api/docs');

// Cache observability middleware — must come AFTER all routes so the
// `finish` listener catches the final X-Cache header set by handlers.
import { cacheStatsMiddleware } from './utils/cacheStats';
app.use(cacheStatsMiddleware);

app.listen(PORT, () => {
  logger.info({ port: PORT, env: process.env.NODE_ENV || 'development' }, 'Server is listening');
});
