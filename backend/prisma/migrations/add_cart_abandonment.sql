-- Creates the CartAbandonment table that powers the cart-recovery
-- push workflow. The table holds one row per "active cart" — when
-- the cart mutates we UPSERT and bump lastActivityAt; the sweeper
-- picks up rows where status='pending' AND
-- lastActivityAt < now() - 1 hour and dispatches a push.
--
-- Idempotent: uses CREATE TABLE IF NOT EXISTS so re-running is safe.
--
-- Run with:
--   npx prisma db execute --schema=prisma/schema.prisma --file=prisma/migrations/add_cart_abandonment.sql
-- Or apply manually:
--   mysql -u <user> -p <db> < prisma/migrations/add_cart_abandonment.sql
--
-- Rollback (run manually):
--   DROP TABLE IF EXISTS `CartAbandonment`;

CREATE TABLE IF NOT EXISTS `CartAbandonment` (
  `id`                VARCHAR(191) NOT NULL,
  `userId`            VARCHAR(191) NULL,
  `guestId`           VARCHAR(191) NULL,

  `lastProductId`     VARCHAR(191) NULL,
  `lastProductName`   VARCHAR(500) NULL,
  `lastProductImg`    VARCHAR(500) NULL,

  `cartItems`         TEXT         NOT NULL,
  `cartTotalUsd`      DOUBLE       NOT NULL,
  `cartTotalKgs`      DOUBLE       NOT NULL,

  `status`            VARCHAR(32)  NOT NULL DEFAULT 'pending',

  `lastActivityAt`    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `notifiedAt`        DATETIME(3)  NULL,
  `convertedAt`       DATETIME(3)  NULL,
  `expiresAt`         DATETIME(3)  NULL,

  `createdAt`         DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`         DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  KEY `CartAbandonment_userId_status_idx` (`userId`, `status`),
  KEY `CartAbandonment_status_lastActivityAt_idx` (`status`, `lastActivityAt`),
  KEY `CartAbandonment_guestId_idx` (`guestId`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- FK to User with SET NULL so a deleted user doesn't take their
-- abandonment rows with them (we just lose the user link, keep
-- the data for analytics).
SET @fk_exists := (
  SELECT COUNT(*)
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'CartAbandonment'
    AND CONSTRAINT_NAME = 'CartAbandonment_userId_fkey'
);

SET @sql := IF(@fk_exists = 0,
  'ALTER TABLE `CartAbandonment`
     ADD CONSTRAINT `CartAbandonment_userId_fkey`
     FOREIGN KEY (`userId`) REFERENCES `User` (`id`)
     ON DELETE SET NULL
     ON UPDATE CASCADE',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
