-- =============================================================================
-- Migration: Add BroadcastLog table for push broadcast audit trail
-- =============================================================================
-- Every admin-initiated push broadcast (POST /api/v1/push/broadcast) writes
-- a row here so the operator can later answer:
--   • "Who sent what to whom, and when?"
--   • "How many subscriptions delivered vs expired vs failed?"
--
-- Design:
--   • actorId (admin) is nullable with ON DELETE SET NULL — admins come
--     and go, but the audit row must survive user deletion.
--   • targetId (customer/distributor) cascades — when a user is deleted,
--     their broadcast history goes too. (Privacy: you can't audit a
--     deleted recipient.)
--   • Three counters (sent / expired / failed) match the pushService
--     return shape, so the log row is sufficient to reconstruct the
--     outcome without joining elsewhere.
--   • Indexes target the two real queries:
--       - "what did I (admin) send recently?" → (actorId, createdAt)
--       - "what was sent to user X?"             → (targetId, createdAt)
--       - "how often does event K fire?"         → (eventKey)
--
-- Run with:
--   npx prisma db execute --schema=prisma/schema.prisma --file=prisma/migrations/add_broadcast_log.sql
--
-- Safe to re-run: drops the table if it exists, then recreates it.
-- ⚠️  Re-running DESTROYS existing broadcast history. Do NOT run on
--     production unless you intend to wipe audit data.
--
-- Rollback (run manually):
--   DROP TABLE IF EXISTS `BroadcastLog`;
-- =============================================================================

-- Drop the existing table if it exists (idempotent re-runs in dev)
SET @table_exists := (
  SELECT COUNT(*)
  FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'BroadcastLog'
);
SET @sql := IF(@table_exists > 0,
  'DROP TABLE `BroadcastLog`',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Create the audit table.
-- Note: actorId allows NULL so deletion of an admin preserves their log rows.
-- targetId cascades so deletion of a customer also drops their audit trail
-- (privacy-by-default).
CREATE TABLE `BroadcastLog` (
  `id`                 VARCHAR(191) NOT NULL,
  `actorId`            VARCHAR(191) NULL,
  `targetId`           VARCHAR(191) NOT NULL,
  `eventKey`           VARCHAR(64)  NOT NULL,
  `sent`               INT          NOT NULL DEFAULT 0,
  `expired`            INT          NOT NULL DEFAULT 0,
  `failed`             INT          NOT NULL DEFAULT 0,
  `note`               TEXT         NULL,
  `parentBroadcastId`  VARCHAR(64)  NULL,
  `createdAt`          DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `BroadcastLog_actorId_createdAt_idx` (`actorId`, `createdAt`),
  KEY `BroadcastLog_targetId_createdAt_idx` (`targetId`, `createdAt`),
  KEY `BroadcastLog_eventKey_idx` (`eventKey`),
  KEY `BroadcastLog_parentBroadcastId_idx` (`parentBroadcastId`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Foreign keys.
-- • actor: SET NULL on delete so admin-deletion doesn't lose audit data.
-- • target: CASCADE on delete so deleting a customer also drops their
--   notification history (GDPR / privacy-friendly).
ALTER TABLE `BroadcastLog`
  ADD CONSTRAINT `BroadcastLog_actorId_fkey`
  FOREIGN KEY (`actorId`) REFERENCES `User` (`id`)
  ON DELETE SET NULL
  ON UPDATE CASCADE;

ALTER TABLE `BroadcastLog`
  ADD CONSTRAINT `BroadcastLog_targetId_fkey`
  FOREIGN KEY (`targetId`) REFERENCES `User` (`id`)
  ON DELETE CASCADE
  ON UPDATE CASCADE;

-- Verification queries (comment out for prod):
-- SELECT COUNT(*) AS audit_rows FROM `BroadcastLog`;
-- SHOW INDEX FROM `BroadcastLog`;
-- SHOW CREATE TABLE `BroadcastLog`\G
