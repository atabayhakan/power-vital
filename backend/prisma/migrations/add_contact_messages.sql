-- Creates the ContactMessage table that powers the admin support inbox.
-- One row per message from the public contact form (source='contact',
-- guests allowed) or the logged-in support form (source='support').
-- Admins triage via status: new → read → resolved, with an optional
-- adminNote for internal context.
--
-- Idempotent: uses CREATE TABLE IF NOT EXISTS so re-running is safe.
--
-- Run with:
--   npx prisma db execute --schema=prisma/schema.prisma --file=prisma/migrations/add_contact_messages.sql
-- Or apply manually:
--   mysql -u <user> -p <db> < prisma/migrations/add_contact_messages.sql
--
-- Rollback (run manually):
--   DROP TABLE IF EXISTS `ContactMessage`;

CREATE TABLE IF NOT EXISTS `ContactMessage` (
  `id`         VARCHAR(191) NOT NULL,
  `userId`     VARCHAR(191) NULL,

  `name`       VARCHAR(191) NULL,
  `email`      VARCHAR(191) NULL,
  `phone`      VARCHAR(191) NULL,
  `subject`    VARCHAR(191) NULL,
  `message`    TEXT         NOT NULL,
  `source`     VARCHAR(32)  NOT NULL DEFAULT 'contact',
  `locale`     VARCHAR(16)  NULL,
  `status`     VARCHAR(32)  NOT NULL DEFAULT 'new',
  `adminNote`  TEXT         NULL,

  `createdAt`  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  KEY `ContactMessage_status_idx` (`status`),
  KEY `ContactMessage_userId_idx` (`userId`),
  KEY `ContactMessage_createdAt_idx` (`createdAt`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- FK to User with SET NULL so a deleted user doesn't take their messages
-- with them (we keep the message + the submitted name/email for the record).
SET @fk_exists := (
  SELECT COUNT(*)
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'ContactMessage'
    AND CONSTRAINT_NAME = 'ContactMessage_userId_fkey'
);

SET @sql := IF(@fk_exists = 0,
  'ALTER TABLE `ContactMessage`
     ADD CONSTRAINT `ContactMessage_userId_fkey`
     FOREIGN KEY (`userId`) REFERENCES `User` (`id`)
     ON DELETE SET NULL
     ON UPDATE CASCADE',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
