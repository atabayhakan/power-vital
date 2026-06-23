-- =============================================================================
-- Migration: Add ImpersonationSession table for admin user impersonation
-- =============================================================================
-- Records every time an admin uses POST /api/v1/admin/impersonate/:userId.
-- Sessions expire after 60 minutes (set via service layer, expiresAt column).
-- Both admin and target FKs cascade-delete so cleanup happens automatically.
--
-- Indexes:
--   (adminId, startedAt)  — "what sessions did admin X start?"
--   (targetId, startedAt) — "who impersonated user Y?"
--
-- Safe to re-run: drops the table if it exists, then recreates it.
-- ⚠️  Re-running DESTROYS audit records of impersonation activity.
-- =============================================================================

SET @table_exists := (
  SELECT COUNT(*)
  FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'ImpersonationSession'
);
SET @sql := IF(@table_exists > 0,
  'DROP TABLE `ImpersonationSession`',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE `ImpersonationSession` (
  `id`           VARCHAR(191) NOT NULL,
  `adminId`      VARCHAR(191) NOT NULL,
  `targetId`     VARCHAR(191) NOT NULL,
  `reason`       TEXT         NULL,
  `ipAddress`    VARCHAR(64)  NULL,
  `userAgent`    TEXT         NULL,
  `startedAt`    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `expiresAt`    DATETIME(3)  NOT NULL,
  `endedAt`      DATETIME(3)  NULL,
  `endedByAdmin` TINYINT(1)   NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `ImpersonationSession_adminId_startedAt_idx` (`adminId`, `startedAt`),
  KEY `ImpersonationSession_targetId_startedAt_idx` (`targetId`, `startedAt`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

ALTER TABLE `ImpersonationSession`
  ADD CONSTRAINT `ImpersonationSession_adminId_fkey`
  FOREIGN KEY (`adminId`) REFERENCES `User` (`id`)
  ON DELETE CASCADE
  ON UPDATE CASCADE;

ALTER TABLE `ImpersonationSession`
  ADD CONSTRAINT `ImpersonationSession_targetId_fkey`
  FOREIGN KEY (`targetId`) REFERENCES `User` (`id`)
  ON DELETE CASCADE
  ON UPDATE CASCADE;

-- Verification queries (comment out for prod):
-- SELECT COUNT(*) AS sessions_total FROM `ImpersonationSession`;
