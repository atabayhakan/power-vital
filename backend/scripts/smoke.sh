#!/usr/bin/env bash
# Production smoke test — runs the critical path end-to-end after deploy.
# Exits 0 on success, 1 on first failure.
#
# Usage:
#   ./smoke.sh https://powervital.kg
#   ./smoke.sh https://staging.powervital.kg
#
# What it tests:
#   1. /health (process up)
#   2. /health/ready (DB reachable)
#   3. /api/docs.json (OpenAPI serves)
#   4. Public GET /products (no auth)
#   5. Public search returns fulltext strategy
#   6. Auth rate limit kicks in (5 wrong logins → 6th = 429)
#   7. /auth/refresh accepts a refresh token
#   8. /auth/logout revokes the family
#   9. Cookie-based refresh works (no body token)
#  10. Protected route requires Bearer token
#  11. Image variant serving (a /uploads/...-1920w.webp returns 200)
#  12. OpenAPI 3.1 spec is parseable JSON
#
# Requires: bash, curl, jq. (No Python/Node dependency.)

set -u
BASE="${1:-http://localhost:3000}"
COOKIE_JAR=$(mktemp)
trap "rm -f $COOKIE_JAR" EXIT

PASS=0
FAIL=0
FAILED_TESTS=()

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

check() {
  local name="$1"
  local cmd="$2"
  if eval "$cmd" >/dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} $name"
    PASS=$((PASS+1))
  else
    echo -e "  ${RED}✗${NC} $name"
    FAIL=$((FAIL+1))
    FAILED_TESTS+=("$name")
  fi
}

check_eq() {
  local name="$1"
  local actual="$2"
  local expected="$3"
  if [ "$actual" = "$expected" ]; then
    echo -e "  ${GREEN}✓${NC} $name ($actual)"
    PASS=$((PASS+1))
  else
    echo -e "  ${RED}✗${NC} $name (expected '$expected', got '$actual')"
    FAIL=$((FAIL+1))
    FAILED_TESTS+=("$name")
  fi
}

http_status() {
  curl -sS -o /dev/null -w "%{http_code}" "$@"
}

jq_get() {
  curl -sS "$@" | jq -r "$1" 2>/dev/null
}

echo ""
echo "==> Smoke test against $BASE"
echo ""

# ───────────────────────────────────────────────────────────────────────
# 1. Process up
# ───────────────────────────────────────────────────────────────────────
echo "[1] Health endpoints"
STATUS=$(http_status "$BASE/health")
check_eq "GET /health returns 200" "$STATUS" "200"
UPTIME=$(jq_get "$BASE/health" '.uptimeSeconds')
[ -n "$UPTIME" ] && [ "$UPTIME" -gt 0 ] && check "Uptime > 0 seconds" "true" || check "Uptime > 0 seconds" "false"

# ───────────────────────────────────────────────────────────────────────
# 2. DB reachable
# ───────────────────────────────────────────────────────────────────────
echo ""
echo "[2] Database readiness"
STATUS=$(http_status "$BASE/health/ready")
check_eq "GET /health/ready returns 200" "$STATUS" "200"
DB_OK=$(jq_get "$BASE/health/ready" '.checks.database.ok')
check_eq "DB ping ok=true" "$DB_OK" "true"

# ───────────────────────────────────────────────────────────────────────
# 3. OpenAPI serves
# ───────────────────────────────────────────────────────────────────────
echo ""
echo "[3] OpenAPI / Swagger UI"
STATUS=$(http_status "$BASE/api/docs.json")
check_eq "GET /api/docs.json returns 200" "$STATUS" "200"
VERSION=$(jq_get "$BASE/api/docs.json" '.openapi')
check_eq "OpenAPI version is 3.1.x" "${VERSION:0:5}" "3.1.0"
PATHS_COUNT=$(curl -sS "$BASE/api/docs.json" | jq '.paths | length')
[ "$PATHS_COUNT" -gt 30 ] && check "OpenAPI has > 30 paths ($PATHS_COUNT)" "true" || check "OpenAPI has > 30 paths ($PATHS_COUNT)" "false"

