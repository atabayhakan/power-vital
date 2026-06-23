# Backup & Restore Runbook

## Overview

The `scripts/backup.js` script creates a daily `mysqldump` of the production
database, gzips it, and rotates old files. `scripts/restore-verify.js` proves
the latest dump can actually be restored and contains valid data.

## Prerequisites

Both scripts require on the host:

- `mysqldump` and `mysql` (MariaDB or MySQL client) in `$PATH`
- A MySQL user with `SELECT` + `LOCK TABLES` + `SHOW VIEW` + `EVENT` privileges
  on the target DB (the existing `DATABASE_URL` user already has these in
  most setups)
- Node 20+ (already required for the backend)
- `BACKUP_DIR` (optional) — where to write the dumps. Default: `./backups/`

## Environment

Add to `.env` (production server):

```env
# Override the URL the backup uses (defaults to DATABASE_URL).
# This lets the backup use a dedicated read-only user without changing
# the runtime connection.
BACKUP_DATABASE_URL="mysql://backup_user:secret@db.internal:3306/pv_production"
BACKUP_DIR="/var/backups/pv-mysql"

# Optional: S3 push (run with --upload)
# BACKUP_S3_BUCKET="pv-prod-backups"
# BACKUP_S3_PREFIX="mysql"
# AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY from IAM role or .env
```

## Rotation policy

The script keeps a tiered set of backups:

| Type    | When                    | Keep | Example filename                              |
|---------|-------------------------|------|-----------------------------------------------|
| daily   | every day               | 7    | `pv_production-daily-2024-01-15T03-00-00.sql.gz` |
| weekly  | every Sunday            | 4    | `pv_production-weekly-...sql.gz`                |
| monthly | 1st of each month       | 12   | `pv_production-monthly-...sql.gz`              |

So in total you keep at most 23 files (≈ < 5 GB if dumps are ~200 MB).

## Running manually

```bash
# Today's daily backup
node scripts/backup.js

# Force a weekly or monthly snapshot
node scripts/backup.js --type=weekly
node scripts/backup.js --type=monthly

# Daily + upload to S3
node scripts/backup.js --upload
```

## Schedule with cron (production)

Edit the crontab of a user that can write to `BACKUP_DIR` and run `mysql`:

```cron
# m h dom mon dow command
# 03:00 UTC every day: daily
0 3 * * *   cd /var/www/pv-backend && node scripts/backup.js            >> /var/log/pv-backup.log 2>&1
# 04:00 UTC every Sunday: weekly
0 4 * * 0   cd /var/www/pv-backend && node scripts/backup.js --type=weekly >> /var/log/pv-backup.log 2>&1
# 05:00 UTC on the 1st of each month: monthly (+ S3)
0 5 1 * *   cd /var/www/pv-backend && node scripts/backup.js --type=monthly --upload >> /var/log/pv-backup.log 2>&1

# Weekly: prove the latest daily backup can be restored (Sat 06:00 UTC)
0 6 * * 6   cd /var/www/pv-backend && node scripts/restore-verify.js   >> /var/log/pv-restore.log 2>&1
```

The restore-verify step catches "backups are running but produce un-restorable
files" the next time someone needs the data urgently.

## Restoring in an emergency

```bash
# 1. Download the dump you need (or pick the latest from BACKUP_DIR)
ls -lh $BACKUP_DIR/

# 2. Restore into a NEW database first (don't overwrite prod blindly)
mysql -h db.internal -u root -p -e "CREATE DATABASE pv_restore_test"
gunzip -c $BACKUP_DIR/pv_production-daily-2024-01-15.sql.gz \
  | mysql -h db.internal -u root -p pv_restore_test

# 3. Verify rows are present
mysql -h db.internal -u root -p pv_restore_test -e "
  SELECT COUNT(*) FROM User;
  SELECT COUNT(*) FROM Order;
  SELECT MAX(createdAt) FROM Order;"

# 4. If good, swap prod to the restored DB
#    (most teams do this with a CNAME or by pointing the app to the new DB
#    and dropping the old one after a smoke test)
```

## Restoring into the existing prod DB (overwrite)

**⚠️ This wipes the current prod data.** Only do this if you're sure the
backup is more accurate than what's currently in the DB.

```bash
# Stop the app first (so it doesn't open connections mid-restore)
pm2 stop pv-backend

# Drop + recreate the schema
mysql -h db.internal -u root -p -e "DROP DATABASE pv_production; CREATE DATABASE pv_production CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"

# Restore
gunzip -c $BACKUP_DIR/pv_production-daily-2024-01-15.sql.gz \
  | mysql -h db.internal -u root -p pv_production

# Re-run the FULLTEXT migration (mysqldump --skip-routines/stored-procs is
# fine but the ngram index is included in schema)
node prisma/scripts/add_fulltext_search.sql  # or rerun the .sql file

pm2 start pv-backend
```

## Monitoring

Watch the log file for failures:

```bash
tail -f /var/log/pv-backup.log
# Alert on:
#   FAILED: mysqldump exited ...
#   FAILED: S3 upload FAILED
#   FAILED: RESTORE VERIFY
```

A simple monitoring snippet (cron-friendly, exits non-zero on issues):

```bash
# In your alerting cron (e.g. 30 min after backup completes):
if ! tail -n 20 /var/log/pv-backup.log | grep -q "OK pv_production-daily-"; then
  curl -X POST https://alerts.example.com/webhook -d '{"text":"⚠️ PV daily backup FAILED"}'
fi
```

## What this script does NOT do

- **Doesn't backup uploads** (`/var/www/pv-backend/uploads/*`). Add a
  separate `rsync` or `rclone` job to S3 for those — they're usually much
  larger than the DB and don't need transactional consistency.
- **Doesn't replicate off-host.** Local + S3 is the recommended setup, but
  for true DR also consider streaming to a second region.
- **Doesn't encrypt at rest.** The .sql.gz files contain PII (user emails,
  addresses, phone numbers). The S3 bucket MUST have SSE enabled and a
  restrictive bucket policy.
