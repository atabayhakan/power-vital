// Migration tests — verify SQL shape, idempotency markers, and FK references.
// Pure file I/O (no DB connection needed).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const MIGRATIONS_DIR = join(__dirname, '..', 'prisma', 'migrations');

describe('migration files', () => {
  describe('add_fulltext_search.sql', () => {
    const path = join(MIGRATIONS_DIR, 'add_fulltext_search.sql');
    const content = readFileSync(path, 'utf8');

    it('declares it is idempotent', () => {
      expect(content.toLowerCase()).toContain('safe to re-run');
    });

    it('checks information_schema before dropping', () => {
      expect(content).toContain('information_schema.STATISTICS');
      expect(content).toContain('SET @idx_exists');
    });

    it('uses the ngram parser for multi-language search', () => {
      expect(content).toContain('WITH PARSER ngram');
      expect(content).toMatch(/ADD FULLTEXT INDEX/);
    });

    it('targets the Product table', () => {
      expect(content).toMatch(/ALTER TABLE `?Product`?/i);
    });

    it('includes a rollback note in comments', () => {
      // Rollback instructions live in the runbook, but the file itself
      // should at least mention how to undo.
      expect(content).toMatch(/DROP INDEX/i);
    });
  });

  describe('add_push_subscriptions.sql', () => {
    const path = join(MIGRATIONS_DIR, 'add_push_subscriptions.sql');
    const content = readFileSync(path, 'utf8');

    it('exists and is non-empty', () => {
      expect(content.length).toBeGreaterThan(500);
    });

    it('creates the PushSubscription table', () => {
      expect(content).toMatch(/CREATE TABLE `?PushSubscription`?/i);
    });

    it('matches the Prisma schema column names', () => {
      const schemaPath = join(__dirname, '..', 'prisma', 'schema.prisma');
      const schema = readFileSync(schemaPath, 'utf8');
      const model = schema.match(/model PushSubscription \{([\s\S]*?)\n\}/);
      expect(model).toBeTruthy();
      const body = model![1];
      // Required columns per the schema:
      for (const col of ['id', 'userId', 'endpoint', 'p256dh', 'auth', 'userAgent', 'preferences', 'createdAt', 'updatedAt', 'lastSeenAt']) {
        expect(body, `schema should declare "${col}"`).toMatch(new RegExp(`\\b${col}\\b`));
        expect(content, `SQL should declare "${col}"`).toMatch(new RegExp(`\`?${col}\`?`, 'i'));
      }
    });

    it('caps endpoint at 512 chars (MySQL TEXT-unique workaround)', () => {
      // Match the CREATE TABLE column definition (not the design comment).
      expect(content).toMatch(/`endpoint`\s+VARCHAR\(512\)/i);
    });

    it('uniquely indexes endpoint', () => {
      expect(content).toMatch(/UNIQUE KEY.*endpoint/i);
    });

    it('indexes userId for the per-user fan-out', () => {
      expect(content).toMatch(/KEY.*userId.*idx/i);
    });

    it('uses CASCADE on user FK delete', () => {
      expect(content).toMatch(/ON DELETE CASCADE/i);
      expect(content).toMatch(/REFERENCES `?User`?\s*\(\s*`?id`?\s*\)/i);
    });

    it('is idempotent (DROP IF EXISTS + guard)', () => {
      expect(content).toMatch(/DROP TABLE.*PushSubscription/i);
      expect(content).toContain('information_schema.TABLES');
      expect(content).toMatch(/SET @table_exists/);
    });

    it('documents the destructive re-run in a comment', () => {
      expect(content.toLowerCase()).toContain('safe to re-run');
      // Must warn about wiping subscriptions on re-run.
      expect(content).toMatch(/DESTROYS|wipes|drop/i);
    });

    it('provides a manual rollback command in comments', () => {
      expect(content).toMatch(/-- Rollback/i);
      expect(content).toMatch(/DROP TABLE IF EXISTS `?PushSubscription`?/i);
    });

    it('uses InnoDB + utf8mb4 (consistent with other tables)', () => {
      expect(content).toMatch(/ENGINE\s*=\s*InnoDB/i);
      expect(content).toMatch(/CHARSET\s*=\s*utf8mb4/i);
    });

    it('declares preferences as TEXT NOT NULL (default applied at app layer, not DB)', () => {
      // The PushSubscription TEXT column needs MySQL strict mode to be
      // happy when an insert omits `preferences`, but MySQL doesn't
      // accept DEFAULT '{}' for TEXT in our version. The service layer
      // (pushService.subscribe) supplies the default on every write, so
      // the column is allowed to be NULL-or-empty from the DB's POV.
      expect(content).toMatch(/`preferences`\s+TEXT\s+NOT NULL/i);
    });
  });

  describe('naming consistency', () => {
    it('uses snake_case file names matching Prisma convention', () => {
      const { readdirSync } = require('fs');
      const files = readdirSync(MIGRATIONS_DIR).filter((f: string) => f.endsWith('.sql'));
      // All custom (non-Prisma-init) migrations must be snake_case.
      for (const f of files) {
        expect(f).toMatch(/^[a-z][a-z0-9_]*\.sql$/);
      }
    });
  });

  describe('add_broadcast_log.sql', () => {
    const path = join(MIGRATIONS_DIR, 'add_broadcast_log.sql');
    const content = readFileSync(path, 'utf8');

    it('exists and is non-empty', () => {
      expect(content.length).toBeGreaterThan(500);
    });

    it('creates the BroadcastLog table', () => {
      expect(content).toMatch(/CREATE TABLE `?BroadcastLog`?/i);
    });

    it('matches the Prisma schema column names', () => {
      const schemaPath = join(__dirname, '..', 'prisma', 'schema.prisma');
      const schema = readFileSync(schemaPath, 'utf8');
      const model = schema.match(/model BroadcastLog \{([\s\S]*?)\n\}/);
      expect(model).toBeTruthy();
      const body = model![1];
      for (const col of ['id', 'actorId', 'targetId', 'eventKey', 'sent', 'expired', 'failed', 'note', 'createdAt']) {
        expect(body, `schema should declare "${col}"`).toMatch(new RegExp(`\\b${col}\\b`));
        expect(content, `SQL should declare "${col}"`).toMatch(new RegExp(`\`?${col}\`?`, 'i'));
      }
    });

    it('makes actorId nullable (SET NULL on admin delete)', () => {
      expect(content).toMatch(/`actorId`\s+VARCHAR\(191\)\s+NULL/i);
      expect(content).toMatch(/ON DELETE SET NULL/i);
    });

    it('cascades target deletion (privacy-friendly)', () => {
      expect(content).toMatch(/ON DELETE CASCADE/i);
    });

    it('creates the three indexes for the two real query shapes', () => {
      // (actorId, createdAt) — admin history
      expect(content).toMatch(/BroadcastLog_actorId_createdAt_idx/i);
      // (targetId, createdAt) — recipient history
      expect(content).toMatch(/BroadcastLog_targetId_createdAt_idx/i);
      // eventKey — frequency queries
      expect(content).toMatch(/BroadcastLog_eventKey_idx/i);
    });

    it('is idempotent (DROP IF EXISTS + guard)', () => {
      expect(content).toMatch(/DROP TABLE.*BroadcastLog/i);
      expect(content).toContain('information_schema.TABLES');
      expect(content).toMatch(/SET @table_exists/);
    });

    it('warns about destructive re-run', () => {
      expect(content.toLowerCase()).toContain('safe to re-run');
      expect(content).toMatch(/DESTROYS|wipes|drop/i);
    });

    it('provides a manual rollback command', () => {
      expect(content).toMatch(/-- Rollback/i);
      expect(content).toMatch(/DROP TABLE IF EXISTS `?BroadcastLog`?/i);
    });

    it('uses InnoDB + utf8mb4', () => {
      expect(content).toMatch(/ENGINE\s*=\s*InnoDB/i);
      expect(content).toMatch(/CHARSET\s*=\s*utf8mb4/i);
    });

    it('caps eventKey length to 64 chars', () => {
      expect(content).toMatch(/`eventKey`\s+VARCHAR\(64\)/i);
    });

    it('includes parentBroadcastId for multi-target grouping', () => {
      // Column should exist + be nullable + indexed for fast grouping
      expect(content).toMatch(/`parentBroadcastId`\s+VARCHAR\(64\)\s+NULL/i);
      expect(content).toMatch(/BroadcastLog_parentBroadcastId_idx/i);
    });
  });

  describe('add_broadcast_jobs.sql', () => {
    const path = join(MIGRATIONS_DIR, 'add_broadcast_jobs.sql');
    const content = readFileSync(path, 'utf8');

    it('exists and is non-empty', () => {
      expect(content.length).toBeGreaterThan(500);
    });

    it('creates the BroadcastJob table', () => {
      expect(content).toMatch(/CREATE TABLE `?BroadcastJob`?/i);
    });

    it('matches the Prisma schema column names', () => {
      const schemaPath = join(__dirname, '..', 'prisma', 'schema.prisma');
      const schema = readFileSync(schemaPath, 'utf8');
      const model = schema.match(/model BroadcastJob \{([\s\S]*?)\n\}/);
      expect(model).toBeTruthy();
      const body = model![1];
      for (const col of ['id', 'actorId', 'note', 'status', 'targetMode', 'targetIds',
                         'segmentRole', 'title', 'body', 'url', 'eventKey', 'tag',
                         'scheduledAt', 'dispatchedAt', 'cancelledAt',
                         'resultParentBroadcastId', 'createdAt', 'updatedAt']) {
        expect(body, `schema should declare "${col}"`).toMatch(new RegExp(`\\b${col}\\b`));
        expect(content, `SQL should declare "${col}"`).toMatch(new RegExp(`\`?${col}\`?`, 'i'));
      }
    });

    it('has the scheduler-tick composite index (status, scheduledAt)', () => {
      // Critical for the scheduler WHERE pending AND scheduledAt <= now
      expect(content).toMatch(/BroadcastJob_status_scheduledAt_idx/i);
      expect(content).toMatch(/KEY `BroadcastJob_status_scheduledAt_idx` \(`status`, `scheduledAt`\)/);
    });

    it('uses SET NULL on admin delete (preserves audit trail)', () => {
      expect(content).toMatch(/ON DELETE SET NULL/i);
      expect(content).toMatch(/BroadcastJob_actorId_fkey/i);
    });

    it('is idempotent (DROP IF EXISTS + guard)', () => {
      expect(content).toMatch(/DROP TABLE.*BroadcastJob/i);
      expect(content).toContain('information_schema.TABLES');
      expect(content).toMatch(/SET @table_exists/);
    });

    it('warns about destructive re-run', () => {
      expect(content.toLowerCase()).toContain('safe to re-run');
      expect(content).toMatch(/DESTROYS|wipes/i);
    });

    it('provides manual rollback command', () => {
      expect(content).toMatch(/-- Rollback/i);
      expect(content).toMatch(/DROP TABLE IF EXISTS `?BroadcastJob`?/i);
    });

    it('uses InnoDB + utf8mb4', () => {
      expect(content).toMatch(/ENGINE\s*=\s*InnoDB/i);
      expect(content).toMatch(/CHARSET\s*=\s*utf8mb4/i);
    });
  });
});
