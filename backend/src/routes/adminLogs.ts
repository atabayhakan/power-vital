// GET /api/v1/admin/logs — tail the structured log file.
//
// Admin-only. Reads the most recent N lines from the file pointed to
// by LOG_FILE (written by pino). Filters: since (timestamp ms), level
// (debug/info/warn/error/fatal), q (substring search across msg + all
// string-ified values).
//
// This endpoint exists to give operators a fast in-app tail without
// SSHing to the server. It's not a replacement for centralised log
// aggregation (Loki / Datadog) — for that, install a log shipper
// alongside the file.
import { Router, Request, Response } from 'express';
import { promises as fs } from 'fs';
import { authenticateJWT, requireRole } from '../middleware/auth';
import { logger, LOG_FILE_PATH } from '../utils/logger';

const router = Router();

interface ParsedLog {
  ts: number;        // unix ms (or 0 if unparseable)
  level: string;
  msg: string;
  raw: string;       // original line (for re-display)
  [key: string]: unknown; // any other pino field is flattened at top level
}

const LEVEL_RANK: Record<string, number> = {
  trace: 10, debug: 20, info: 30, warn: 40, error: 50, fatal: 60
};

/**
 * Read the last `maxBytes` of the log file, split on newlines, return
 * each line. Skips the last (partial) line so we never return a
 * half-written entry.
 */
const tailLines = async (path: string, maxBytes: number): Promise<string[]> => {
  let stat;
  try { stat = await fs.stat(path); } catch { return []; }
  const start = Math.max(0, stat.size - maxBytes);
  const fd = await fs.open(path, 'r');
  try {
    const length = stat.size - start;
    const buf = Buffer.alloc(length);
    await fd.read(buf, 0, length, start);
    return buf.toString('utf8').split('\n').filter(Boolean);
  } finally {
    await fd.close();
  }
};

const parseLine = (line: string): ParsedLog | null => {
  try {
    const obj = JSON.parse(line);
    const out: any = {
      ts: typeof obj.time === 'number' ? obj.time : 0,
      level: String(obj.level || 'info'),
      msg: String(obj.msg || ''),
      raw: line
    };
    // Flatten all other pino fields at the top level so consumers can
    // see them without digging into .obj. Common fields: err, requestId,
    // userId, route, status, etc.
    for (const [k, v] of Object.entries(obj)) {
      if (k === 'time' || k === 'level' || k === 'msg') continue;
      out[k] = v;
    }
    return out as ParsedLog;
  } catch {
    return null;
  }
};

router.get('/', authenticateJWT, requireRole('admin'), async (req: Request, res: Response) => {
  if (!LOG_FILE_PATH) {
    return res.status(503).json({
      error: 'Log file not configured. Set LOG_FILE=/var/log/pv-backend.log in .env and restart.'
    });
  }

  // Query params
  const limit = Math.min(Number(req.query.limit) || 200, 1000);
  const maxBytes = Math.min(Number(req.query.maxBytes) || 256 * 1024, 4 * 1024 * 1024); // up to 4MB
  const since = Number(req.query.since) || 0; // ms epoch filter
  const minLevel = String(req.query.level || '').toLowerCase();
  const minRank = LEVEL_RANK[minLevel] || 0;
  const q = String(req.query.q || '').toLowerCase().trim();

  try {
    const lines = await tailLines(LOG_FILE_PATH, maxBytes);
    // Iterate in reverse so we collect the most recent matching lines first
    const matched: ParsedLog[] = [];
    for (let i = lines.length - 1; i >= 0 && matched.length < limit; i--) {
      const parsed = parseLine(lines[i]);
      if (!parsed) continue;
      if (since && parsed.ts && parsed.ts < since) continue;
      if (minRank && (LEVEL_RANK[parsed.level] ?? 0) < minRank) continue;
      if (q && !lines[i].toLowerCase().includes(q)) continue;
      matched.push(parsed);
    }
    // Returned in chronological order (oldest first)
    res.json({
      logFile: LOG_FILE_PATH,
      totalRead: lines.length,
      returned: matched.length,
      logs: matched.reverse()
    });
  } catch (err: any) {
    logger.error({ err: err?.message }, 'admin logs read failed');
    res.status(500).json({ error: 'Failed to read log file' });
  }
});

export default router;
