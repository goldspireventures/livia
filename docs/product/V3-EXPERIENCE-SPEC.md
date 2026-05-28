# v3 experience spec — alive, fluid, whole-product

**Status:** Active (2026-05-22)  
**Builds on:** [`LIVIA-EXPERIENCE-DESIGN-BIBLE.md`](./LIVIA-EXPERIENCE-DESIGN-BIBLE.md) (screen depth), [`PERSONA-UX.md`](./PERSONA-UX.md) (rituals)  
**Scenarios:** [`V3-REAL-WORLD-SCENARIOS.md`](./V3-REAL-WORLD-SCENARIOS.md)  
**Program:** [`V3-EXECUTION-PROGRAM.md`](./V3-EXECUTION-PROGRAM.md) Blocks M, N

---

## North star (one sentence)

Every surface should feel like **one colleague** handled the journey — not seven apps stitched with email — with motion, copy, and channel choice that respect the human on the other side.

---

## What “alive” means (non-negotiable qualities)

| Quality | Definition | Anti-pattern |
|---------|------------|--------------|
| **Fluid** | Transitions explain where you came from; back always works; no full-page flash on small state changes | Hard reload between steps |
| **Smooth** | 60fps on primary paths; skeletons match final layout; optimistic UI where safe | Spinner on whole page for 200ms API |
| **Responsive** | `dvh` safe areas; thumb zones on mobile; inbox/booking usable on 320px | Desktop-only density on `/b` |
| **Animated** | Purposeful motion (confirm, handoff, alert) — not decoration | Parallax for parallax’s sake |
| **Alive** | Liv “breathes” — typing indicator, pulse on pending approval, timeline updates without refresh | Static dashboard until manual refresh |
| **Real** | Copy names the actual stylist, shop, policy window; timezone shown in local words | “Your appointment” with no who/when/where |

**Accessibility:** All celebration motion/sound respects `prefers-reduced-motion` and explicit opt-out (already started on public booking confirm).

---

## Motion system (shared tokens — v3 ships)

### Web (dashboard, public `/b`, livia.io, internal)

| Token | Use |
|-------|-----|
| `enter-page` | `animate-in fade-in slide-in-from-bottom-4 duration-500` — ritual pages |
| `enter-panel` | `slide-in-from-right-4 duration-300` — wizard steps |
| `pending-overlay` | Blur + centered spinner on destructive/slow actions |
| `success-beat` | Shimmer + optional chime (public confirm) — **one beat per flow** |
| `liv-thinking` | Subtle pulse on Liv assist / command hub when request in flight |
| `stagger-list` | Booking cards, inbox threads — 40ms stagger cap 8 items |

### Mobile (Expo)

| Token | Use |
|-------|-----|
| `SPRING_GENTLE` | Card press, sheet open (existing `constants/motion.ts`) |
| `haptic-light` | Confirm booking, approve, send |
| `haptic-warning` | Policy violation, slot lost |
| Shared **reduced motion** flag from system settings |

### Marketing (livia.io)

| Token | Use |
|-------|-----|
| Framer hero | Aurora blobs — **marketing only**, not copied into ops UI |
| Scroll-linked CTA | Subtle; never block content |
| “Try booking” demo | Links to real `/b` demo slug — same confirm beat as prod |

### Internal portal

| Token | Use |
|-------|-----|
| Minimal | Data-dense; motion only for trace replay scrubber and incident state change |

**Deliverable M1.1:** `docs/design/motion-tokens.md` + shared CSS module / RN constants re-exported from one table.

---

## Per-surface experience contract (v3)

Each row is a **release sweep obligation** when that surface ships customer-facing change.

### 1. Public `/b/{slug}` — customer ritual

**Job:** Book in &lt;90s; leave knowing exactly what happens next.

| Step | Experience |
|------|------------|
| Land | Shop name, vertical vocabulary, disclosure footer (locale pack) |
| Service | Cards with duration + price; hair vs medspa copy from pack |
| Slot | Real availability; lost slot → gentle rewind, not error wall |
| Details | Email **or** phone; notes for preferences |
| Confirm | Celebration beat + **Next steps panel** (see Block N) |
| After | Deep link to preferred channel thread — not “DM us on IG” as orphan step |

**v3 adds:** Style/intake attachment prompt on confirm (optional); deposit/policy inline; Liv chat bubble on same page post-book.

### 2. Dashboard — operator ritual

**Job:** Owner/manager/staff never hunt for “what broke since I left.”

