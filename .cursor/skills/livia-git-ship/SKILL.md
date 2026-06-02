---
name: livia-git-ship
description: >-
  Commit and push Livia changes safely on Windows: exclude founder-gate.json,
  PowerShell-safe messages, only commit when user asked. Use when committing,
  pushing to main for deploy, or staging deploy with local changes.
---

# Livia git ship

## Only commit when user explicitly asked

If unclear, ask once — do not proactive commit.

## Never stage

- `founder-gate.json`
- `.env`, secrets, credentials

## Pre-commit

```bash
pnpm run typecheck
```

## Windows-friendly commit

PowerShell (HEREDOC often fails):

```powershell
git add -A
git reset -- founder-gate.json
git commit -m "Your message here."
```

## Push for staging deploy

- Confirm branch (`main` for Vercel/Railway GitHub deploy).
- After push: [`livia-founder-ship`](../livia-founder-ship/SKILL.md) post-deploy checks.

## PRs

Use `gh` per user PR workflow; do not force-push `main`.
