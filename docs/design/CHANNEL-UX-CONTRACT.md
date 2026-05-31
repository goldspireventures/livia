# Channel UX contract — M2 / M3 / M4 modalities

**Status:** canonical (2026-05-29)  
**Parent:** [`EXPERIENCE-ARCHITECTURE.md`](./EXPERIENCE-ARCHITECTURE.md)  
**Modality source:** [`../modality-and-locale-overview.md`](../modality-and-locale-overview.md)  
**Visual stack:** [`PRESENTATION-PRESETS-AND-ROLLOUT.md`](./PRESENTATION-PRESETS-AND-ROLLOUT.md) (M1 only)

---

## Part 0 — Scope

Presentation presets (`platform-default`, `body-art-studio-dark`, etc.) apply to **M1 visual surfaces**:

- Dashboard web (`artifacts/livia-dashboard`)
- Native mobile (`artifacts/livia-mobile`)
- Public booking + **guest collaboration** (`/b/{slug}`, `/b/{slug}/visit/{token}`, `/b/{slug}/proof/{token}`, …)
- Onboarding wizard (tenant)

They do **not** automatically style:

- SMS / WhatsApp / Instagram DMs (M2) — **thin transport only** ([Part 1b](#part-1b--thick-livia-vs-thin-channels-platform-wide))
- Inbound/outbound voice (M3)
- Owners who never open the app (M4 passive)

This document defines **channel-native UX rules** so Liv feels like one colleague across modalities.

**Platform flows (nested, complete toolkits):** [`LIVIA-PLATFORM-FLOWS.md`](../product/LIVIA-PLATFORM-FLOWS.md)

---

## Part 1b — Thick Livia vs thin channels (platform-wide)

**Founder lock (2026-05-29):** Channels are **not** collaboration surfaces for images, proofs, consent, or multi-step forms.

| Thick (M1 on Livia) | Thin (M2/M3/M4 off-platform) |
|---------------------|------------------------------|
| Book, chat, proof approve, consent sign, deposit UI, visit actions | Reminders, “open this link”, YES/LATE/CANCEL keywords, voice confirm |
| Customer = **guest token** or web session — **no login** | Customer = phone/email identity on thread |
| Business = dashboard/mobile inbox + vertical modules | Same thread visible in inbox; channel is pipe |

**Do not** design vertical hero workflows that depend on MMS or WhatsApp media loops. WhatsApp may carry **links** to guest pages; rich work happens on Livia.

See vertical guest matrix: [`LIVIA-PLATFORM-FLOWS.md`](../product/LIVIA-PLATFORM-FLOWS.md) §4.

---

## Part 1 — Modality summary

| Mod | Name | Primary personas | Latency budget | Preset CSS? |
|-----|------|------------------|----------------|-------------|
| M1 | Visual | P1–P6, P7 on `/b` | Page load <2s action | **Yes** |
| M2 | Conversational | P7, P4, P2b, P6 | Reply <2s typical | **No** — brand + locale |
| M3 | Voice | P7 callers, P2b indirect | First token ≤600ms | **No** — voice + disclosure |
| M4 | Passive | P2b no-app owner | Async | **No** — chat templates |

---

## Part 2 — M2 conversational rules

### 2.1 Shared invariants (all channels)

1. **Vocabulary** from `@workspace/policy` `businessVocabulary()` — never hardcode “stylist” on body-art (use **artist**).
2. **Liv disclosure** from jurisdiction pack `aiDisclosure` — SMS prefix, chat footer, first message.
3. **Continuity** — one thread per booking where policy mode is `sms_thread` / `whatsapp_thread` ([`V3-REAL-WORLD-SCENARIOS.md`](../product/V3-REAL-WORLD-SCENARIOS.md) Scenario 01).
4. **CT1–CT6 posture** from [`customer-typologies.md`](../customer-typologies.md) — copy only, not layout forks.
5. **Deep links** to `/b/{slug}` and booking artifacts (ICS, wallet pass) — slug stable across channels.

### 2.2 SMS

| Element | Rule |
|---------|------|
| Sender | Tenant Twilio number when live; else platform fallback with disclosure |
| Tone | Match `aiTone` on business row (FRIENDLY default); not preset shell |
| Length | IE GSM-7; split long messages; no markdown |
| Actions | Short URLs to **guest M1 pages** (`/b`, `/visit/{token}`, `/proof/{token}`) |
| Media | **Do not rely on MMS** for core workflows — link to Livia guest surface |
| Proof / deposit | Link to guest proof or pay page — not image attachment |

### 2.3 WhatsApp / Instagram (when BSP live)

| Element | Rule |
|---------|------|
| Templates | Versioned in `@workspace/policy` continuity templates per vertical |
| Media | **Not primary** for proof/consent collab — customer opens guest link |
| Notifications | “Design ready”, “Confirm appointment”, deposit link — text + URL |
| IG deep link | Pre-filled token or guest URL — not “send refs in DM” |
| Staff view | M1 inbox + vertical modules; M2 is transport only |

### 2.4 In-app chat (staff / owner assist)

| Element | Rule |
|---------|------|
| Chrome | Dashboard preset colours apply to **panel** embedding chat |
| Bubbles | Standard thread UI; Liv thinking = `liv-thinking` token |
| Tools | Liv tool registry — approve/dismiss on M1 surfaces |

### 2.5 WhatsApp Mode (P2b no-app owner pattern)

Explored in design session as **chat-primary owner shell** — not a CSS preset.

| Requirement | Implementation |
|-------------|----------------|
| Owner interacts via WA/SMS | M4 passive; no dashboard required |
| Liv sends daily close summary | Workflow + template |
| Approve refund / deposit | Reply buttons or short link to one-tap M1 page |
| Vocabulary + tone | Same as M2 rules |

**Do not** block no-app owners from wedge features — one-tap web links for irreversible actions.

---

## Part 3 — M3 voice rules

| Element | Rule |
|---------|------|
| Disclosure | Mandatory AI disclosure script per jurisdiction pack |
| Memory | Caller-id → known regular (CT2+) — tone match, no creep |
| Escalation | Human handoff when policy requires or Liv uncertain |
| Booking | Tool-calling to same kernel as M1 — no parallel calendar |
| After hours | Answers; captures intent; creates thread in M2 |

Voice UI is **not** skinned by presentation preset. Optional future: voice “character” per tenant in settings (separate from preset).

---

## Part 4 — M4 passive (no dashboard)

Common for **P2b working owner** ([`personas.md`](../personas.md)) — barber mid-cut, older owner.

| Capability | M4 delivery |
|------------|-------------|
| Morning briefing | SMS digest or voice note link |
| Approve cap refund | SMS link → one-tap approve page (minimal M1) |
| Close day | Quiet Ledger copy via SMS + link to 5-min close |
| Book recovery | Liv handles in M2; owner sees count in digest |

**Minimal M1 pages** for M4 links use **tenant brand** (logo, name) + **no preset picker** — single-purpose, mobile-first, 320px.

---

## Part 5 — Brand parity across M1 and M2

| Asset | M1 | M2 outbound |
|-------|-----|-------------|
| Business name | Ritual header, `/b` | SMS/WA template `{businessName}` |
| Logo | `/b`, email header | Email/HTML when Resend wired |
| Accent colour | Preset + `brandAccentHex` | Email button only; not SMS |
| Preset id | Full chrome | **Not applicable** — channel has no kanban |

**Brand shell (C13):** portfolio businesses may share preset per location but **different logos** per shell on `/b` and email.

---

## Part 6 — Locale packs

Country is **not** a preset ([`LIVIA-EXPERIENCE-DESIGN-BIBLE.md`](../product/LIVIA-EXPERIENCE-DESIGN-BIBLE.md)).

| Layer | Locale controls |
|-------|-----------------|
| M1 | Date/time format, `dvh`, deposit footer copy, GDPR block |
| M2 | SMS regulatory prefix, template language, opt-in |
| M3 | Disclosure script language |
| Compact phone | German/French string overflow — truncate with tooltip vs wrap (see EXPERIENCE-ARCHITECTURE Part 8) |

---

## Part 7 — Engineering touchpoints

| Area | Files |
|------|-------|
| Continuity templates | `lib/policy/src/continuity-templates.ts` |
| Vocabulary | `lib/policy/src/vocabulary.ts` |
| AI disclosure | jurisdiction packs |
| Public slug | `businesses.slug` |
| Inbox thread UI | `inbox.tsx`, mobile inbox tab |
| Workflows | `booking-continuity`, `tattoo-design-proof` |

---

## Part 8 — QA checklist (staging)

- [ ] Body-art SMS after web book uses **artist** vocabulary
- [ ] `/b` link in SMS opens tenant-branded page with correct preset (M1)
- [ ] IG deep link token resolves booking
- [ ] No-app owner can approve one proposal via link without full onboarding
- [ ] Voice disclosure spoken on first greeting (when M3 env live)
- [ ] DE locale footer on `/b` with longer strings — no layout break on 320px

---

## Part 9 — Changelog

| Date | Change |
|------|--------|
| 2026-05-31 | Part 10 — per-vertical thick/thin examples |
| 2026-05-29 | Initial M2/M3/M4 contract — companion to visual preset program |
| 2026-05-29 | Part 1b thick/thin platform rule; SMS/WA link-first; no MMS hero paths |

---

## Part 10 — Per-vertical examples (thick vs thin)

| Vertical | Thick (Livia URL) | Thin (SMS/WA) | Never in channel |
|----------|-------------------|---------------|------------------|
| **hair** | `/b` book, `/visit/{token}` | "Book here: {url}", reminder | Full service menu in SMS |
| **beauty** | `/b` + patch-test note on page | Confirm + reminder | Patch-test form in MMS |
| **wellness** | `/b` intake checkboxes | Package balance link (R2) | Medical advice |
| **body-art** | `/proof/{token}`, `/pay/{token}` | "Design ready: {proofUrl}" | Proof image in DM |
| **fitness** | `/waitlist/{token}` (R2) | "Spot open — accept: {url}" | Class roster PDF |
| **medspa** | `/intake/{token}` | Consent link | Consent PDF in WA |
| **allied-health** | `/intake/{token}` | Prep note + visit link | Clinical records |
| **pet-grooming** | `/b` pet picker | Reminder + visit | Vaccination upload in MMS |
| **automotive** | `/b` vehicle step | Reminder + visit | Damage photos in SMS loop |

All links use stable `businesses.slug`. Vocabulary from `businessVocabulary(vertical)`.
