-- =============================================================================
-- Migration: Add FULLTEXT search index on Product (name, description, barcode)
-- =============================================================================
-- Adds a MySQL FULLTEXT index using the ngram parser for multi-language
-- substring matching (TR, RU, KG all benefit since ngram is byte-level).
--
-- Run with:
--   npx prisma db execute --schema=prisma/schema.prisma --file=prisma/migrations/add_fulltext_search.sql
-- Or apply manually:
--   mysql -u <user> -p <db> < prisma/migrations/add_fulltext_search.sql
--
-- Safe to re-run: drops the index if it already exists, then recreates it.
-- =============================================================================

-- Drop the existing FULLTEXT index if it exists (idempotent re-runs)
SET @idx_exists := (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'Product'
    AND INDEX_NAME = 'product_fulltext_idx'
);
SET @sql := IF(@idx_exists > 0,
  'ALTER TABLE `Product` DROP INDEX `product_fulltext_idx`',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Create the FULLTEXT index with the ngram parser.
--   • ngram_token_size = 2 (MySQL default — works for TR/RU/KG/EN)
--     For very short queries (1 char) we fall back to LIKE in the service.
--   • We index name, description, and barcode so admin POS lookup also benefits.
ALTER TABLE `Product`
  ADD FULLTEXT INDEX `product_fulltext_idx` (`name`, `description`, `barcode`)
  WITH PARSER ngram;

-- Optional: also add a generated column for the translated-name search.
-- This lets users find products by their RU/KG name (which lives in
-- `translations` JSON) without us denormalising into a new column at write
-- time. MySQL 8 supports JSON_VALUE inside generated columns, so we keep
-- one searchable string per locale.
--
-- We do NOT add this in the initial migration because:
--   1. The TranslationCenter already updates translations on save
--   2. The search service can read the JSON on demand and do client-side
--      post-filtering; an index-only approach can come later if needed.
