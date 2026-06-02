---
name: exec-hat-work
description: Log meaningful build session output to the exec cockpit Hats River via pnpm exec:hat-work. Use at end of non-trivial tasks, when closing a doc sprint chunk, or when the user asks to record work on a company hat (ceo, cto, cpo, etc.).
---

# Exec hat work logging (Track H)

Part of [`livia-session-hub`](../livia-session-hub/SKILL.md) closeout.

## When to use

- Session produced **shipped or doc-complete** work worth showing in cockpit Hats River
- User cares about exec cockpit / company workforce visibility
- Closing a multi-file task (not single-line fixes)

## Workflow

1. **Declare hat** at session start (mental or in summary): `ceo` | `coo` | `cpo` | `cto` | `cs` | `cro`
2. Before closing, run:

```bash
pnpm exec:hat-work --hat <hat> --summary "<one line, max 280 chars>" [--link "Label|docs/path.md"]
```

3. Optional: `--actor agent --actor-label cursor-agent --source cursor`

## Hat guide

| Hat | Use when |
|-----|----------|
| **ceo** | Narrative, gate, category, GTM |
| **coo** | Ops, support SLAs, release discipline |
| **cpo** | Product specs, UX docs, onboarding |
| **cto** | API, migrations, infra, E2E |
| **cs** | Tenant health, demo, support tooling |
| **cro** | Pipeline, billing, commercial proof |

## Requirements

- API running locally (`pnpm dev:api`) or `API_URL` set
- `INTERNAL_OPS_SECRET` in `.env`

## Spec

[`docs/product/INTERNAL-EXEC-COCKPIT-SPEC.md`](../../docs/product/INTERNAL-EXEC-COCKPIT-SPEC.md) §4.2b
