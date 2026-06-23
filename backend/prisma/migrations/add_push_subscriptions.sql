-- =============================================================================
-- Migration: Add PushSubscription table for Web Push API
-- =============================================================================
-- Creates the `PushSubscription` table that stores browser push subscriptions
-- (one row per device the user opts in from).
--
-- Design:
--   • `endpoint` is the FCM / Mozilla URL returned by PushManager.subscribe().
--     Capped at 512 chars because MySQL cannot unique-index full TEXT.
--   • `p256dh` + `auth` are the ECIES public keys used to encrypt the payload
--     to the subscriber. Stored as TEXT because Chrome/Firefox keys can be
--     87+ bytes (base64-encoded p256dh is ~88 chars; auth ~22 chars).
--   • `preferences` is a JSON string of per-event opt-outs:
--       { "order_paid": false, "order_shipped": true }
--     Empty `{}` means "subscribed to all events" (default).
--   • `lastSeenAt` lets us expire stale rows in a future cron sweep.
--
-- Run with:
--   npx prisma db execute --schema=prisma/schema.prisma --file=prisma/migrations/add_push_subscriptions.sql
-- Or apply manually:
--   mysql -u <user> -p <db> < prisma/migrations/add_push_subscriptions.sql
--
-- Safe to re-run: drops the table if it exists, then recreates it.
-- ⚠️  Re-running DESTROYS existing push subscriptions. Do NOT run on prod
--     unless you intend to wipe them.
--
-- Rollback (run manually):
--   DROP TABLE IF EXISTS `PushSubscription`;
-- =============================================================================

-- Drop the existing table if it exists (idempotent re-runs in dev)
SET @table_exists := (
  SELECT COUNT(*)
  FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'PushSubscription'
);
SET @sql := IF(@table_exists > 0,
  'DROP TABLE `PushSubscription`',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Create the table.
-- Note: we use CASCADE on userId so deleting a user automatically drops their
-- push rows (no orphan subscriptions). This mirrors the RefreshToken pattern.
CREATE TABLE `PushSubscription` (
  `id`           VARCHAR(191) NOT NULL,
  `userId`       VARCHAR(191) NOT NULL,
  `endpoint`     VARCHAR(512) NOT NULL,
  `p256dh`       TEXT         NOT NULL,
  `auth`         TEXT         NOT NULL,
  `userAgent`    TEXT         NULL,
  `preferences`  TEXT         NOT NULL,
  `createdAt`    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `lastSeenAt`   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `PushSubscription_endpoint_key` (`endpoint`),
  KEY `PushSubscription_userId_idx` (`userId`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Foreign key to User (cascade on delete).
-- Prisma's naming convention for MySQL FKs is `Tablename_fkeyB_index`.
-- We use the explicit name so re-runs work even if Prisma's auto-name shifts.
ALTER TABLE `PushSubscription`
  ADD CONSTRAINT `PushSubscription_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `User` (`id`)
  ON DELETE CASCADE
  ON UPDATE CASCADE;

-- Verification queries (comment out for prod):
-- SELECT COUNT(*) AS push_sub_rows FROM `PushSubscription`;
-- SHOW INDEX FROM `PushSubscription`;
-- SHOW CREATE TABLE `PushSubscription`\G
