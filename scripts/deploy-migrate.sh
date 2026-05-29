#!/usr/bin/env bash
# E5 — Drizzle schema first, then SQL guards (same order as pnpm db:push && pnpm db:migrate:sql).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -z "${DATABASE_URL:-}" && -z "${SUPABASE_DATABASE_URL:-}" ]]; then
  echo "deploy-migrate: DATABASE_URL or SUPABASE_DATABASE_URL must be set"
  exit 1
fi

echo "deploy-migrate: drizzle push"
pnpm --filter @workspace/db run push

echo "deploy-migrate: SQL migrations"
if [[ -f "$ROOT/.env" ]]; then
  node --env-file="$ROOT/.env" "$ROOT/scripts/apply-sql-migrations.mjs"
else
  node "$ROOT/scripts/apply-sql-migrations.mjs"
fi

echo "deploy-migrate: done"
