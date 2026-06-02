---
name: livia-beta-handoff
description: >-
  Prepare Livia for founder or design-partner manual testing: fresh demo seed,
  automated E2E gates, and step-by-step walkthrough instructions. Use when the
  user wants to test, manual walkthrough, fresh demo, 100 businesses beta, or
  clear terminal instructions to start the stack.
---

# Livia beta handoff

## Goal

User can open terminals, log in, and test **without surprises** — automated gates run first; instructions are numbered.

## Workflow

### 1. Automated gates

```bash
cd "<repo-root>"
pnpm e2e:prep
# Terminal 1: pnpm dev:api
# Terminal 2: pnpm dev:dashboard
# Terminal 3 (optional): pnpm dev:marketing
# Terminal 4 (optional): pnpm dev:internal
pnpm smoke:gate3
pnpm test:e2e:api
pnpm test:e2e
pnpm e2e:founder-checklist
```

For full visual confidence first: [`livia-visual-audit`](../livia-visual-audit/SKILL.md).

### 2. Demo world

```bash
pnpm demo:provision
# or repair:
pnpm demo:repair
```

Password: `LIVIA_DEMO_PASSWORD` in `.env` (default documented in walkthrough).

### 3. Deliver to user

Copy structure from [`docs/testing/MANUAL-WALKTHROUGH-BETA.md`](../../docs/testing/MANUAL-WALKTHROUGH-BETA.md):

- **Ports:** API :3000 · dashboard :5173 · marketing :5174 · internal :5175
- **Env files** table (root + per-artifact `.env.example`)
- **Personas / slugs** to test (chain, multi-location, verticals)
- **Screenshot folders** if captures exist
- **If something fails:** screen + persona + `x-request-id`

### 4. Platform-wide reminder

If work touched only dashboard, confirm whether **livia.io**, **internal**, **mobile**, **public `/b`** also need updates — see surfaces rule.

## Related docs

- [`READY-FOR-FULL-TEST.md`](../../docs/testing/READY-FOR-FULL-TEST.md)
- [`FOUNDER-FIRST-LOGIN.md`](../../docs/testing/FOUNDER-FIRST-LOGIN.md)
- [`demo-script.md`](../../docs/demo-script.md)

## Closeout

State explicitly: **"You can start testing now"** only when API + dashboard are up and demo provision succeeded.
