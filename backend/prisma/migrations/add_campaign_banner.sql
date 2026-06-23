-- Adds the admin-scheduled hero campaign banner fields to
-- SiteSettings. The countdown banner reads these on every page
-- load; if `campaignEnabled` is FALSE the banner hides itself
-- (no DB write needed to "stop" a campaign — just flip the
-- toggle off in the admin panel).
--
-- All columns are nullable or have defaults so this script is
-- safe to run on existing rows — it will not lock the table
-- for long (ALTER TABLE ... ADD COLUMN is INSTANT in MySQL 8
-- for nullable adds with defaults).
--
-- Run with:
--   npx prisma db execute --schema=prisma/schema.prisma --file=prisma/migrations/add_campaign_banner.sql
-- Or apply manually:
--   mysql -u <user> -p <db> < prisma/migrations/add_campaign_banner.sql
--
-- Rollback (run manually):
--   ALTER TABLE `SiteSettings`
--     DROP COLUMN `campaignEnabled`,
--     DROP COLUMN `campaignEndsAt`,
--     DROP COLUMN `campaignTitle`,
--     DROP COLUMN `campaignCta`,
--     DROP COLUMN `campaignLink`;

-- Helper: column existence check, idempotent re-runs.
SET @col_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'SiteSettings'
    AND COLUMN_NAME = 'campaignEnabled'
);

SET @sql := IF(@col_exists = 0,
  'ALTER TABLE `SiteSettings`
     ADD COLUMN `campaignEnabled` TINYINT(1) NOT NULL DEFAULT 0 AFTER `activeThemeId`,
     ADD COLUMN `campaignEndsAt`  DATETIME(3) NULL AFTER `campaignEnabled`,
     ADD COLUMN `campaignTitle`   VARCHAR(500) NULL AFTER `campaignEndsAt`,
     ADD COLUMN `campaignCta`     VARCHAR(200) NULL AFTER `campaignTitle`,
     ADD COLUMN `campaignLink`    VARCHAR(500) NULL AFTER `campaignCta`',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
