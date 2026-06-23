// Shared structured logger for the whole backend.
//
// Why pino?
//   • Fastest Node.js JSON logger (4-5x faster than winston, ~10x bunyan)
//   • Built-in redaction — passwords/tokens/JWTs NEVER leak to disk
//   • Per-request child loggers via pino-http (req.log)
//   • Production-friendly: writes JSON to stdout, dev uses pino-pretty
//
// Usage:
//   import { logger } from '../utils/logger';
//   logger.info({ orderId }, 'order created');
//
// In a request handler (after pino-http middleware):
//   req.log.info({ userId }, 'authenticated');
//
// NEVER call console.log/error in route handlers — use logger so the
// redaction + structured fields actually apply.
import pino, { Logger, LoggerOptions } from 'pino';

const isDev = process.env.NODE_ENV !== 'production';
const isTest = process.env.NODE_ENV === 'test';

// In test mode, silence everything but errors to keep CI logs readable.
// Tests that NEED log output can stub the logger in beforeEach.
const level = isTest
  ? 'silent'
  : (process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'));

// File transport: when LOG_FILE is set, also write JSON to that path.
// The admin logs viewer reads from this file. Default: ./logs/pv-backend.log.
const logFilePath = process.env.LOG_FILE;
const useFileTransport = !!logFilePath && !isTest;

const REDACT_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'res.headers["set-cookie"]',
  // Request body fields
  'req.body.password',
  'req.body.currentPassword',
  'req.body.newPassword',
  'req.body.token',
  'req.body.refreshToken',
  'req.body.authorization',
  'req.body.creditCard',
  'req.body.cardNumber',
  'req.body.cvv',
  // Top-level fields (e.g. when something is logged flat)
  'password',
  'currentPassword',
  'newPassword',
  'token',
  'refreshToken',
  'authorization',
  'creditCard',
  'cardNumber',
  'cvv',
  // Wildcard for nested user records
  '*.password',
  '*.passwordHash',
  '*.token',
  '*.secret',
  '*.apiKey'
];

const options: LoggerOptions = {
  level,
  redact: {
    paths: REDACT_PATHS,
    censor: '[REDACTED]'
  },
  base: {
    service: 'pv-backend',
    env: process.env.NODE_ENV || 'development',
    pid: process.pid
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level(label) {
      return { level: label };
    }
  }
  // Note: transport config (pino-pretty in dev, pino/file when LOG_FILE is
  // set) is applied via a separate multiStream below so we can keep the
  // base options plain and the transports pluggable.
};

// Build the transport list. Pino's "transport" option accepts an array
// for multi-destination.
const transports: any[] = [];
if (isDev && !isTest) {
  transports.push({
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:HH:MM:ss.l',
      ignore: 'pid,hostname,service,env',
      singleLine: false
    }
  });
}
if (useFileTransport) {
  transports.push({
    target: 'pino/file',
    options: { destination: logFilePath, mkdir: true }
  });
}
if (transports.length > 0) {
  // The type expects a single transport; we use `as any` to keep the
  // LoggerOptions signature happy while still benefiting from multi-stream.
  (options as any).transport = transports.length === 1 ? transports[0] : transports;
}

export const logger: Logger = pino(options);

// Expose the log file path so other modules (notably adminLogs route)
// know where to read from.
export const LOG_FILE_PATH = logFilePath;

/**
 * Create a child logger with a pre-bound context (e.g. userId, orderId).
 * Cheap — no I/O, no allocation hot path.
 */
export const childLogger = (bindings: Record<string, unknown>): Logger =>
  logger.child(bindings);

export default logger;
