# Platform Life Simulation — run log

Append one section per PLS wave. Screenshots live in `artifacts/pls/<date>/` (gitignored).

**Program:** [`docs/product/PLATFORM-LIFE-SIMULATION-PROGRAM.md`](../product/PLATFORM-LIFE-SIMULATION-PROGRAM.md)

---

## Template (copy per run)

```markdown
### PLS run — YYYY-MM-DD (Wave N)

**Environment:** local | staging | prod  
**Agent / human:**  
**Gates before run:** persona:uat · test:api:ci · Inngest  

| Pack | Variant | Steps | Pass | Fail | Notes |
|------|---------|-------|------|------|-------|
| A founder | happy | | | | |
| A founder | unhappy | | | | |

**Top findings (P1):**
1.

**Motion / UX themes:**
-

**Competitive bench notes:**
-

**Next wave:**
-
```

---

## Runs

### PLS run — 2026-06-27 (Wave 1)

**Environment:** local demo world + prod URL probes  
**Agent:** Cursor inspector (PLS Wave 1)  
**Gates before run:** persona:uat 26/26 · demo provisioned · Inngest synced (prod, user-confirmed)

| Pack | Variant | Steps | Pass | Fail | Notes |
|------|---------|-------|------|------|-------|
| F marketing | happy | 4 | 4 | 0 | `/`, get-started, how-it-works, demo |
| A founder | happy | 3 | 3 | 0 | sign-in, sign-up, onboarding second-shop |
| B owner | happy | 3 | 3 | 0 | dashboard, billing, Liv settings |
| D guest | happy | 4 | 4 | 0 | luxe, medspa, bloom book + `/my` |
| G internal | happy | 12 | 12 | 0 | internal-visual-capture all ops tabs |

**Simulation:** `pnpm pls:simulate --slug clarity-medspa-dublin --months 12` — 48 completed visits + 3 learning memory rows; 2/3 learning passes scheduled.

**Content audit:** `pnpm pls:content-audit:strict` green after fixes (see VISUAL-AUDIT-LOG 2026-06-27 PLS).

**Captures:** `artifacts/pls/2026-06-27/manifest.json` (14 dashboard/marketing steps, 0 contentHits).

**Top findings (P1 — fixed this wave):**
1. Onboarding attestation said “closed beta” — replaced with compliance copy.
2. Billing/add-on toasts said “staging demo” — neutral “Add-on active”.
3. Event vendor 503 mentioned “staging demo link” — prod-safe message.
4. Chain borrow form placeholder “Staff row id” — human label.
5. Comms wizard leaked `META_ACCESS_TOKEN` — customer-friendly Meta credentials copy.

**Motion / UX themes:**
- Marketing and gateway entry calm; sign-in/sign-up consistent.
- Public book verticals render; medspa post-simulation shows richer history signal for Liv tab review in W2.
- Internal ops shell complete; support radar + monitoring captured — auto-triage UX review queued W4.

**Competitive bench notes:**
- Guest book: slot selection clear; continue W2 for deposit/pay-link unhappy paths.
- Billing unlock: toast copy now matches bank-app calm (no dev leakage).

**Next wave (W2):**
- Full vertical matrix (all demo slugs) + staff/reception packs.
- Maestro mobile PLS captures.
- Liv learning evidence UI verification after simulated corrections.
- Unhappy paths: OTP unavailable (prod 503), session expiry, addon checkout failure.

---

### PLS run — 2026-06-27 (Wave 2)

**Environment:** local demo world  
**Gates:** Wave 1 green · demo provisioned · content audit strict

| Pack | Variant | Steps | Pass | Fail | Notes |
|------|---------|-------|------|------|-------|
| D guest | happy | 52 | 52 | 0 | All demo `/b` + `/e` public surfaces |
| D guest | unhappy | 2 | 2 | 0 | 404 slug + `/my` recheck |
| B owner | happy | 14 | 14 | 0 | medspa, beauty, salon, wellness, fitness slices + Liv tab |
| C staff | happy | 14 | 14 | 0 | staff-senior/junior, receptionist, manager |
| E founder | happy | 3 | 3 | 0 | chain, dashboard, inbox |

**Simulation:** bloom-beauty-dublin 12-month fast-forward before owner Liv captures.

**Captures:** `artifacts/pls/wave2-2026-06-27/manifest.json` — **77 steps, 0 contentHits**.

**Fixes this wave:**
1. Staff pack Clerk flake — `resetDemoBrowserSession` between persona sign-ins.

**Next wave (W3):**
- Gateway G1–G3 unhappy paths · chain edge cases · mobile Maestro (device required).
- Session expiry + addon checkout failure matrix.

---

### PLS run — 2026-06-27 (Wave 3)

**Environment:** local demo world  
**Gates:** Wave 2 green · content audit strict

| Pack | Variant | Steps | Pass | Fail | Notes |
|------|---------|-------|------|------|-------|
| F gateway | happy | 16 | 16 | 0 | G1 launcher + G2/G3 for 5 wedges |
| F gateway | unhappy | 2 | 2 | 0 | Invalid wedge + back to G1 |
| F marketing | happy | 2 | 2 | 0 | Beauty vertical + get-started handoff |
| E chain | happy + edge | 4 | 4 | 0 | HQ portfolio, add location, single-shop `/chain` |
| B session | unhappy | 4 | 4 | 0 | Expired session on protected routes + sign-in redirect |
| B billing | happy | 1 | 1 | 0 | Addon catalog on billing tab |

**Captures:** `artifacts/pls/wave3-2026-06-27/manifest.json` — **27 steps, 0 contentHits**.

**Next wave (W4):**
- Internal ops auto-triage UX · migration import honest limits · workflow failure matrix (Inngest off, webhooks).
- Mobile Maestro when device available.

---

### PLS run — 2026-06-27 (Wave 4)

**Environment:** local demo world + internal ops  
**Gates:** INTERNAL_OPS_SECRET set · demo provisioned · content audit strict

| Pack | Variant | Steps | Pass | Fail | Notes |
|------|---------|-------|------|------|-------|
| G internal | happy | 14 | 14 | 0 | Support inbox/radar/board/investigate, monitoring, tenants, liv_error ticket |
| G API | matrix | 5 | 5 | 0 | Monitoring flows/cascade, platform health, OTP 503 honest path |
| G migration | happy | 2–3 | 2–3 | 0 | Onboarding switching + settings integrations |
| G owner | happy | 1 | 1 | 0 | Help/support dialog (“Liv got it wrong”) |
| G workflow | unhappy | 1–2 | 1–2 | 0 | Comms setup limits + parallel-run panel |

**Captures:** `artifacts/pls/wave4-2026-06-27/manifest.json` — **17 steps, 0 contentHits**.

**Next wave (W5):**
- Remediation re-run of any P2 findings · mobile Maestro · prod sacred-path signup staging pass.

---

### PLS run — 2026-06-27 (Wave 5 — program closeout)

**Environment:** local + prod URL probes  
**Gates:** content audit strict · persona:uat 26/26 · waves 1–4 manifests

| Check | Result |
|-------|--------|
| Content audit (strict) | pass |
| Persona UAT (prod) | 26/26 |
| Sacred re-capture | 10 steps (guest, gateway, owner+axe, founder) |
| Aggregate PLS steps | **145 total, 0 content failures** |
| Mobile Maestro | skipped (no device/CLI) |
| Final report | `artifacts/pls/PLS-FINAL-REPORT-2026-06-27.json` — **pass** |

**Program status:** Waves 1–5 complete. Ready for push + founder staging sacred-path pass (mobile when emulator available).

---

*(Wave 0 prep 2026-06-27.)*