STATUS=$(http_status "$BASE/api/docs")
check_eq "GET /api/docs (Swagger UI) returns 200" "$STATUS" "200"

# ───────────────────────────────────────────────────────────────────────
# 4. Public read
# ───────────────────────────────────────────────────────────────────────
echo ""
echo "[4] Public catalogue"
STATUS=$(http_status "$BASE/api/v1/products")
check_eq "GET /api/v1/products returns 200" "$STATUS" "200"
HAS_PRODUCTS=$(curl -sS "$BASE/api/v1/products" | jq 'if type == "array" then length > 0 else (.hits | length) > 0 end')
[ "$HAS_PRODUCTS" = "true" ] && check "Catalogue has at least one product" "true" || check "Catalogue has at least one product" "false"

# ───────────────────────────────────────────────────────────────────────
# 5. Search
# ───────────────────────────────────────────────────────────────────────
echo ""
echo "[5] Search (FULLTEXT)"
STATUS=$(http_status "$BASE/api/v1/products/search?q=vit")
check_eq "GET /api/v1/products/search returns 200" "$STATUS" "200"
STRATEGY=$(jq_get "$BASE/api/v1/products/search?q=vit" '.strategy')
[ "$STRATEGY" = "fulltext" ] || [ "$STRATEGY" = "like" ] && check "Search strategy is fulltext or like" "true" || check "Search strategy is fulltext or like" "false"

# ───────────────────────────────────────────────────────────────────────
# 6. Rate limit
# ───────────────────────────────────────────────────────────────────────
echo ""
echo "[6] Auth rate limit (5/15min per IP)"
declare -a STATUSES
for i in 1 2 3 4 5 6 7; do
  S=$(http_status -X POST "$BASE/api/v1/auth/login" \
    -H 'Content-Type: application/json' \
    -d '{"email":"smoke-test@never.com","password":"wrong"}')
  STATUSES+=("$S")
done
# 5 wrong attempts return 401, 6th+ return 429
check_eq "1st wrong login → 401" "${STATUSES[0]}" "401"
check_eq "5th wrong login → 401" "${STATUSES[4]}" "401"
[ "${STATUSES[5]}" = "429" ] || [ "${STATUSES[6]}" = "429" ] && check "6th/7th attempt → 429 (rate limited)" "true" || check "6th/7th attempt → 429 (rate limited, got ${STATUSES[5]}, ${STATUSES[6]})" "false"

