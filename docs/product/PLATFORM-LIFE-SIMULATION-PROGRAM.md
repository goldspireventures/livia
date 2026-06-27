# Platform Life Simulation (PLS) — program design

**Status:** design (2026-06-27)  
**Owner:** founder + agent inspector hat  
**North star:** V1 sacred metric — **first booking** — under real-world stress, not demo-happy-path only

**Builds on (do not duplicate):**

| Doc / tool | Role in PLS |
|------------|-------------|
| [`PLATFORM-PERFECTION-PROGRAM.md`](PLATFORM-PERFECTION-PROGRAM.md) | Persona matrix, bi-directional inspection method |
| [`FULL-VISUAL-AUDIT-WEB-MOBILE.md`](../testing/FULL-VISUAL-AUDIT-WEB-MOBILE.md) | Screenshot capture mechanics |
| [`VISUAL-AUDIT-LOG.md`](../testing/VISUAL-AUDIT-LOG.md) | Finding ledger (append-only per run) |
| [`competitive-response-wargame.md`](../business/competitive-response-wargame.md) | Unhappy-path *business* scenarios |
| [`FOUNDER-UAT-CHECKLIST.md`](../operations/FOUNDER-UAT-CHECKLIST.md) | Signed-in P0 paths |
| [`persona-uat-probe.mjs`](../../scripts/persona-uat-probe.mjs) | Prod URL/API smoke |
| `.cursor/skills/livia-visual-audit` | Agent execution loop |
| [`PREMIUM-MOTION-LAYER.md`](../design/PREMIUM-MOTION-LAYER.md) | Motion yes/no rubric |

---

## 1. What PLS is (and is not)

**PLS** = a **nested, multi-persona simulation** of Livia as if real shops, guests, and staff used it for a week — with **screenshots at every meaningful step**, **API/workflow traces**, and a **structured critique** of UX, missing affordances, motion, and future breakage.

| PLS is | PLS is not |
|--------|------------|
| Happy + unhappy paths per persona | A one-off Playwright flake hunt |
| Visual + behavioural + system evidence | Marketing copy review only |
| Competitive bench (“would Fresha/Phorest feel clearer here?”) | Pixel-perfect Figma match |
| Actionable punch list with severity | A vague “looks fine” |

---

## 2. Simulation layers (run in order)

```text
L0  Static / policy     propagation:check, vertical:check, persona:uat (prod URLs)
L1  API + workflows     test:api:ci, Inngest runs, domain-event dedup
L2  Signed-in E2E       founder-uat, dual-entry-uat, sacred-path-signup
L3  Visual capture      e2e:full-visual-audit:web (+ mobile when ready)
L4  Life scenarios      scripted multi-step “days” (this program’s core)
L5  Agent review        screenshot + rubric → VISUAL-AUDIT-LOG + PLS report
L6  Remediation wave    fix P1 → re-run affected scenarios only
```

**Gate:** Do not start L4 until L0–L2 are green on the target environment (local + staging/prod probes).

---

## 3. Personas & scenario packs

Each **pack** = one persona × one narrative × happy + unhappy variants.

### Pack A — New founder (sacred path)

| Step | Happy | Unhappy |
|------|-------|---------|
| Marketing → sign-up | Open pricing, get-started, sign up | Abandon mid-form, return next day |
| Legal → onboarding | Fresh path, create shop, profile | Slug collision, resume incomplete shop |
| Go-live | Test book on `/book`, first real booking | AI off, no services, Stripe not connected |
| Day 2 | Dashboard ritual, settings booking link | Wrong vertical copy, stuck onboarding gate |

### Pack B — Owner (vertical slice × 3)

Medspa, beauty (Bloom), salon (Luxe) — reuse `founder-uat-p0` inventory plus:

- Inbox → handoff → resume
- Liv proposal → accept / reject
- Deposit booking → pay link
- Settings → appearance → public preview

**Unhappy:** API 503, rate limit, Clerk session expiry mid-flow, empty roster.

### Pack C — Staff / reception

- My-day, bookings list, time-off propose
- Reception vertical routes (wellness / beauty)
- **Unhappy:** STAFF blocked from owner routes, wrong landing redirect

