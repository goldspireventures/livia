# UI/UX master program — alive, vertical-fair, device-native

**Status:** canonical (2026-05-31)  
**Audience:** founder, product, design, engineering  
**Purpose:** Single **exhaustive** UX authority — how every Livia surface should look, feel, move, and read across **web, tablet, mobile**; per **world (W1–W6)**, **vertical**, and **persona**; so product in hand matches company ambition.

**Build pause:** Implementation follows this program + screen cards (L3). No cosmetic patch work on orphan routes.

**Reads with:** [`V3-EXPERIENCE-SPEC.md`](../product/V3-EXPERIENCE-SPEC.md) · [`EXPERIENCE-ARCHITECTURE.md`](./EXPERIENCE-ARCHITECTURE.md) · [`SKIN-BRAND-INHERITANCE-SPEC.md`](./SKIN-BRAND-INHERITANCE-SPEC.md) · [`PERSONA-VERTICAL-SURFACE-MATRIX.md`](./PERSONA-VERTICAL-SURFACE-MATRIX.md) · [`MOBILE-UX-PRINCIPLES.md`](./MOBILE-UX-PRINCIPLES.md) · [`motion-tokens.md`](./motion-tokens.md) · [`PREMIUM-MOTION-LAYER.md`](./PREMIUM-MOTION-LAYER.md)

---

## 0. North star

> **Every surface feels like one colleague handled the journey** — alive where it helps, calm where it matters, bold only when the user must decide.

**UX enemy:** CRUD browser, sidebar of entities, desktop-shrunk-to-mobile, generic “powered by” chrome, salon-default copy on physio screens.

**UX goal:** Same kernel; **different keys** (hotel principle). Motion with purpose. Copy that names real people and policies. Vertical-soft vs vertical-bold applied deliberately.

---

## 1. Qualities (non-negotiable)

| Quality | Definition | Test |
|---------|------------|------|
| **Alive** | Pending states breathe — Liv thinking pulse, inbox updates, timeline without full reload | Disable JS — graceful degrade |
| **Fluid** | Transitions explain origin; back works; wizard state preserved | No white flash between steps |
| **Responsive** | 320px → ultrawide; thumb zones; `dvh` safe areas | `/b` on iPhone SE |
| **Vertical-fair** | Medspa feels clinical-calm; tattoo feels studio-bold; wellness soft | Hair screen ≠ default template |
| **Persona-minimal** | Staff sees my chair; owner sees briefing; founder sees rollup | No hidden OWNER nav on staff |
| **Brand-forward (W5)** | Business logo > Livia mark | P7 never confused which shop |
| **Accessible** | WCAG 2.2 AA target; reduced motion; 44px targets | axe on `/b` + dashboard |
| **Honest** | UI density doesn’t imply unshipped features | Tier badges on demos |

---

## 2. Device & breakpoint contract

Source: [`SURFACE-AND-BREAKPOINTS.md`](./SURFACE-AND-BREAKPOINTS.md)

| Surface | Phone | Tablet | Desktop |
|---------|-------|--------|---------|
| **W5 `/b`** | **Primary** — design here first | Enhanced layout, same flow | Centered column max-width |
| **W4 mobile app** | **Primary** for staff | Split view where useful | N/A (web dashboard) |
| **W4 dashboard** | Usable (inbox, approve) | Comfortable ops | Full density |
| **W1 marketing** | Story scroll | Same | Hero density |
| **W3 internal** | Read-only emergency | Thread usable | Primary |

**P7 rule:** If it doesn’t work on phone, it’s not done.

---

## 3. Motion & interaction system

### 3.1 Principles

- Motion **explains state change**, not decor.
- **One success beat** per ritual (booking confirm, proof approved).
- **Stagger cap** 8 items — lists don’t waterfall forever.
- **Reduced motion** disables shimmer, parallax, haptics — not functionality.

### 3.2 Token catalog (extend [`motion-tokens.md`](./motion-tokens.md))

