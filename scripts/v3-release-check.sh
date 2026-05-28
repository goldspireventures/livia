#!/usr/bin/env bash
# v3 Block R — release sweep reminder (run before prod tag)
set -euo pipefail
echo "=== Livia v3 release sweep ==="
echo "[ ] API + DB migrations noted in changelog"
echo "[ ] Dashboard smoke / E2E"
echo "[ ] Mobile OTA notes"
echo "[ ] livia.io + /de copy if customer-facing"
echo "[ ] Public /b booking smoke"
echo "[ ] Internal portal version"
echo "[ ] Policy pack version if vertical/locale changed"
echo "[ ] docs/changelog.md updated"
echo "[ ] V3-SURFACE-MATRIX.md row updated"
pnpm run typecheck
echo "=== typecheck OK ==="