| Area | Experience |
|------|------------|
| Home | Persona ritual header + Liv line that references **today’s real counts** |
| Inbox | Unified thread preview; channel badge (SMS, IG, WA, web); one-tap Approve |
| Booking detail | **Continuity timeline** — web book → auto SMS → IG link opened → pics attached |
| Toolkit | Payroll export, channel health, “fix my booking flow” wizard |
| Settings | Social handles wired to **continuity templates**, not decorative fields |

**v3 adds:** Command hub expands to “channel health” + “stuck bookings” (booked web, no thread reply in 24h).

### 3. Mobile — floor ritual

**Job:** Pocket-first for chair, rota, approvals.

| Area | Experience |
|------|------------|
| My Day | Next client card with **last message snippet** and attachment thumbs |
| Bookings | Swipe actions; haptic confirm |
| Inbox | Push → deep link thread |
| Rota | Native create (E5) with same motion tokens |

**v3 adds:** “Reply as stylist” opens canonical thread (SMS/WA), not raw IG app unless owner chose IG-native handoff.

### 4. livia.io — trust ritual

**Job:** Marketing promise = first `/b` screen promise.

| Area | Experience |
|------|------------|
| Hero | Alive aurora; CTA to demo book |
| Vertical pages | Hair, medspa, fitness — each shows **real confirm + next steps** screenshot/video |
| DE | Impressum, honest voice eval status |
| Social proof | “Book on Instagram → confirmed in one thread” story (when Block N live) |

### 5. API + Liv runtime — invisible ritual

**Job:** Every outbound message is policy-checked, threaded, metered.

| Area | Experience |
|------|------------|
| Events | `BOOKING_CREATED` triggers continuity workflow |
| Channels | Router picks SMS/WA/email; IG via Meta API or deep-link fallback |
| Liv | Suggests reply templates from vertical pack; never invents policy |

### 6. Internal — ops ritual

**Job:** Support sees one booking story without asking eng.

| Area | Experience |
|------|------------|
| Trace | Channel sends + handoff steps on one timeline |
| Impersonation | Read-only default; write needs reason |

### 7. Policy / packs — soul ritual

**Job:** Locale + vertical change **copy, money, holidays, continuity templates** together.

| Pack | Experience lever |
|------|------------------|
| `de-DE` | Formal Sie/du config; EUR; DE holidays |
| `medspa` | Consent step UI + calmer motion (less “champagne”) |
| `hair` | Style reference prompt on confirm |

---

## Emotional beats (scripted moments)

| Beat | Trigger | Surface | Motion/sound |
|------|---------|---------|--------------|
| **Booked** | Public confirm | `/b` | Shimmer + optional chime |
| **Handoff sent** | Continuity workflow fires | SMS/WA to customer | Short tick haptic (mobile staff preview) |
| **Thread linked** | Customer opened deep link / replied | Inbox | Thread row highlight |
| **Needs you** | Liv confidence &lt; threshold | Inbox + push | Amber pulse on ritual header |
| **Approved** | Manager approves | Dashboard/mobile | Green check spring |
| **No-show risk** | T−2h no confirm reply | Owner briefing | Liv line, not alarm banner spam |
| **Paid policy** | Deposit captured | Confirm + email | Matter-of-fact, not celebratory |

Medspa beats use **calm** variants (no champagne).

---

## Density & performance bar

- LCP on `/b` &lt; 2.5s on 4G (IE).
- Inbox thread list virtualized &gt; 50 rows.
- No layout shift on slot pick (skeleton height = slot row height).
- Images: WebP, max 1200px long edge for style refs.

---

## v3 experience deliverables (Block M)

| ID | Work | Exit |
|----|------|------|
| M1.1 | Motion token doc + shared constants | All apps import |
| M1.2 | Public booking **Next steps** panel + continuity CTA | E2E |
| M1.3 | Inbox unified thread UI (channel badges, attachments) | Manager ritual |
| M1.4 | Booking detail continuity timeline | API events wired |
| M1.5 | Mobile parity: haptics + stagger lists | E5 + inbox |
| M1.6 | livia.io vertical demos match `/b` confirm UX | marketing-vs-reality |
| M1.7 | Reduced-motion + sound audit all surfaces | WCAG script extended |
| M1.8 | DE + medspa visual tone variants | Pack-driven CSS vars |

---

## Acceptance (experience slice of v3 ship)

1. Design partner can complete **web book → SMS thread → optional style photo** without Instagram DM (IG optional path documented).
2. Founder/owner demo path shows **different motion/copy** for hair vs medspa on same codebase.
3. Every prod release includes experience sweep row (Block R) — motion regression spot-check on `/b` + inbox.
