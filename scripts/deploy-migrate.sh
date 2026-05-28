#!/usr/bin/env bash
# E5 — apply SQL guards + Drizzle schema on deploy (run after DATABASE_URL is set).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -z "${DATABASE_URL:-}" && -z "${SUPABASE_DATABASE_URL:-}" ]]; then
  echo "deploy-migrate: DATABASE_URL or SUPABASE_DATABASE_URL must be set"
  exit 1
fi

CONN="${SUPABASE_DATABASE_URL:-$DATABASE_URL}"

if command -v psql >/dev/null 2>&1; then
  for f in "$ROOT"/lib/db/migrations/sql/*.sql; do
    [[ -f "$f" ]] || continue
    echo "deploy-migrate: applying $(basename "$f")"
    psql "$CONN" -v ON_ERROR_STOP=1 -f "$f"
  done
else
  echo "deploy-migrate: psql not found — skipping SQL migrations (run lib/db/migrations/sql/*.sql manually)"
fi

echo "deploy-migrate: drizzle push"
pnpm --filter @workspace/db run push

echo "deploy-migrate: done"