### Pack D — Guest

- Public `/book` → confirm → `/my` OTP → visit manage
- Pay / proof / waitlist tokens (demo slugs)
- **Unhappy:** OTP delivery unavailable, slot gone, deposit required, chat without disclosure

### Pack E — Org admin (chain)

- `/chain` portfolio, switch shop, rollup
- **Unhappy:** single-shop org admin → chain redirect behaviour

### Pack F — Demo / gateway

- G1 grid → G2 wedge → G3 role enter
- **Unhappy:** demo off in prod, wrong Clerk instance

### Pack G — Platform ops (internal)

- Support ticket with `liv_error` → Inngest `liv-was-wrong-triage`
- Migration import job (file + honest limits)
- **Unhappy:** `WORKFLOWS_DISABLED`, missing Twilio, webhook retry

---

## 4. Capture protocol (every step)

For each step in a pack, record:

| Field | Example |
|-------|---------|
| `scenarioId` | `A-founder-happy-03-onboarding-profile` |
| `persona` | `founder` |
| `surface` | `dashboard` |
| `route` | `/onboarding` |
| `viewport` | `1440x900` + `390x844` |
| `screenshot` | `artifacts/pls/2026-06-27/A-founder-happy-03.png` |
| `apiTrace` | optional HAR or `requestId` from toast |
| `inngestRunId` | if workflow expected |
| `outcome` | `pass` / `fail` / `degraded` |

**Naming:** `artifacts/pls/<run-date>/<pack>-<variant>-<step>-<viewport>.png`

**Automation target (Phase 2):** new Playwright project `life-simulation` that wraps packs A–D with `toHaveScreenshot` + JSON step manifest — not built in Wave 1; Wave 1 is agent-driven with manual checklist.

---

## 5. Review rubric (per screen)

Score each screen **1–5** on:

1. **Clarity** — purpose obvious in 5 seconds?
2. **Next action** — one obvious primary CTA?
3. **Completeness** — missing controls/info vs Phorest/Fresha baseline?
4. **Calm** — clutter, jargon, dev-facing leakage?
5. **Motion** — static OK or micro-motion would guide? (see PREMIUM-MOTION-LAYER)
6. **Trust** — honest limits, disclosures, error copy with `requestId`?
7. **Accessibility** — axe serious/critical (founder-uat pattern)
8. **Future breakage** — what fails at 10× tenants, slow API, offline, Clerk outage?

**Output row** → [`VISUAL-AUDIT-LOG.md`](../testing/VISUAL-AUDIT-LOG.md) + [`PLS-RUN-LOG.md`](../testing/PLS-RUN-LOG.md) (created on first run).

---

## 6. Execution waves (suggested)

| Wave | Scope | Duration | Exit |
|------|-------|----------|------|
| **W0** | L0–L2 gates + Inngest prod | 1 session | persona:uat 26/26, Inngest synced prod |
| **W1** | Pack A + D (founder + guest) | 1–2 sessions | Sacred path screenshots + 20 findings max |
| **W2** | Pack B (3 verticals) | 1 session | founder-uat extended + visual captures |
| **W3** | Pack C, E, F | 1 session | Staff + chain + gateway |
| **W4** | Pack G + unhappy matrix | 1 session | Workflow + integration failure modes |
| **W5** | Remediation + re-run | ongoing | P1 closed, P2 scheduled |
| **W6+** | Gap closure | see [`PLS-COVERAGE-GAPS.md`](../testing/PLS-COVERAGE-GAPS.md) | Every route ≥ Partial |

---

## 7. Deliverables per run

1. **`artifacts/pls/<date>/`** — screenshots + `manifest.json`
2. **`docs/testing/PLS-RUN-LOG.md`** — executive summary, scores, top 10 fixes
3. **`VISUAL-AUDIT-LOG.md`** — row per screen finding
4. **`UX-PUNCH-LIST.md`** — optional auto via `pnpm e2e:ux-punch-list`
5. **Exec hat** — `pnpm exec:hat-work` at end of W1+

---

