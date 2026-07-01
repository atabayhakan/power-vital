# scripts/run-integration-tests-local.ps1
#
# Local integration test runner — boots a MySQL container via Docker,
# applies the Prisma schema, runs the full test suite (integration +
# unit), then tears the container down.
#
# Why a separate script from `npm test`?
#   • npm test runs against whatever DATABASE_URL is in .env.test
#     (usually a local MySQL the dev started manually).
#   • CI uses GitHub Actions service containers.
#   • This script gives local devs a zero-config path: any box with
#     Docker installed gets the same integration coverage as CI.
#
# Requirements:
#   • Docker Desktop (or any docker-compatible runtime)
#   • PowerShell 5+ (Windows) / pwsh (cross-platform)
#
# Usage:
#   pwsh scripts/run-integration-tests-local.ps1
#
# Env vars (optional):
#   $env:MYSQL_VERSION = '8.0'        # default 8.0
#   $env:TEST_DB       = 'powervital_test'
#   $env:KEEP_RUNNING  = '1'         # don't rm the container after tests

param(
    [string]$MysqlVersion = '8.0',
    [string]$TestDb       = 'powervital_test',
    [string]$TestUser     = 'pvtest',
    [string]$TestPassword = 'pvtestpw',
    [string]$RootPassword = 'testrootpw',
    [int]   WaitSeconds   = 30
)

$ErrorActionPreference = 'Stop'

function Step($msg) {
    Write-Host ""
    Write-Host "=== $msg ===" -ForegroundColor Cyan
}

# Resolve backend dir regardless of CWD.
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendDir = Join-Path $ScriptDir '..\backend'

if (-not (Test-Path (Join-Path $BackendDir 'package.json'))) {
    Write-Error "Cannot find backend/package.json. Are you running this from the project root?"
}

Push-Location $BackendDir
try {
    Step "Checking Docker..."
    $dockerVer = (& docker --version) 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Docker is not installed or not running. Install Docker Desktop and retry."
    }
    Write-Host $dockerVer

    Step "Starting MySQL container ($MysqlVersion)..."
    $containerName = 'pv-mysql-itest'
    & docker rm -f $containerName 2>$null | Out-Null
    & docker run -d `
        --name $containerName `
        -e "MYSQL_ROOT_PASSWORD=$RootPassword" `
        -e "MYSQL_DATABASE=$TestDb" `
        -e "MYSQL_USER=$TestUser" `
        -e "MYSQL_PASSWORD=$TestPassword" `
        -p 3307:3306 `
        --health-cmd "mysqladmin ping -h 127.0.0.1 -uroot -p$RootPassword" `
        --health-interval 3s `
        --health-timeout 5s `
        --health-retries $WaitSeconds `
        "mysql:$MysqlVersion" | Out-Null

    Step "Waiting for MySQL to accept connections..."
    $ready = $false
    for ($i = 0; $i -lt $WaitSeconds; $i++) {
        $status = (& docker inspect --format '{{.State.Health.Status}}' $containerName 2>$null)
        if ($status -eq 'healthy') {
            $ready = $true
            break
        }
        Start-Sleep -Seconds 1
        Write-Host "  attempt $($i+1)/$WaitSeconds ... ($status)"
    }
    if (-not $ready) {
        Write-Error "MySQL did not become healthy in $WaitSeconds seconds."
    }
    Write-Host "MySQL is up." -ForegroundColor Green

    Step "Pushing Prisma schema..."
    $env:DATABASE_URL = "mysql://${TestUser}:${TestPassword}@127.0.0.1:3307/${TestDb}"
    & npx prisma db push --skip-generate --accept-data-loss | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Prisma db push failed."
    }

    Step "Running full test suite (unit + integration)..."
    & npm test
    $testExit = $LASTEXITCODE

    if ($env:KEEP_RUNNING -ne '1') {
        Step "Tearing down MySQL container..."
        & docker rm -f $containerName | Out-Null
    } else {
        Write-Host ""
        Write-Host "KEEP_RUNNING=1 — leaving $containerName running on :3307" -ForegroundColor Yellow
    }

    if ($testExit -ne 0) {
        Write-Error "Tests failed (exit $testExit)."
    }
    Write-Host ""
    Write-Host "✓ All tests passed." -ForegroundColor Green
}
finally {
    Pop-Location
}