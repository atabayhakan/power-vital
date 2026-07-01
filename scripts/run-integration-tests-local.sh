#!/usr/bin/env bash
# scripts/run-integration-tests-local.sh — cross-platform twin of the
# PowerShell version. Boots MySQL via Docker, pushes the Prisma schema,
# runs the full test suite, then tears the container down.
#
# Requirements: docker, bash 4+.
#
# Usage:
#   ./scripts/run-integration-tests-local.sh
#
# Env vars (optional):
#   MYSQL_VERSION=8.0   TEST_DB=powervital_test   TEST_USER=pvtest
#   TEST_PASSWORD=pvtestpw   ROOT_PASSWORD=testrootpw
#   KEEP_RUNNING=1      # leave the container after tests
set -euo pipefail

MYSQL_VERSION="${MYSQL_VERSION:-8.0}"
TEST_DB="${TEST_DB:-powervital_test}"
TEST_USER="${TEST_USER:-pvtest}"
TEST_PASSWORD="${TEST_PASSWORD:-pvtestpw}"
ROOT_PASSWORD="${ROOT_PASSWORD:-testrootpw}"
WAIT_SECONDS="${WAIT_SECONDS:-30}"
CONTAINER_NAME="pv-mysql-itest"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/../backend"

if [ ! -f "$BACKEND_DIR/package.json" ]; then
  echo "Cannot find backend/package.json. Run from project root." >&2
  exit 1
fi

cd "$BACKEND_DIR"

step() { printf '\n\033[36m=== %s ===\033[0m\n' "$1"; }

step "Checking Docker..."
docker --version

step "Starting MySQL container ($MYSQL_VERSION)..."
docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true
docker run -d \
  --name "$CONTAINER_NAME" \
  -e "MYSQL_ROOT_PASSWORD=$ROOT_PASSWORD" \
  -e "MYSQL_DATABASE=$TEST_DB" \
  -e "MYSQL_USER=$TEST_USER" \
  -e "MYSQL_PASSWORD=$TEST_PASSWORD" \
  -p 3307:3306 \
  --health-cmd "mysqladmin ping -h 127.0.0.1 -uroot -p$ROOT_PASSWORD" \
  --health-interval 3s \
  --health-timeout 5s \
  --health-retries "$WAIT_SECONDS" \
  "mysql:$MYSQL_VERSION" >/dev/null

step "Waiting for MySQL to accept connections..."
ready=false
for ((i=1; i<=WAIT_SECONDS; i++)); do
  status=$(docker inspect --format '{{.State.Health.Status}}' "$CONTAINER_NAME" 2>/dev/null || echo "starting")
  if [ "$status" = "healthy" ]; then
    ready=true
    break
  fi
  printf '  attempt %d/%d ... (%s)\n' "$i" "$WAIT_SECONDS" "$status"
  sleep 1
done
if [ "$ready" != "true" ]; then
  echo "MySQL did not become healthy in $WAIT_SECONDS seconds." >&2
  exit 1
fi
echo -e "\033[32mMySQL is up.\033[0m"

step "Pushing Prisma schema..."
export DATABASE_URL="mysql://${TEST_USER}:${TEST_PASSWORD}@127.0.0.1:3307/${TEST_DB}"
npx prisma db push --skip-generate --accept-data-loss >/dev/null

step "Running full test suite (unit + integration)..."
test_exit=0
npm test || test_exit=$?

if [ "${KEEP_RUNNING:-0}" != "1" ]; then
  step "Tearing down MySQL container..."
  docker rm -f "$CONTAINER_NAME" >/dev/null
else
  printf '\n\033[33mKEEP_RUNNING=1 — leaving %s on :3307\033[0m\n' "$CONTAINER_NAME"
fi

if [ "$test_exit" -ne 0 ]; then
  echo "Tests failed (exit $test_exit)." >&2
  exit "$test_exit"
fi
printf '\n\033[32m✓ All tests passed.\033[0m\n'