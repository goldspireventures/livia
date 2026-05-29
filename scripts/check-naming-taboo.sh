#!/usr/bin/env bash
# Compliance C12 — fail if "Olivia" appears outside explicit allowlist.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! command -v rg >/dev/null 2>&1; then
  echo "check-naming-taboo: ripgrep (rg) required"
  exit 1
fi

# Demo seed customer name in dev route only. Meta docs explain the taboo (not product usage).
ALLOW=(
  'artifacts/api-server/src/routes/dev.ts'
  'docs/'
  '.local/'
  'README.md'
  'replit.md'
  'scripts/check-naming-taboo.sh'
)

ARGS=()
for a in "${ALLOW[@]}"; do
  ARGS+=(--glob "!${a}**")
done

if rg -i '\bOlivia\b' "${ARGS[@]}" --glob '!**/node_modules/**' --glob '!**/*.map' .; then
  echo ""
  echo "FAIL: Found forbidden name 'Olivia' outside allowlist (launch-plan C12)."
  exit 1
fi

if rg -i '\bbliq\b' "${ARGS[@]}" --glob '!**/node_modules/**' --glob '!docs/**' --glob '!**/*.md' . 2>/dev/null; then
  echo ""
  echo "FAIL: Found legacy codename 'Bliq' in product code (use Livia)."
  exit 1
fi

echo "check-naming-taboo: ok"
