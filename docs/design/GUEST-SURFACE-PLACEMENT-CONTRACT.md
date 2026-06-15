# Guest surface placement contract

**Status:** canonical (2026-06-15)  
**Audience:** product, design, engineering  
**Purpose:** Stop “bang it on the page” regressions on guest flows. Every element must earn its place — placement, density, and audience (`/b` anonymous vs `/my` authenticated) are part of the spec, not polish.

**Reads with:** [`UI-UX-MASTER-PROGRAM.md`](./UI-UX-MASTER-PROGRAM.md) · [`PUBLIC-B-SURFACE-SPEC.md`](../product/PUBLIC-B-SURFACE-SPEC.md) · [`GUEST-CONTINUITY-HUB-SPEC.md`](../product/GUEST-CONTINUITY-HUB-SPEC.md) · [`LIV-OPERATING-SYSTEM.md`](../product/LIV-OPERATING-SYSTEM.md) §16

---

## 0. North star

> **Known guests feel remembered; unknown guests feel guided — neither feels lectured.**

Guests should never see UI that explains a state they are already in, duplicate money breakdowns, or CTAs for a product they are already using.

---

## 1. Audience matrix (non-negotiable)

| Surface | Who | Identity | What they must never see |
|---------|-----|----------|---------------------------|
| **`/book/{slug}`** (anonymous) | First-time or casual guest | None or phone-only | My Livia upsell after they are signed in |
| **`/book/{slug}?hub=1`** or vault token | My Livia rebook | `X-Guest-Hub-Token` | “Signed in with My Livia” banner; “Save to My Livia” checkbox |
| **`/my`** | Vault home | OTP session | Tenant owner chrome; per-shop book CTAs duplicated on every row |
| **`/my/{slug}`** | Shop relationship | Vault + shop link | Anonymous-only onboarding copy |
| **`/my/{slug}/visit/{id}`** | Visit manage | Vault + booking | Second deposit card if summary already shows pay line |
| **Public `/b/{slug}`** | Marketing storefront | Anonymous | Authenticated-only shortcuts without sign-in path |

**Rule:** Resolve audience once at page load (`readGuestHubToken()`, `hub=1`, route prefix). Branch copy and CTAs from that — do not render both branches and hide with CSS.

---

## 2. Placement principles

### 2.1 Silent when known

If the system already has the data (hub profile, patch test on file, deposit policy), **prefill or enforce in the backend** — do not announce it in a hero card.

| State | Wrong | Right |
|-------|-------|-------|
| Hub autofill | Banner: “Signed in — details filled in” | Fields prefilled; user edits if needed |
| Patch test valid | Blocker copy on every step | Guard pre-answered; at most one line in guards section |
| Returning guest | “Welcome back” wall of text | One line in guard area only when action needed |

### 2.2 One home for money

Price, deposit, and balance due appear in **one summary surface** per step — typically the booking summary card at the bottom of the form.

| Element | Placement | Never |
|---------|-----------|-------|
| Service total | Summary card | Duplicate in top banner |
| Deposit due now | Summary card breakdown | Separate amber card above the form |
| Balance at visit | Summary card breakdown | Inline in three places |
| Pay deposit CTA | Confirm step / visit manage | Mid-wizard unless blocking progress |

Mobile: sticky bar shows **deposit due** (not full total only) when deposits apply; full breakdown stays in the summary card above the fold scroll.

### 2.3 Errors belong on the right step

| Error type | Step | Presentation |
|------------|------|----------------|
| Patch test required | **Services** (block early) | Left-border hint + “Book patch test” — not red slab on time picker |
| Slot gone | **Time** | Compact inline under date |
| Validation (name/phone) | **Details** | Above submit, below fields |
| API fault | Same step | Human message only — strip `HTTP 4xx` and `(ref …)` |

Use `parsePublicApiError()` in dashboard guest flows; never surface raw client error strings.

### 2.4 One CTA per intent

| Intent | Single home |
|--------|-------------|
| Continue booking | Primary button on step or sticky bar |
| Save relationship | “Save to My Livia” — **anonymous `/book` only** |
| Pay deposit | Confirm screen or visit manage |
| Open vault | `/my` entry from confirm — not mid-details |

### 2.5 Density budget

