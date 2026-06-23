-- =============================================================================
-- Migration: Add RefreshToken table
-- =============================================================================
-- Stores the SHA-256 hash of every issued refresh token. A "family" groups
-- all tokens in a single login session so we can revoke the whole session
-- on token reuse (replay attack).
--
-- Run with:
--   npx prisma db push
-- (Prisma picks up the new RefreshToken model from schema.prisma automatically;
--  we keep this file for documentation and for ops that need raw SQL.)
-- =============================================================================

CREATE TABLE IF NOT EXISTS `RefreshToken` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `tokenHash` VARCHAR(191) NOT NULL,
  `family` VARCHAR(191) NOT NULL,
  `replacedBy` VARCHAR(191) NULL,
  `revokedAt` DATETIME(3) NULL,
  `issuedToIp` VARCHAR(191) NULL,
  `userAgent` TEXT NULL,
  `expiresAt` DATETIME(3) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `RefreshToken_tokenHash_key` (`tokenHash`),
  INDEX `RefreshToken_userId_idx` (`userId`),
  INDEX `RefreshToken_family_idx` (`family`),
  INDEX `RefreshToken_expiresAt_idx` (`expiresAt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Optional cleanup job (run from cron, NOT on every request):
-- DELETE FROM `RefreshToken` WHERE `expiresAt` < NOW() - INTERVAL 30 DAY;
-- This keeps the table small. The 30-day grace lets us audit expired tokens
-- in case a user disputes a charge.