| Token | Web | Mobile | Use |
|-------|-----|--------|-----|
| `enter-page` | fade + slide up 500ms | screen push | Ritual entry |
| `enter-panel` | slide right 300ms | sheet spring | Wizard step |
| `exit-panel` | fade out 200ms | sheet dismiss | Back |
| `liv-thinking` | pulse border | subtle opacity | AI in flight |
| `pending-overlay` | blur + spinner | full-screen loader | Pay, book submit |
| `success-beat` | shimmer + optional chime | haptic success | Confirm only |
| `alert-in` | slide down strip | banner | New booking push |
| `stagger-list` | 40ms × n | 40ms × n | Inbox, today |
| `card-press` | scale 0.98 | spring | Tappable cards |
| `tab-switch` | crossfade 150ms | instant | Bottom tabs |

### 3.3 Haptics (mobile staff)

| Event | Haptic |
|-------|--------|
| Booking confirmed | light |
| Slot lost / policy block | warning |
| Message sent | light |
| Handoff accepted | medium |

### 3.4 Sound

- **Public booking confirm:** optional chime — off by default after first play; respects mute.
- **Nowhere else** in tenant ops unless founder reopens.

### 3.5 Premium delight (pulse / glow)

**Full spec:** [`PREMIUM-MOTION-LAYER.md`](./PREMIUM-MOTION-LAYER.md)

- **App open:** logo `logo-enter` once — mobile splash and marketing first paint.
- **Backgrounds:** `aurora-breathe` on W1/W2 only — never on W4 data tables.
- **Focus:** wedge card `halo-focus` on select — one pulse, not infinite.
- **Success:** single `glow-success` + `success-beat` per ritual.
- **Rule:** if unsure, leave it out — premium = restraint.

---

## 4. Visual tone per world

| World | Tone | Typography | Color |
|-------|------|------------|-------|
| W1 Marketing | Editorial, aspirational | Cormorant + sans | Aurora, champagne |
| W2 Gateway | Clear, welcoming | Same family | Aurora lite |
| W3 Internal | Dense, calm urgency | Sans mono accents | Ops amber |
| W4 Tenant | **Preset-driven** | Preset bundle | Preset + brand accent |
| W5 Public | **Brand-forward** | Preset + business feel | Logo-led; Liv invisible chrome |
| W6 Guest hub | Warm, personal | Soft sans | Platform guest palette |

---

## 5. Vertical UX personality (soft vs bold)

Each vertical has **UX posture** — not just vocabulary swap.

| Vertical | Soft (calm, space, reassurance) | Bold (decisive, high-contrast CTA) |
|----------|--------------------------------|-------------------------------------|
| **hair** | Rebook reminders, formula memory | Walk-in slot CTA Saturday |
| **beauty** | Aftercare, patch-test explain | Deposit/no-show policy |
| **wellness** | Intake, contraindications | Gift voucher redeem |
| **body-art** | Healing check-ins | Design proof approve/reject |
| **fitness** | PARQ intake | Waitlist “spot open” |
| **medspa** | Consent copy, procedure info | **Never** treatment recommend |
| **allied-health** | Plan progress | Rebook against plan |
| **pet-grooming** | Pet temperament notes | Vaccination gate |
| **automotive-detailing** | Vehicle care tips | Package/bay selection |

**Implementation:** `verticalPackUi()` + presentation preset + screen cards — not one `DashboardLayout`.

---

## 6. Persona home rituals (W4)

| Persona | Home must answer | Primary action | Max nav items |
|---------|------------------|----------------|---------------|
| **P1 Founder** | Which shop needs me? | Chain rollup drill | 5 + switcher |
| **P2 Owner** | Is today OK? | Briefing + inbox | 5 |
| **P3 Manager** | What needs judgement? | Approval queue | 5 |
| **P4 Staff** | Who’s next? | My Day | **3** |
| **P6 Reception** | Floor + messages | Calendar + inbox | 4 |

Staff mobile: **tab bar max 4** — Today, Inbox (if role), Customers (scoped), More.

---

## 7. W5 `/b` UX program (P7)

### 7.1 Flow architecture

```text
Land (hero + trust) → Intent (service/staff) → Details (vertical steps) → Confirm → Next (wallet/visit token)
```

- **One primary CTA** per screen.
- Progress indicator on multi-step — never >5 steps without save.

### 7.2 Mobile entry (see skin spec)

