-- =============================================================================
-- Migration: Add BroadcastJob table for scheduled push broadcasts
-- =============================================================================
-- Stores future-dated broadcast jobs. The scheduler (cron / setInterval)
-- ticks every 60s, picks rows where status='pending' AND scheduledAt<=now,
-- dispatches them via the same path as POST /push/broadcast, and flips
-- the row's status to 'dispatched' (with resultParentBroadcastId set
-- so the history view can group the resulting BroadcastLog rows).
--
-- Status state machine:
--   pending    → dispatched  (scheduler ran successfully)
--   pending    → cancelled   (admin cancelled before dispatch)
--   pending    → failed      (dispatch threw — every target errored)
--
-- Indexes:
--   (status, scheduledAt) — scheduler tick WHERE pending AND due
--   (actorId, createdAt)   — admin history "what did I schedule?"
--
-- Run with:
--   npx prisma db execute --schema=prisma/schema.prisma --file=prisma/migrations/add_broadcast_jobs.sql
--
-- Safe to re-run: drops the table if it exists, then recreates it.
-- ⚠️  Re-running DESTROYS scheduled jobs that haven't fired yet.
--     Do NOT run on production unless you intend to wipe them.
--
-- Rollback (run manually):
--   DROP TABLE IF EXISTS `BroadcastJob`;
-- =============================================================================

-- Drop the existing table if it exists (idempotent re-runs in dev)
SET @table_exists := (
  SELECT COUNT(*)
  FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'BroadcastJob'
);
SET @sql := IF(@table_exists > 0,
  'DROP TABLE `BroadcastJob`',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE `BroadcastJob` (
  `id`                       VARCHAR(191) NOT NULL,
  `actorId`                  VARCHAR(191) NULL,
  `note`                     TEXT         NULL,
  `status`                   VARCHAR(32)  NOT NULL DEFAULT 'pending',
  `targetMode`               VARCHAR(16)  NOT NULL,            -- 'single' | 'multi' | 'segment'
  `targetIds`                TEXT         NULL,                -- JSON array
  `segmentRole`              VARCHAR(32)  NULL,                -- 'customer' | etc.
  `title`                    VARCHAR(120) NOT NULL,
  `body`                     TEXT         NOT NULL,
  `url`                      VARCHAR(512) NOT NULL DEFAULT '/',
  `eventKey`                 VARCHAR(64)  NOT NULL DEFAULT 'custom',
  `tag`                      VARCHAR(64)  NULL,
  `scheduledAt`              DATETIME(3)  NOT NULL,
  `dispatchedAt`             DATETIME(3)  NULL,
  `cancelledAt`              DATETIME(3)  NULL,
  `resultParentBroadcastId`  VARCHAR(64)  NULL,
  `createdAt`                DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`                DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `BroadcastJob_status_scheduledAt_idx` (`status`, `scheduledAt`),
  KEY `BroadcastJob_actorId_createdAt_idx` (`actorId`, `createdAt`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Foreign key to User (SET NULL on admin delete so audit trail survives).
ALTER TABLE `BroadcastJob`
  ADD CONSTRAINT `BroadcastJob_actorId_fkey`
  FOREIGN KEY (`actorId`) REFERENCES `User` (`id`)
  ON DELETE SET NULL
  ON UPDATE CASCADE;

-- Verification queries (comment out for prod):
-- SELECT COUNT(*) AS jobs_total FROM `BroadcastJob`;
-- SHOW INDEX FROM `BroadcastJob`;
-- SELECT * FROM `BroadcastJob` WHERE status='pending' AND scheduledAt <= NOW();
