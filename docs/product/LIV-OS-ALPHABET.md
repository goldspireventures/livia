# Liv OS — Alphabet roadmap (C → Z and beyond)

**Status:** Living execution map — **updated 2026-05-25**  
**Vision:** [`LIVIA-NORTH-STAR.md`](./LIVIA-NORTH-STAR.md)  
**Gates:** [`PLATFORM-BUILT-RIGHT.md`](./PLATFORM-BUILT-RIGHT.md)  
**Kernel:** [`../engineering/PLATFORM-KERNEL.md`](../engineering/PLATFORM-KERNEL.md)

Each letter is a **shippable slice**. Status: ✅ done · 🟡 partial (real code, known limits) · ⬜ not started · 🔒 external blocker

---

## A–B — Foundation

| | Deliverable | Status |
|---|-------------|--------|
| **A** | Liv presence API, morning narrative synthesis, per-tenant ritual lines | ✅ |
| **B** | `liv_signals`, domain-event reactions, moments on web/mobile, briefing refresh | ✅ |

---

## C–G — Operator sensational

| | Deliverable | Status |
|---|-------------|--------|
| **C** | Agentic inbox — staff Liv assist, tools, chips OPEN+HANDED_OFF, STAFF+, eval traces | ✅ |
| **D** | Internal Liv — search/snapshot, suggestion chips, continuity traces | ✅ |
| **E** | Continuity OS — stuck queue, timeline web+mobile, public next steps API | ✅ |
| **F** | Founder / chain — Glance, rollup, portfolio presence | ✅ |
| **G** | Command hub — briefing refresh, stuck, moments, inbox/toolkit links | ✅ |

---

## H–M — Depth

| | Deliverable | Status |
|---|-------------|--------|
| **H** | Handoff ritual — pause Liv, return-to-Liv, moments | ✅ |
| **I** | Inbox channels — SMS/WA/IG/meta unified thread | 🟡 (channels exist; attachment UX thin) |
| **J** | Jurisdiction packs — DE, medspa consent | 🟡 (`@workspace/policy` jurisdictions; medspa overlay partial) |
| **K** | Kernel map — PLATFORM-KERNEL.md | ✅ |
| **L** | Lifecycle — transfer, nudges, second-shop | 🟡 (API + partial UI) |
| **M** | Memory — `liv_entity_memory`, customer panel, prompt injection | ✅ |

---

## N–S — Revenue & recovery

| | Deliverable | Status |
|---|-------------|--------|
| **N** | No-show recovery — workflow + coach signals + waitlist | 🟡 (workflow + signals ✅; waitlist workflow exists) |
| **O** | Outbound — channel router, metering, audit | 🟡 |
| **P** | Policy graph — resolver + packs | 🟡 |
| **Q** | Quality — eval traces on staff tools + public book tools | ✅ |
| **R** | Release sweep — Block R in v3 program | 🟡 (process; not automated in CI) |
| **S** | Staff shifts / rota — web+mobile | 🟡 |

---

## T–Z — Scale & enterprise

| | Deliverable | Status |
|---|-------------|--------|
| **T** | Tool catalog DB + per-tenant overrides UI (Settings → Liv) | ✅ |
| **U** | Usage & billing — Stripe + metering | 🟡 |
| **V** | Voice — sessions + digest | 🟡 (🔒 eval gate for marketing claims) |
| **W** | Web/mobile parity matrix — memory, tools, inbox, timeline | ✅ |
| **X** | Cross-tenant boundaries — partner scopes, no PII cross-tenant | 🟡 |
| **Y** | Workflows — Inngest library (briefing, continuity, rent, class, …) | ✅ |
| **Z** | Zero-trust demo — personas, reprovision, Liv briefings+memory seed | ✅ |

---

## Beyond Z

| Codename | Status | Notes |
|----------|--------|-------|
| **Ω** | 🟡 | Needs: voice eval gate, full medspa counsel, enterprise SSO marketing honesty |
| **∞** | ⬜ | Partner OAuth brokers at scale |

---

## What “complete in full” means now

**Production-complete for design partners:** A–G, H, K, M, Q, T, Y, Z + core of E, C, D.

**Still honest partial:** settings depth (mobile), enterprise SOC2 marketing, medspa legal per market (counsel gate).

**Run after pull:**

```bash
pnpm db:migrate:sql && pnpm db:push   # through 018
pnpm demo:provision   # API running — full demo world
pnpm exec tsc -b lib/liv-runtime lib/db
# restart API, reprovision demo
```

Update this table when a letter moves.
