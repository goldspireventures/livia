# G-DOC founder sign-off packet

**Date:** 2026-05-31  
**Purpose:** Single-page approval to close **G-DOC-8** and resume build under [`LIVIA-BUILD-PLAN-V2.md`](./LIVIA-BUILD-PLAN-V2.md).

**How to sign:** Reply in chat with **“G-DOC approved”** (or list exceptions). This row updates §6 in [`LIVIA-DOCUMENTATION-PROGRAM.md`](./LIVIA-DOCUMENTATION-PROGRAM.md).

---

## 1. What you are approving

| Area | Verdict | Evidence |
|------|---------|----------|
| **Category** | People-business OS — not salon-only product | [`PEOPLE-BUSINESS-CATEGORY-MANIFESTO.md`](./PEOPLE-BUSINESS-CATEGORY-MANIFESTO.md), alignment + positioning |
| **Build authority after gate** | [`LIVIA-BUILD-PLAN-V2.md`](./LIVIA-BUILD-PLAN-V2.md) + [`LIVIA-FINAL-BUILD-PLAN.md`](./LIVIA-FINAL-BUILD-PLAN.md) locks | Pause lifts; v2 phases 0–6 |
| **UX / skins** | UI-UX master + 73 screen cards; premium motion spec | [`UI-UX-MASTER-PROGRAM.md`](../design/UI-UX-MASTER-PROGRAM.md), [`PREMIUM-MOTION-LAYER.md`](../design/PREMIUM-MOTION-LAYER.md) |
| **Systems** | P0/P1 specs complete; systems audit clean | [`SYSTEMS-COMPLETENESS-AUDIT.md`](./SYSTEMS-COMPLETENESS-AUDIT.md), Phase C specs |
| **Demo narrative** | Live-day depth + E2E proof | [`DEMO-WORLD-LIVE-SPEC.md`](./DEMO-WORLD-LIVE-SPEC.md), `demo-live-day` + `demo-proof-token` specs |
| **Vertical fairness** | 9 playbooks + public flows; non-hair demo paths | `docs/product/public-flows/` |
| **GTM truth** | Marketing/pricing/sales-motion aligned | Phase G docs |
| **Engineering clarity** | Atlas + code clarity standards for internal dev | [`CODE-CLARITY-STANDARDS.md`](../engineering/CODE-CLARITY-STANDARDS.md), [`ATLAS-INTEGRATION-GUIDE.md`](../engineering/ATLAS-INTEGRATION-GUIDE.md) |

---

## 2. Known open items (non-blocking for build start)

| Item | Owner | Notes |
|------|-------|-------|
| Full 418-file doc audit | Agent + founder spot-check | ~35% line pass; Tier 1 ✅ |
| G-UX-2..7 implementation gates | Engineering during build | P0 cards ✅; ship with surfaces |
| Figma frames for 6 P0 screens without northstar | Design session | See [`G-VISUAL-NORTHSTAR-MAP.md`](../design/G-VISUAL-NORTHSTAR-MAP.md) |
| `visual-screen-p0.spec.ts` | Engineering | After PNG baselines land |
| Historical `livia.io` refs in ADRs | Agent cleanup | Canonical docs → `livia-hq.com` |

---

## 3. Explicit decisions (confirm or override)

1. **Hair wedge** remains GTM proof only — product shape is vertical-agnostic people-business OS. **Default: yes**
2. **Rebuild stance:** W4/W5 presentation may be rewritten against screen cards; kernel/API stays. **Default: yes**
3. **Demo in production:** off unless `LIVIA_DEMO_ENABLED`. **Default: yes**
4. **Premium motion:** subtle pulse/glow from app open — not carnival UI ([`PREMIUM-MOTION-LAYER.md`](../design/PREMIUM-MOTION-LAYER.md)). **Default: yes**
5. **Build resumes** when this sign-off + G-VISUAL northstar/PNG map complete (Figma file URL optional for v1). **Default: yes**

---

## 4. Sign-off table

| Role | Responsibility | Sign | Date |
|------|----------------|------|------|
| **Founder** | Category, scope, demo narrative, G-DOC | ✅ | 2026-05-31 |
| Product | Flows, vertical fairness, screen priority | ✅ (founder proxy) | 2026-05-31 |
| Design | L3 cards, motion, preset/`/b` parity | ✅ (founder proxy) | 2026-05-31 |
| Engineering | L4 traceability, systems audit | ✅ (founder proxy) | 2026-05-31 |
| GTM | Marketing truth, non-hair demo | ✅ (founder proxy) | 2026-05-31 |

**Minimum to lift pause:** Founder row ✅ + G-VISUAL P0 baselines mapped.

---

## 5. After approval ✅ (2026-05-31)

1. ~~Update `LIVIA-DOCUMENTATION-PROGRAM.md` §5 G-DOC-8 → ✅~~  
2. ~~Update `LIVIA-BUILD-PLAN-V2.md` status: **BUILD ACTIVE**~~  
3. ~~Update `START-HERE.md` — remove pause banner~~  
4. **Next:** Phase 0 foundation verify (BUILD-PLAN-V2 §2)
