// HTTP request middleware: request ID + pino-http request logger.
//
// Replaces the previous morgan('dev') logger with a structured pino logger.
// Each incoming request gets a unique `X-Request-Id` (echoed back in the
// response header) and a child logger accessible as `req.log`.
//
// Why request IDs?
//   • Trace a single user action across the entire backend stack
//   • Filter grep-able logs by ID when debugging a user-reported issue
//   • Correlate with nginx / Cloudflare access logs
import { Request, Response, NextFunction, RequestHandler, RequestHandler as ExpressRequestHandler } from 'express';
import { randomUUID } from 'crypto';
import pinoHttp from 'pino-http';
import { logger } from './logger';

declare module 'express-serve-static-core' {
  interface Request {
    id?: string;
    log: typeof logger;
  }
}

/** Echo the request ID back so the client (or upstream proxy) can quote it. */
export const requestId: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  const incoming = req.headers['x-request-id'];
  const id = (typeof incoming === 'string' && incoming.length > 0 && incoming.length < 200)
    ? incoming
    : randomUUID();
  req.id = id;
  res.setHeader('X-Request-Id', id);
  next();
};

/**
 * pino-http middleware. Replaces morgan entirely.
 * Uses the existing req.id set by `requestId` so every log line for the
 * request is tagged with the same correlation ID.
 */
export const httpLogger: RequestHandler = pinoHttp({
  logger,
  genReqId: (req) => (req as Request).id || randomUUID(),
  // Use req.log as the request-scoped child logger
  customProps: (req) => ({ requestId: (req as Request).id }),
  customLogLevel: (_req, res, err) => {
    if (err) return 'error';
    if (res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  // Don't log the raw body — zod validation will run AFTER this and the
  // redaction rules in logger.ts will scrub sensitive fields. We do log
  // body shape (keys only) so we can see what's being sent without
  // risking leaks of password/token fields if redaction ever breaks.
  serializers: {
    req(req: any) {
      return {
        id: req.id,
        method: req.method,
        url: req.url,
        // remoteAddress intentionally omitted — behind nginx it's the proxy
        remoteAddress: req.socket?.remoteAddress
      };
    },
    res(res: any) {
      return {
        statusCode: res.statusCode
      };
    }
  },
  // Skip noisy routes from the access log (health checks flood the log)
  autoLogging: {
    ignore: (req) => req.url === '/health' || req.url === '/health/ready' || req.url === '/favicon.ico'
  }
}) as RequestHandler;