## 8. Competitive bench (quick prompts)

When reviewing a screen, ask:

- **Booking:** Is the next slot as fast as Fresha’s 2-tap book?
- **Inbox:** Is thread + context as clear as Phorest’s client comms?
- **Settings:** Would a 9pm owner find “booking link” without support?
- **Guest `/my`:** Does vault feel as trustworthy as a bank app (clear, calm)?

We do **not** copy UI — we match **clarity and speed** with Livia’s premium restraint.

---

## 9. Agent execution command (Wave 1)

```bash
pnpm start:platform:test
pnpm persona:uat
pnpm --filter @workspace/e2e run test:founder-uat
pnpm test:e2e:uat-dual-entry
# Manual: follow Pack A checklist with screenshots to artifacts/pls/<date>/
# Log: append VISUAL-AUDIT-LOG.md + create PLS-RUN-LOG.md section
```

Skill: `.cursor/skills/livia-visual-audit` + this doc.

---

## 10. Extended scope (founder brief — Wave 1+)

### 10.1 Twelve-month usage simulation

Local/dev only: **`POST /api/dev/pls/fast-forward`** + **`pnpm pls:simulate --slug <demo-slug>`**

| Signal | What it simulates |
|--------|-------------------|
| 52 completed visits | Spread across N months of calendar |
| Correction + override memory | Owner/staff teaching Liv |
| Learning pass scheduling | Milestones 5/10/25/50 + correction triggers |
| Morning briefing refresh | Post-simulation owner dashboard |

**Not simulated in Wave 1:** Stripe renewal webhooks, real SMS volume, chain rollup at 50 locations.

### 10.2 Content & tone audit

| Tool | Purpose |
|------|---------|
| `pnpm pls:content-audit` | Static scan — forbidden patterns in customer UI sources |
| PLS capture `auditPageText()` | Runtime scan on every screenshot step |
| Patterns hub | `scripts/pls-forbidden-copy.mjs` |

**Rules:** No closed beta, staging demo, dev ports, operator IDs, raw HTTP in customer copy. Demo-only surfaces may use beta links when `isDemoLoginEnabled`.

### 10.3 Internal ops (Pack G extended)

Capture: `pnpm --filter @workspace/e2e run test:internal-visual` (requires `INTERNAL_OPS_SECRET`).

Review rubric additions for support:

1. **Ticket → tenant context** — one click to business + recent Liv errors?
2. **Auto-triage hints** — priority, vertical, likely root cause visible?
3. **Suggested fixes** — runbook links, not raw stack traces?
4. **Impersonation audit trail** — clear who opened what?
5. **Monitoring ↔ support** — alert count matches ticket spike?

### 10.4 Competitive pain-point lens (quick reference)

| Incumbent pain | Livia must win on |
|----------------|-------------------|
| Fresha marketplace ownership | Guest belongs to salon; no platform cut copy |
| Phorest admin-role leak | Role boundaries + calm staff UX |
| Booksy flaky notifications | Comms status honest + requestId on errors |
| Generic “AI bolt-on” | Liv learns from corrections — show evidence in settings/Liv tab |
| Migration terror | Import honest limits + resume, not fake “instant” |

### 10.5 Capture → fix → re-capture loop

```text
capture (pls:wave1) → manifest contentHits + human review
  → fix P1 copy/UX → pls:content-audit:strict
  → re-capture affected scenarios only
  → append VISUAL-AUDIT-LOG + PLS-RUN-LOG
```

---

## 11. Open decisions (founder)

1. **Environment:** PLS Wave 1 on **local demo world** vs **staging** vs **prod** (recommend: local + prod probes, staging for sacred signup).
2. **Mobile native:** include Maestro in W2 or defer to W3?
3. **AI eval:** include Liv chat quality scoring in PLS or separate program?
4. **Automation budget:** invest in `life-simulation` Playwright project after W1 manual pass?

---

*Authority chain: [`AGENTS.md`](../../AGENTS.md) → [`PLATFORM-PERFECTION-PROGRAM.md`](PLATFORM-PERFECTION-PROGRAM.md) → this doc.*
