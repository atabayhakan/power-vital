// Per-endpoint rate limiting.
//
// Why per-endpoint?
//   • The previous global 150/min was too permissive for high-risk endpoints
//     (login brute force, AI cost) and too strict for the catalogue.
//   • A single misbehaving client (or a misbehaving scanner) could fill
//     the global bucket and lock out real users.
//
// What's the key?
//   • `ip` (req.ip) for unauthenticated endpoints
//   • `user:{id}` (from JWT) for authenticated endpoints — survives shared IPs
//   • `ip:route` composite so each endpoint has its own bucket per IP
//
// Standard 429 response envelope:
//   {
//     "error": "Too many requests, please slow down.",
//     "limit": 5,
//     "windowSeconds": 900,
//     "retryAfter": 432  // seconds
//   }
// Plus standard `Retry-After`, `X-RateLimit-Limit`, `X-RateLimit-Remaining`
// headers (auto-added by express-rate-limit).
import rateLimit, { Options, RateLimitRequestHandler, ipKeyGenerator } from 'express-rate-limit';
import { Request, Response } from 'express';
import { logger } from './logger';

export interface LimitSpec {
  /** Short identifier for the bucket (e.g. "login", "ai:translate") */
  name: string;
  /** Max requests in the window */
  max: number;
  /** Window length in seconds */
  windowSeconds: number;
  /**
   * If true, scope the bucket to the authenticated user (when present),
   * falling back to IP. Use this for endpoints that may be called by
   * many users from the same IP (e.g. corporate NAT).
   */
  perUser?: boolean;
  /**
   * Custom message shown in the JSON envelope when the limit is hit.
   * Defaults to a generic rate-limit message.
   */
  message?: string;
}

/**
 * Build an express-rate-limit middleware from a LimitSpec.
 * The bucket key is always namespaced by route to prevent one endpoint
 * from starving another.
 */
export const limit = (spec: LimitSpec): RateLimitRequestHandler => {
  const windowMs = spec.windowSeconds * 1000;
  return rateLimit({
    windowMs,
    max: spec.max,
    standardHeaders: true,   // RateLimit-* headers (RFC draft)
    legacyHeaders: false,    // disable X-RateLimit-* legacy
    // Namespace the bucket so the SAME IP can't use up the login bucket
    // and the AI bucket at the same time — each endpoint gets its own.
    // We use ipKeyGenerator() so the library can hash IPv6 addresses
    // (without it express-rate-limit throws ERR_ERL_KEY_GEN_IPV6).
    keyGenerator: (req: Request, _res: Response): string => {
      const route = `${req.method} ${req.baseUrl || ''}${req.path || ''}`;
      if (spec.perUser && (req as any).user?.id) {
        return `user:${(req as any).user.id}:${spec.name}:${route}`;
      }
      // req.ip honours the trust-proxy setting (req.ip, not req.connection.remoteAddress)
      const ip = req.ip || 'unknown';
      return `ip:${ipKeyGenerator(ip)}:${spec.name}:${route}`;
    },
    handler: (req: Request, res: Response) => {
      // Log so we can spot abusive clients / scripts
      logger.warn({
        limit: spec.name,
        ip: req.ip,
        userId: (req as any).user?.id,
        path: req.originalUrl,
        method: req.method
      }, 'rate limit exceeded');
      res.status(429).json({
        error: spec.message || 'Too many requests, please slow down.',
        limit: spec.max,
        windowSeconds: spec.windowSeconds,
        retryAfter: Math.ceil((res.getHeader('Retry-After') as number | string | undefined) as any || spec.windowSeconds)
      });
    },
    skip: (req: Request) => {
      // Never rate-limit health checks
      if (req.path === '/health' || req.path === '/health/ready') return true;
      return false;
    }
  });
};

// ── Standard presets ──────────────────────────────────────────────────────
// Use these for consistency across the codebase. Tunable per-spec in the
// call site, but starting from the preset keeps the security posture aligned.

export const RATE_LIMITS = {
  /** Auth — very tight, brute-force resistant */
  auth: {
    login:        { name: 'auth:login',        max: 5,   windowSeconds: 15 * 60, perUser: false },
    register:     { name: 'auth:register',     max: 3,   windowSeconds: 60 * 60, perUser: false },
    changePwd:    { name: 'auth:changePwd',    max: 5,   windowSeconds: 60 * 60, perUser: true  },
  },
  /** AI / i18n — protects paid Gemini API budget */
  ai: {
    translate:    { name: 'ai:translate',      max: 20,  windowSeconds: 60,      perUser: true  },
    translateBatch:{ name: 'ai:translateBatch', max: 5,  windowSeconds: 60,      perUser: true  },
  },
  /** OCR — Tesseract is CPU-heavy */
  ocr: {
    verify:       { name: 'ocr:verify',        max: 10,  windowSeconds: 60,      perUser: false },
  },
  /** Reviews — spam guard */
  reviews: {
    submit:       { name: 'reviews:submit',    max: 3,   windowSeconds: 60 * 60, perUser: true  },
  },
  /** Generic public read protection (e.g. search abuse) */
  public: {
    search:       { name: 'public:search',     max: 60,  windowSeconds: 60,      perUser: false }
  },
  /** Default fallback for any other /api endpoint that didn't opt in */
  default: { name: 'default', max: 300, windowSeconds: 60, perUser: false }
} as const;
