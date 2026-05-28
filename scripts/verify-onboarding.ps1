# Quick smoke checks for local onboarding stack (PowerShell).
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host "==> typecheck libs + api-server + dashboard + mobile"
pnpm run typecheck:libs
pnpm --filter @workspace/api-server run typecheck
pnpm --filter @workspace/livia-dashboard run typecheck
pnpm --filter @workspace/livia-mobile run typecheck

Write-Host "==> api-server unit tests"
pnpm --filter @workspace/api-server run test

$base = $env:LIVIA_API_URL
if (-not $base) { $base = "http://localhost:3001" }

Write-Host "==> health (optional; start API first)"
try {
  $health = Invoke-RestMethod -Uri "$base/api/health" -Method Get -TimeoutSec 5
  Write-Host "API health:" ($health | ConvertTo-Json -Compress)
} catch {
  Write-Host "SKIP health — API not running at $base"
}

Write-Host "Done. For full E2E, follow docs/LOCAL_DEV.md"
