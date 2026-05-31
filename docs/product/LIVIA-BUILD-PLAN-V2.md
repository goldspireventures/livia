# Livia build plan v2 — doc-gated full rebuild

**Status:** **BUILD ACTIVE** (2026-05-31) — G-DOC founder sign-off received  
**Supersedes execution order in:** [`LIVIA-FINAL-BUILD-PLAN.md`](./LIVIA-FINAL-BUILD-PLAN.md) for phased delivery after G-DOC gate (passed 2026-05-31).
**Authority:** Category + UX + systems specs written in doc sprint; then this plan becomes build authority alongside FINAL-BUILD locks.

**Reads with:** [`LIVIA-DOCUMENTATION-PROGRAM.md`](./LIVIA-DOCUMENTATION-PROGRAM.md) · [`PEOPLE-BUSINESS-CATEGORY-MANIFESTO.md`](./PEOPLE-BUSINESS-CATEGORY-MANIFESTO.md) · [`UI-UX-MASTER-PROGRAM.md`](../design/UI-UX-MASTER-PROGRAM.md)

---

## 0. Build pause declaration

**~~Engineering feature work is paused~~** — **G-DOC gate passed 2026-05-31.** Build authority is this plan + [`LIVIA-FINAL-BUILD-PLAN.md`](./LIVIA-FINAL-BUILD-PLAN.md).

**During doc sprint (complete):** doc writing, design screen cards, audits, demo seed improvements.

**Rebuild stance:** Prefer **rewriting thin surfaces** against new specs over layering patches. Kernel/API may stay; **W4/W5 presentation layer** may be rebuilt freely.

---

## 1. What changed (why v2)

| Before | After |
|--------|-------|
| Salon-origin story | **People-business OS** category |
| Hair wedge = product shape | Hair = **GTM proof only** |
| Docs “complete for beta” | **Full L2/L3 grid** before build |
| UI follows API | **UI-UX master program** leads |
| `/b` customization unclear | [`SKIN-BRAND-INHERITANCE-SPEC.md`](../design/SKIN-BRAND-INHERITANCE-SPEC.md) |
| Systems discovered ad hoc | [`SYSTEMS-COMPLETENESS-AUDIT.md`](./SYSTEMS-COMPLETENESS-AUDIT.md) |
| Thin demo | [`DEMO-WORLD-LIVE-SPEC.md`](./DEMO-WORLD-LIVE-SPEC.md) |

---

## 2. Build phases (after G-DOC)

### Phase 0 — Foundation verify (1 week) ✅ 2026-05-31

- [x] Policy hub: no salon hardcode audit — [`platform-surface-registry.test.ts`](../../lib/policy/src/__tests__/platform-surface-registry.test.ts)
- [x] `guest-surfaces.ts` registry complete — [`GUEST-SURFACES-AUDIT.md`](../engineering/GUEST-SURFACES-AUDIT.md)
- [x] `surfaceId` on all P0 guest + tenant routes — [`platform-surface-registry.ts`](../../lib/policy/src/platform-surface-registry.ts)
- [x] OpenAPI ↔ screen card traceability — P0 openapiPaths in registry + test

### Phase 1 — W5 guest `/b` mobile-first rebuild (2–3 weeks) ✅ 2026-05-31

**SKIN spec §9 checklist (triaged here — G-DOC-6):**

- [x] `GET /me/tenant-experience` exposes `publicPreviewUrl` + preset id
- [x] Settings → Public appearance with `/b` mobile frame (390×844 iframe)
- [x] Policy validator: preset cannot drop mandatory vertical gates on `/b`
- [x] E2E: `preset-public-parity.spec.ts` — accent → `--brand-accent` on `/b`
- [x] Motion partial: logo-enter, glow-success, liv-pulse tokens in CSS
- [x] `/b` storefront shell per `w5.public.book.mobile` (sticky header, hero, 72px service rows, Liv bar, policy footer)
- [x] Guest proof page per `w5.public.proof.mobile` (dark studio shell, sticky approve/actions)
- [x] Guest visit hub per `w5.public.visit.mobile` (hero time card, prep bullets, running late bar)
- [x] PWA manifest API + client hook (`VITE_PUBLIC_PWA_ENABLED`, confirm-step hint)
- [x] Guest intake page per `w5.public.intake.mobile` (clinical shell, contraindications, sticky submit)
- [x] In-book medspa consent step polish (scrollable procedure block, accessible checkboxes)
- [x] Guest hub visual (R2) per GUEST-CONTINUITY-HUB-SPEC → Phase 5 ✅

