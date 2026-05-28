#!/bin/bash
set -euo pipefail
pnpm install --frozen-lockfile
bash scripts/deploy-migrate.sh
