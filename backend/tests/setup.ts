// Vitest setup: load .env.test before any module reads it
import { config as loadEnv } from 'dotenv';
import path from 'path';

loadEnv({ path: path.resolve(__dirname, '../.env.test'), override: true });

// Defensive: make sure JWT_SECRET is set even if dotenv missed
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test-jwt-secret-fallback';
}
