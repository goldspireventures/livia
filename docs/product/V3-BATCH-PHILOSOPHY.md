# v3 batch philosophy

We ship **trains**, not drizzles.

## Rule

Each meaningful v3 increment should touch every surface that cares in **one PR**:

| Surface | Examples |
|---------|----------|
| API + DB | migrations, routes, workflows, entitlements |
| Dashboard | owner rituals, public `/b`, toolkit |
| Mobile | nav parity where owners act on the go |
| Marketing | vertical pages, `/de`, changelog |
| Internal | platform health, tenant ops |
| Policy | verticals, procedures, continuity templates |

Use `.github/pull_request_template.md` as the release-sweep checklist.

## What “batch” does not mean

- Claiming counsel/SOC2/voice-DE without eval or legal sign-off
- Skipping migrations and hoping JSON columns absorb schema
- Dashboard-only features with no API contract

## Current batch trains (2026-05-22)

1. **Continuity + pet grooming** — migration `011`, SMS/MMS inbound, stuck queue
2. **Medspa + waitlist + DE marketing** — migration `012`, clinical hub, public consent step, `waitlist-offer` workflow, `/de` page

Next train targets: OpenAPI regen for public fields, full DE locale packs, Block R CI enforcement.
