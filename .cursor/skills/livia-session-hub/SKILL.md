---
name: livia-session-hub
description: >-
  Start and close Livia agent sessions with hat declaration, cascade awareness,
  typecheck, and optional exec Hats River logging. Use at session start, when
  the user says "begin" or "go", or when closing non-trivial build/doc work.
---

# Livia session hub

## Session start

1. Skim [`docs/LIVIA-STATUS.md`](../../docs/LIVIA-STATUS.md) (Buckets A–D — what is open).
2. **Declare hat** (state once): `ceo` | `coo` | `cpo` | `cto` | `cs` | `cro` — see hat guide below.
3. If task touches a **surface** (dashboard, mobile, marketing, internal, `/b`, gateway): read [`.cursor/rules/livia-surfaces-cascade.mdc`](../../.cursor/rules/livia-surfaces-cascade.mdc).
4. Narrow scope to **one phase or one vertical slice** unless user asked for a full audit.

## Session close (non-trivial work only)

1. Run `pnpm run typecheck` if code changed.
2. Run cascade checks from [`AGENTS.md`](../../AGENTS.md) table (vertical, demo, `/b`, codegen, etc.).
3. Short closeout: **Done** | **Blocked (needs you)** | **Next** (one line each).
4. Optional: [`exec-hat-work`](../exec-hat-work/SKILL.md) when work is ship- or doc-complete.

## Hat guide

| Hat | Use when |
|-----|----------|
| **ceo** | Category, gates, GTM, narrative |
| **coo** | Ops, release, staging discipline |
| **cpo** | Product specs, UX docs, onboarding |
| **cto** | API, migrations, infra, E2E |
| **cs** | Demo, support, tenant health |
| **cro** | Billing, pipeline, commercial proof |

## Child skills (pick by task)

| Skill | When |
|-------|------|
| `livia-carry-on-phase` | carry on, finish phase, big chunks |
| `livia-visual-audit` | screenshots, visual audit, Maestro |
| `livia-founder-ship` | deploy, staging, prod readiness |
| `livia-beta-handoff` | manual walkthrough, ready to test |
| `livia-doc-sweep` | document in full, no scaffolding |
| `livia-gateway-parity` | G1–G3, sign-in, `*.target.png` |
| `livia-vertical-change` | new/changed vertical |
| `livia-liv-platform` | Liv copy, tenant vocabulary, mobile parity |
| `livia-ux-prototype` | canvas/visual before code |
| `livia-git-ship` | commit/push (user asked only) |
| `exec-hat-work` | Hats River log |

## Authority

[`AGENTS.md`](../../AGENTS.md) · [`docs/START-HERE.md`](../../docs/START-HERE.md)