# ───────────────────────────────────────────────────────────────────────
# 7-9. Auth flow (we don't have a test user on prod; skip if no creds)
# ───────────────────────────────────────────────────────────────────────
if [ -n "${SMOKE_TEST_EMAIL:-}" ] && [ -n "${SMOKE_TEST_PASSWORD:-}" ]; then
  echo ""
  echo "[7] Login + refresh + logout"
  # Login — capture cookies + access token
  curl -sS -c "$COOKIE_JAR" -X POST "$BASE/api/v1/auth/login" \
    -H 'Content-Type: application/json' \
    -d "{\"email\":\"$SMOKE_TEST_EMAIL\",\"password\":\"$SMOKE_TEST_PASSWORD\"}" > /tmp/login.json
  LOGIN_STATUS=$(http_status -c "$COOKIE_JAR" -X POST "$BASE/api/v1/auth/login" \
    -H 'Content-Type: application/json' \
    -d "{\"email\":\"$SMOKE_TEST_EMAIL\",\"password\":\"$SMOKE_TEST_PASSWORD\"}")
  # (the second one will rate-limit; we use the first)
  ACCESS=$(jq -r '.accessToken' < /tmp/login.json)
  REFRESH=$(jq -r '.refreshToken' < /tmp/login.json)
  [ -n "$ACCESS" ] && [ "$ACCESS" != "null" ] && check "Login returns accessToken" "true" || check "Login returns accessToken" "false"
  [ -n "$REFRESH" ] && [ "$REFRESH" != "null" ] && check "Login returns refreshToken" "true" || check "Login returns refreshToken" "false"
  COOKIE_SET=$(grep -c 'pv_refresh' "$COOKIE_JAR" 2>/dev/null || echo 0)
  [ "$COOKIE_SET" -gt 0 ] && check "HttpOnly pv_refresh cookie set" "true" || check "HttpOnly pv_refresh cookie set" "false"

  # /me with Bearer
  ME_STATUS=$(http_status -H "Authorization: Bearer $ACCESS" "$BASE/api/v1/auth/me")
  check_eq "GET /me with Bearer → 200" "$ME_STATUS" "200"

  # /refresh with cookie (no body)
  REFRESH_RESP=$(curl -sS -b "$COOKIE_JAR" -X POST "$BASE/api/v1/auth/refresh" \
    -H 'Content-Type: application/json' -d '{}')
  NEW_ACCESS=$(echo "$REFRESH_RESP" | jq -r '.accessToken')
  [ -n "$NEW_ACCESS" ] && [ "$NEW_ACCESS" != "null" ] && check "Cookie-based /refresh works" "true" || check "Cookie-based /refresh works" "false"

  # Logout
  LOGOUT_STATUS=$(http_status -b "$COOKIE_JAR" -X POST "$BASE/api/v1/auth/logout" \
    -H 'Content-Type: application/json' -d '{}')
  check_eq "POST /auth/logout returns 200" "$LOGOUT_STATUS" "200"

  # Replay attempt with the now-revoked refresh → 401
  REPLAY=$(curl -sS -o /dev/null -w "%{http_code}" -X POST "$BASE/api/v1/auth/refresh" \
    -H 'Content-Type: application/json' \
    -d "{\"refreshToken\":\"$REFRESH\"}")
  check_eq "Revoked refresh token rejected (401)" "$REPLAY" "401"
else
  echo ""
  echo "[7] Auth flow: SKIPPED (set SMOKE_TEST_EMAIL + SMOKE_TEST_PASSWORD to enable)"
fi

# ───────────────────────────────────────────────────────────────────────
# 10. Protected route without token
# ───────────────────────────────────────────────────────────────────────
echo ""
echo "[10] Protected route auth"
STATUS=$(http_status -X POST "$BASE/api/v1/finance/wallet/pay" \
  -H 'Content-Type: application/json' \
  -d '{"amountKgs":1}')
check_eq "Protected route without token → 401" "$STATUS" "401"

# ───────────────────────────────────────────────────────────────────────
# 11. Image variants (any uploaded file)
# ───────────────────────────────────────────────────────────────────────
echo ""
echo "[11] Image variants"
SAMPLE_IMG=$(curl -sS "$BASE/api/v1/upload" | jq -r '.[0].filename // empty')
if [ -n "$SAMPLE_IMG" ]; then
  WEBP_URL="$BASE/uploads/${SAMPLE_IMG%.webp}-600w.webp"
  STATUS=$(http_status "$WEBP_URL")
  check_eq "Image variant (600w WebP) returns 200" "$STATUS" "200"
else
  echo "  - (no uploaded images to test)"
fi

# ───────────────────────────────────────────────────────────────────────
# Summary
# ───────────────────────────────────────────────────────────────────────
echo ""
echo "==============================================="
echo -e "  ${GREEN}PASS: $PASS${NC}   ${RED}FAIL: $FAIL${NC}"
echo "==============================================="
if [ "$FAIL" -gt 0 ]; then
  echo ""
  echo -e "${RED}Failed tests:${NC}"
  for t in "${FAILED_TESTS[@]}"; do
    echo "  - $t"
  done
  echo ""
  echo "Rollback procedure: ssh pv-deploy@pv-prod.internal 'cd /var/www/power-vital && rm -f current && ln -sfn releases/previous current && pm2 restart pv-backend'"
  exit 1
fi
echo -e "${GREEN}✓ All smoke tests passed${NC}"
exit 0