### Phase 2 — W4 tenant experience (3–4 weeks) ✅ 2026-05-31

- [x] Owner `/dashboard` home ritual per `w4.owner.dashboard.web` (greeting, Liv briefing strip, 4 KPIs, inbox + pending modules)
- [x] Staff `/my-day` ritual per `w4.staff.my-day.mobile` (hero next client, timeline, sticky quick actions)
- [x] Inbox three-pane per `w4.ops.inbox.web` (320px thread list, conversation, 280px context rail, handoff banner, Liv bubbles)
- [x] Platform Default polish **then** preset Phase 0
- [x] Persona home rituals (staff, founder)
- [x] In-app notification centre UX complete
- [x] WEB-MOBILE-PARITY P0 routes

### Phase 3 — Gateway + marketing (2 weeks) ✅ 2026-05-31

- [x] G1-A wedge interstitial all verticals
- [x] M1-R2 marketing story scroll
- [x] Demo narrative non-hair-first

### Phase 4 — Liv depth (ongoing) ✅ 2026-05-31

- [x] Tool registry expansion per LIV-OS (`liv-tool-matrix.ts`, drift tools in registry)
- [x] Voice character path (`liv-voice-character.ts` + prompt modality blocks)
- [x] Drift recovery workflows (`customer-drift.service`, dashboard card, Liv tools)

### Phase 5 — W6 guest hub (R2) ✅ 2026-05-31

- [x] `my.livia-hq.com` per GUEST-CONTINUITY-HUB-SPEC — hub shell, hero upcoming, Liv strip, 48px shop logos

### Phase 6 — Internal ops (parallel R2) ✅ 2026-05-31

- [x] Thread Context pane + registry (`SupportThreadContextPane`, canonical surfaceId + Liv tool matrix)

---

## 3. Rebuild vs keep matrix

| Layer | Keep | Rebuild |
|-------|------|---------|
| Postgres schema | Mostly keep | Resource types, voucher ledger when spec’d |
| OpenAPI kernel | Keep | Add missing guest endpoints |
| `@workspace/policy` | Keep + extend | guest-surfaces, notification events |
| Dashboard routes | Keep structure | **UI components** per screen cards |
| Mobile app | Keep navigation shell | **Screens** per parity matrix |
| Marketing site | Partial keep | M1-R2 implementation |
| Demo seeds | Extend | Depth per DEMO-WORLD-LIVE-SPEC |

---

## 4. Release alignment

Still use [`PLATFORM-RELEASE-PROGRAM.md`](./PLATFORM-RELEASE-PROGRAM.md) R1/R2/R3 — v2 phases map:

| Release | v2 phases |
|---------|-----------|
| R1 | 0, 1, 2 (partial), 3 |
| R2 | 2 (complete), 5, 6 |
| R3 | Preset parade, storefront depth, custom domain |

---

## 5. Exit criteria (build resumes)

All **G-DOC** + **G-UX-1..7** gates green (see documentation program).

Founder sign-off row in documentation program §6.

---

## 6. Changelog

| Date | Change |
|------|--------|
| 2026-05-31 | R2 wave 16 — CI guest-token API suite, waitlist accept page + demo token, registry `w5.waitlist-accept` |
| 2026-05-31 | R2 wave — guest deposit Stripe Checkout, pay page sticky CTA, guest-hub/pay e2e |
| 2026-05-31 | Phases 4–6 — Liv drift/voice/matrix, W6 guest hub polish, I4-A thread context pane |
| 2026-05-31 | Phase 3 — G1-A wedge grid primary, M1-R2 story spine, non-hair-first demo GTM |
| 2026-05-31 | Phase 2 start — owner dashboard home ritual (w4.owner.dashboard.web) |
| 2026-05-31 | Phase 1 complete — guest `/b` surfaces + intake |
| 2026-05-31 | Phase 1 guest proof + visit rebuild + PWA manifest hook |
| 2026-05-31 | Phase 1 `/b` storefront — screen card w5.public.book.mobile shell |
| 2026-05-31 | Phase 0 complete — platform-surface-registry + support-points P0 |
| 2026-05-31 | Build plan v2 draft — pause, rebuild stance, phased after doc gate |
