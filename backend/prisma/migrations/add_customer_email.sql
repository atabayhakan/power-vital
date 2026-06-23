-- Adds an optional customerEmail column to the Order table so
-- guest-checkout shoppers can leave an email and get shipping /
-- order-status notifications even when they have no account.
--
-- Idempotent: uses information_schema to skip the ALTER if the column
-- already exists, so this script is safe to re-run on environments
-- where it was applied manually.
--
-- Run with:
--   npx prisma db execute --schema=prisma/schema.prisma --file=prisma/migrations/add_customer_email.sql
-- Or apply manually:
--   mysql -u <user> -p <db> < prisma/migrations/add_customer_email.sql
--
-- Rollback (run manually):
--   ALTER TABLE `Order` DROP COLUMN `customerEmail`;

SET @column_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'Order'
    AND COLUMN_NAME = 'customerEmail'
);

SET @sql := IF(@column_exists = 0,
  'ALTER TABLE `Order` ADD COLUMN `customerEmail` VARCHAR(200) NULL AFTER `customerPhone`',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
