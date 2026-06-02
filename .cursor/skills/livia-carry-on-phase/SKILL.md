---
name: livia-carry-on-phase
description: >-
  Execute one Livia build phase to completion without stopping mid-flight.
  Use when the user says carry on, continue, proceed, finish 1-6, big chunks,
  don't stop, ur in charge, or complete the phase in full.
---

# Livia carry-on phase

## Rules

- **One phase per run** — define "done" before coding.
- **Do not stop** for approval unless blocked (secrets, product choice, or user-only action).
- **Do not** re-ask "what next?" when the plan is already in docs or the prior turn.

## Workflow

1. **Scope** — Read [`docs/LIVIA-STATUS.md`](../../docs/LIVIA-STATUS.md) + the active program section (e.g. [`PLATFORM-EVOLUTION-AND-OPS-PROGRAM.md`](../../docs/product/PLATFORM-EVOLUTION-AND-OPS-PROGRAM.md)).
2. **Done definition** — Checklist: code + tests + docs/links per [`AGENTS.md`](../../AGENTS.md) cascade.
3. **Execute** — Work in **large chunks** (full feature slice, not drive-by edits).
4. **Surfaces** — If UI: **web + mobile** when the feature is tenant-facing unless explicitly web-only.
5. **Verify before claiming done:**
   - `pnpm run typecheck`
   - `pnpm vertical:check` / `pnpm vertical:doc-check` if policy/registry touched
   - `pnpm codegen` if OpenAPI changed
   - Relevant E2E slice (see [`docs/testing/E2E-RUNBOOK.md`](../../docs/testing/E2E-RUNBOOK.md))
6. **Closeout** — Three lines: Done / Blocked / Next.

## Anti-patterns

- Stopping after a partial file with phases still open.
- "Scaffolding" docs or TODO-only commits when user asked for **full** completion.
- Fixing dashboard only when marketing, internal, mobile, or `/b` share the same flow.

## Related

[`livia-session-hub`](../livia-session-hub/SKILL.md) · [`livia-doc-sweep`](../livia-doc-sweep/SKILL.md)
