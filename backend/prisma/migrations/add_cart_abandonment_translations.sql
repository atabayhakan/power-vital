-- Add translations JSON to CartAbandonment for per-locale email subject/body overrides.
-- Mirrors Product.translations shape: { kg: { subject, headline, body, cta }, ru: {...} }
ALTER TABLE CartAbandonment
  ADD COLUMN translations TEXT NULL AFTER expiresAt;
ALTER TABLE CartAbandonment
  MODIFY COLUMN updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);
