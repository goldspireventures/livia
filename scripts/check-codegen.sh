#!/usr/bin/env bash
# Fail if regenerating the API client produces uncommitted changes.
# Run locally:  ./scripts/check-codegen.sh
# Run in CI:    same — just exit code matters.
set -euo pipefail

cd "$(dirname "$0")/.."

if ! pnpm --filter @workspace/api-spec run codegen; then
  echo "::error::OpenAPI codegen command failed. See logs above." >&2
  exit 1
fi

CHANGED="$(git status --porcelain lib/api-client-react lib/api-zod lib/api-spec || true)"

if [[ -n "$CHANGED" ]]; then
  echo "::error::OpenAPI codegen produced uncommitted changes. Run 'pnpm --filter @workspace/api-spec run codegen' locally and commit." >&2
  echo "$CHANGED" >&2
  git --no-pager diff lib/api-client-react lib/api-zod lib/api-spec >&2 || true
  exit 1
fi

echo "OpenAPI client is in sync with the spec."