- Responsive web **first**.
- R2: PWA add-to-home, wallet pass.
- SMS links open **directly** to step (deep link tokens).

### 7.3 Liv on `/b`

- Chat panel — collapsible; doesn’t obscure CTA.
- First message: AI disclosure.
- Typing indicator uses `liv-thinking` token.

### 7.4 Preset preview parity

Settings must show **live `/b` mobile frame** when changing preset/brand ([`SKIN-BRAND-INHERITANCE-SPEC.md`](./SKIN-BRAND-INHERITANCE-SPEC.md) §4.4).

---

## 8. Screen card program (L3)

**Target:** Full grid — not 6 P0 YAML.

| Priority | Count | Scope |
|----------|-------|-------|
| **P0** | 24 | Owner today, staff my day, `/b` book, proof, inbox, onboarding |
| **P1** | 48 | Manager queue, founder rollup, vertical hubs (medspa, body-art…) |
| **P2** | 60+ | Edge states, settings, guest hub, internal Thread |

**Screen card template** (each YAML):

```yaml
id: tenant.staff.my-day.mobile
world: W4
vertical: [hair, ...] # or all
persona: P4a
surface: mobile
job: "Know who's next without hunting"
states: [loading, empty, normal, error, offline]
copy:
  hero: "{clientName} at {time}"
motion: [enter-page, stagger-list]
acceptance:
  - Thumb reach primary action
  - Skeleton matches final layout
```

**Location:** `docs/design/screen-cards/` (create during doc sprint).

---

## 9. Empty, error, loading states

Every route in [`LIVIA-FULL-SURFACE-MAP.md`](../product/LIVIA-FULL-SURFACE-MAP.md) needs:

| State | Rule |
|-------|------|
| **Loading** | Skeleton matches layout — no generic spinner full page |
| **Empty** | One sentence job + one action (“Simulate live day”, “Add service”) |
| **Error** | Human copy + requestId for support + retry |
| **Permission** | Persona-aware — not generic 403 |

**Doc deliverable:** `EMPTY-ERROR-LOADING-CATALOG.md` (doc sprint item).

---

## 10. Marketing & company web (W1)

- **M1-R2** story scroll locked — motion serves narrative.
- Pricing **inherits** home skin (M2-A).
- Demo CTAs land on **non-hair** verticals in rotation (people-business story).
- “Try booking” uses real `/b` demo slug with same confirm beat as prod.

---

## 11. Internal ops UX (W3)

- Data-dense; minimal motion.
- Thread 3-column **layout shell** even if Context sparse (R1).
- Trace replay scrubber — only animated internal control.

---

## 12. Quality gates (before build resumes)

| Gate | Criteria |
|------|----------|
| G-UX-1 | P0 screen cards written (24) | ✅ |
| **G-UX-2** | Skin inheritance spec approved |
| **G-UX-3** | `/b` mobile viewport E2E screenshots vs northstar PNG |
| **G-UX-4** | Motion tokens implemented on book confirm + inbox |
| **G-UX-5** | Vertical UX personality table reflected in 3 demo `/b` pages |
| **G-UX-6** | No hardcoded “salon” in tenant UI copy audit pass |
| **G-UX-7** | Accessibility axe baseline on `/b` + dashboard home |

---

## 13. What’s wrong today (honest audit)

| Issue | Fix path |
|-------|----------|
| Dashboard feels one-size | Preset Phase 0 polish + vertical home modules |
| `/b` desktop-first in places | Reflow P0 flows mobile-first |
| Gateway wedge not built | G1-A doc + implementation |
| Staff mobile ≠ web parity | WEB-MOBILE-PARITY matrix close |
| Motion sparse outside public confirm | Apply token catalog §3.2 |
| Preset picker doesn’t preview `/b` | SKIN spec §4.4 engineering |
| Demo leads hair | DEMO-WORLD-LIVE-SPEC narrative |

---

## 14. Changelog

| Date | Change |
|------|--------|
| 2026-05-31 | §3.5 premium motion layer; PREMIUM-MOTION-LAYER cross-link |
| 2026-05-31 | Initial UI/UX master program — motion, vertical tone, screen card target |
