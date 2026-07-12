-- Adds the admin-tunable logo scale multiplier to SiteSettings. The
-- Site Settings UI exposes a 50%-200% slider so the admin can right-size
-- an uploaded logo without editing the image itself; the navbar/footer
-- read this value and apply it as a CSS scale on top of the base sizes.
--
-- Nullable with a default so this script is safe to run on existing
-- rows — ALTER TABLE ... ADD COLUMN is INSTANT in MySQL 8 for nullable
-- adds with a default (no long table lock).
--
-- Run with:
--   npx prisma db execute --schema=prisma/schema.prisma --file=prisma/migrations/add_logo_scale.sql
-- Or apply manually:
--   mysql -u <user> -p <db> < prisma/migrations/add_logo_scale.sql
--
-- Rollback (run manually):
--   ALTER TABLE `SiteSettings` DROP COLUMN `logoScale`;

-- Helper: column existence check, idempotent re-runs.
SET @col_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'SiteSettings'
    AND COLUMN_NAME = 'logoScale'
);

SET @sql := IF(@col_exists = 0,
  'ALTER TABLE `SiteSettings`
     ADD COLUMN `logoScale` DOUBLE NULL DEFAULT 1 AFTER `logoUrl`',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
