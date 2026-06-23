// ────────────────────────────────────────────────────────────────────────────
// TranslationSweeper — DISABLED.
//
// The admin manually owns translations now (PATCH /admin/i18n/record).
// We keep this file as a no-op stub so the import in src/index.ts
// doesn't break the build. The cron is intentionally inert — leaving
// AI auto-translation running in the background would silently
// overwrite admin edits.
// ────────────────────────────────────────────────────────────────────────────
import { logger } from '../utils/logger';

logger.info('[TranslationSweeper] disabled — manual translation mode');