Guest book wizard steps target **one focal column** (`max-w-xl`). No more than **one** informational callout per step (excluding field-level labels). If you need two callouts, merge or move one to policy footer.

---

## 3. Implementation hooks (repo)

| Concern | Location |
|---------|----------|
| Hub session / rebook detection | `artifacts/livia-dashboard/src/lib/guest-hub-session.ts` |
| API error cleanup | `artifacts/livia-dashboard/src/lib/public-booking-helpers.ts` → `parsePublicApiError` |
| Booking summary + deposit | `public-booking-summary-card.tsx` |
| Book flow orchestration | `public-booking.tsx` |
| Deposit policy | `lib/policy/src/operational-policy.ts` |
| Patch test gate | `lib/policy/src/beauty-booking-rules.ts` |

**Build rule:** Any PR touching guest book/hub must answer the checklist in §5 before merge.

---

## 4. Liv / JARVIS on guest surfaces (Era 1)

Liv on `/book` and `/my` is **reactive chat + policy copy** today — not autonomous policy mutation.

| Capability | Era 1 | Later (mandate-gated) |
|------------|-------|------------------------|
| Answer FAQs | Yes (chat widget) | Same |
| Suggest patch test booking | Copy only | Tool `book_slot` at R3+ |
| Waive deposit | **Never auto** — `waive_deposit` ∉ rung auto lists | Owner approve at R4+ with cap |
| Change deposit % | Owner settings only | Liv propose at R2+ |
| Learn from strikes | Background tracking only | Suggest trust tier — owner confirms |

See [`LIV-OPERATING-SYSTEM.md`](../product/LIV-OPERATING-SYSTEM.md) §16 for mandate ladder.

---

## 5. Pre-merge checklist (guest P0)

Engineers and agents tick mentally before claiming done:

- [ ] Audience resolved — hub vs anonymous branches are exclusive
- [ ] No banner announcing autofill or sign-in state
- [ ] Money in one summary card; deposit breakdown inline
- [ ] Errors human-readable; patch-test gates on services step
- [ ] Mobile sticky bar consistent with deposit policy
- [ ] Policy copy from `@workspace/policy` / tenant-experience — not hardcoded salon strings
- [ ] Mobile app parity checked if web guest flow changed

---

## 6. Surface audit registry (post–Phase 2 sweep)

Systematic pass — **one surface per session**, screenshot + sign-off. Order: guest revenue path first.

| Phase | Surface | Route / component | Owner | Status |
|-------|---------|-------------------|-------|--------|
| **P0a** | Public book wizard | `/book/{slug}` · `public-booking.tsx` | — | **2026-06-15** — deposit in summary; hub silent; patch-test gate |
| **P0b** | Book confirm + pay | confirm step · `public-pay.tsx` | — | **2026-06-15** — shared `GuestMoneyBreakdown`; deposit in confirm card |
| **P0c** | My Livia home | `/my` · `my-livia.tsx` | — | **2026-06-15** — one CTA per shop row (manage or book) |
| **P0d** | Shop relationship | `/my/{slug}` | — | **2026-06-15** — slim memory line; Liv in sidebar; single primary CTA |
| **P0e** | Visit manage | `/my/{slug}/visit/{id}` | — | **2026-06-15** — `GuestVisitSummaryCard`; hero time-only |
| **P1a** | Public storefront `/b` | `public-shop.tsx` | — | Queued |
| **P1b** | Public enquire / consult-first | event-vendor surfaces | — | Queued |
| **P2** | Gateway G1–G3 | demo launcher | — | Queued |
| **P3** | Owner guest callouts | dashboard customer panels | — | Queued |

**Sign-off:** Founder marks **Pass** / **Fail + note** in [`testing/VISUAL-AUDIT-LOG.md`](../testing/VISUAL-AUDIT-LOG.md). Failures become targeted fixes — not blanket sweeps.

**Automation:** Extend `pnpm visual:audit` / E2E guest specs per row as surfaces pass manual audit.

---

## 7. When docs change

| Change | Update |
|--------|--------|
| New guest route | This registry + `platform-surface-registry.ts` |
| New guest CTA pattern | §1 matrix + §2.4 |
| Liv tool affecting guest | `LIV-OPERATING-SYSTEM.md` §16 + mandate tests |

---

*Placement is product logic. If it needs a sweep to remove, it should not have shipped.*
