// Refresh token cookie helpers.
//
// Why HttpOnly cookies?
//   • JS on the page cannot read them → XSS-safe storage for the refresh
//     token (the access token stays in JS memory only).
//   • Browser sends the cookie automatically on every request to the
//     configured path (so the SPA doesn't have to thread tokens through
//     every fetch call).
//
// Defaults match the most common case (cross-site same-origin SPAs);
// override via env if you need different behaviour.

import { Response } from 'express';

const DEFAULT_NAME = 'pv_refresh';
const DEFAULT_PATH = '/api/v1/auth';
const DEFAULT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface CookieOptions {
  name?: string;
  path?: string;
  maxAgeMs?: number;
  // Force Secure even outside production (useful for staging on https)
  forceSecure?: boolean;
}

const isProd = () => process.env.NODE_ENV === 'production';

export const setRefreshCookie = (res: Response, raw: string, opts: CookieOptions = {}): void => {
  res.cookie(opts.name || DEFAULT_NAME, raw, {
    httpOnly: true,
    secure: opts.forceSecure ?? isProd(),
    sameSite: 'lax',
    path: opts.path || DEFAULT_PATH,
    maxAge: opts.maxAgeMs ?? DEFAULT_MAX_AGE_MS
  });
};

export const clearRefreshCookie = (res: Response, opts: CookieOptions = {}): void => {
  res.clearCookie(opts.name || DEFAULT_NAME, {
    path: opts.path || DEFAULT_PATH,
    httpOnly: true,
    secure: opts.forceSecure ?? isProd(),
    sameSite: 'lax'
  });
};

export const REFRESH_COOKIE_NAME = DEFAULT_NAME;
