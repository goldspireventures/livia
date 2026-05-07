# Modality and locale

**Status:** F3 spine doc (2026-05-07). Promoted from F1 one-pager (`docs/modality-and-locale-overview.md`).

Two cross-axes that cut through every persona × configuration × vertical: **how Liv reaches the human** and **where the human is.**

---

## 1. Modality — how Liv reaches the human

Four modalities. Each has distinct engineering surface, latency profile, persona affinity, competitive landscape.

### 1.1 Visual (M1)

**What.** Pixel surfaces. Owner dashboard, "My Day" mobile app, public booking page (`livia.io/b/<salon>`), tablet kiosk for Receptionist-led check-in.

**When Liv uses it.** Default for visible/considered actions: morning briefing, weekly digest, audit log, settings, multi-staff scheduling, AI-training review. Anything the human wants to *see*.

**Persona affinity (high).** P1 Founder (multi-shop visualisation), P3 Manager (multi-staff scheduling), P6 Receptionist (front-desk multi-staff calendar).

**Competitive landscape.** Phorest mature; Mindbody chain-mature; Boulevard modern. Booksy cluttered; Vagaro 90s-feeling.

**Engineering implications.** Standard web/mobile stack. Aurora-Midnight design system (F8 expands).

**v1 commitment.** Required.

### 1.2 Conversational (M2)

**What.** In-app chat, WhatsApp Business + SMS bidirectional. Liv reads and writes natural language, takes actions in response.

**When.** Customer-facing (book/rebook/cancel/refund/FAQ/complaint triage). Staff-facing ("what's my next appointment?", "can I swap Saturday with Niamh?"). Owner-facing on the move.

**Persona affinity.** P7 Customer especially under-35 (chat-native). P4a/b Senior STAFF when busy on the chair. P1 Founder on the move.

**Competitive landscape.** Almost no one in salon software with character. WhatsApp Business API + a chat panel exists in some (Fresha has light chat); not character-led.

**Engineering implications.** WhatsApp Business API (verified sender; 24h customer-initiated session window; templates for outbound). SMS gateway (Twilio or comparable). In-app realtime chat (Supabase realtime / Pusher / SSE). LLM with tool-calling. Latency budget: <2s typical.

**v1 commitment.** Required — customer-side wedge sits here.

### 1.3 Voice (M3)

**What.** Inbound phone calls answered by Liv with character voice. Outbound calls (rare; mostly for crisis comms) optional.

**When.** Always-on — every inbound call to the salon's main number is answered by Liv first, with seamless escalation to staff when needed.

**Persona affinity.** P7 Customer especially over-50 demographic, walk-by callers, after-hours. Indirectly serves every internal persona by *removing* the phone-answering burden.

**Competitive landscape.** Goodcall, Numa (US generic SMB voice receptionist) — neither has character or per-tenant memory; neither integrated with operating surface. Phorest/Fresha/Square/Mindbody/Booksy: zero — none answer the phone.

**Engineering implications.** Telephony (Twilio Voice or comparable; per-tenant phone number provisioning). TTS with per-tenant voice memory (ElevenLabs or comparable). STT (Deepgram or Whisper). LLM with low-latency tool-calling. Latency budget: ≤600ms first-token, ≤2s typical full response. Mandatory AI disclosure (consumer protection + EU AI Act). Per-tenant call memory (caller-id → known regular → tone-match).

**v1 commitment.** **Narrowed (per F7 sequencing) to single vertical (Hair+Beauty), single locale (English-IE), single configuration shape (single-shop with mgr, or solo).** The deepest single proof point and the wedge against incumbents.

### 1.4 Passive (M4)

**What.** No human-initiated query; Liv produces the surface. Daily briefing email at 7am. Weekly digest Sunday evening. Push notification when something material happens. Wallet-pass updates. Anomaly escalation.

**When.** When attention is needed but not immediate. The dignity-preserving modality — Liv shows up only when she's earned the moment.

**Persona affinity.** P1 Founder (Sunday-evening triage), P2a/b Owner (morning briefing), P4a/b Senior (push when next-client confirmed/cancelled).

**Competitive landscape.** Phorest weekly emails are decent but generic. Mindbody emails are noisy. Nobody does it in character.

**Engineering implications.** Scheduled jobs, push infra (APNs/FCM), email (Resend/Postmark with EU residency), wallet pass (PassKit). Liv-voice rendering of all surfaces.

**v1 commitment.** Required.

---

## 2. Modality × persona affinity matrix

| Persona | Visual | Conversational | Voice | Passive |
|---|---|---|---|---|
| P1 Founder | High | Medium | Low | **Very high** |
| P2a Owner-with-Mgr | High | High | Low | High |
| P2b Owner-no-Mgr | High | **Very high** (WhatsApp-first) | Medium (often answers own phone) | High |
| P3 Manager | **Very high** | High | Medium | High |
| P4a Senior STAFF | Medium | Medium | **Very low** | High |
| P4b Senior-w-admin | Medium | High | Low | High |
| P5 Junior STAFF | Medium | Medium | Low | High |
| P6 Receptionist | **Very high** | High | High (handoff) | Medium |
| P7 Customer | Medium | **Very high** | **Very high** (the wedge) | Medium |

Voice is uniquely a customer/receptionist surface; almost not used by internal personas. Which is precisely why the wedge holds: incumbents who serve internal personas first never built voice well.

---

## 3. No-app variant — first-class persona axis

Every persona has a no-app variant. They are **NOT** fallbacks. They are first-class workflow paths designed alongside the visual modality.

Common variants:
- **Owner who never logs in.** Interacts with Liv via WhatsApp + voice only. Common for older single-shop Owners (P2b). All Owner workflows (refund approval, hire approval, weekly digest) must have a chat-only or voice-only equivalent.
- **Junior STAFF who never installs the app.** Push via SMS. Confirms via SMS. Sees the day via SMS digest. Common in barbershop apprentice cells.
- **Customer who never opens an app.** Books via SMS or voice or in-person; receives reminders via SMS; never sees a web page. **The largest no-app cohort.**
- **Receptionist on a tablet.** Never installs the staff app; works in a kiosk-mode browser tab. Kiosk mode = visual variant.

**Engineering implication.** Workflows that require app login to complete must have an explicit "reply to this SMS to confirm" path or "ask Liv to do it for you" voice path. The no-app path is in F4 as a first-class workflow class.

---

## 4. Locale — where the human is

### 4.1 v1 — Ireland

Sub-locale tags (matter for tone, expectations, broadband, competitor presence):
- **Dublin urban** — fastest broadband; Phorest dominant; price-tolerance highest; multi-language customer base routine (Polish, Portuguese, Brazilian, Ukrainian, Lithuanian).
- **Cork / Galway / Limerick urban** — Phorest dominant; high price-tolerance; some multi-language demand.
- **Regional urban (Waterford, Sligo, Drogheda, etc.)** — mixed Phorest / pen-and-paper; price-sensitive.
- **Market town** — pen-and-paper or Square dominant; older clientele; voice modality matters more.
- **Rural** — broadband variable (must support degraded mode); voice matters most; SMS-only customers common.

### 4.2 v1 language commitments

- **English-IE mandatory.** Liv's default voice — Irish-inflected English, dry-warm register.
- **Irish (Gaeilge) symbolic.** Public booking page strings ("Cuir in áirithe / Book"), the homepage, occasional Liv signature flourishes ("slán go fóill"). Not a full operating language at v1.
- **Polish.** Ireland's largest non-English-speaking community (~120k speakers); v1 strings + customer-side WhatsApp templates.
- **Portuguese (Brazilian).** Large Dublin community; v1 strings + customer-side templates.
- **Ukrainian.** Significant post-2022 community; v1 strings.
- **Lithuanian.** Established community; v1 strings.

Per-language Liv voice depth is **NOT v1.** At v1 the strings are translated; full per-locale character voice work (so French-Liv ≠ English-Liv-with-translator) lands at v2/v3 per F9 expansion.

### 4.3 v2-v3 expansion (forward reference to F9)

UK v2; Nordics, DACH, France, Iberia later. Each requires: per-market voice work, currency handling, payment provider variation, regulatory variation, competitive landscape variation. F9 sequences.

---

## 5. Open questions resolved

- **Voice modality scope at v1?** Single vertical (Hair+Beauty), single locale (English-IE), single configuration shape (single-shop with mgr OR solo). Per F7 narrowing.
- **WhatsApp at v1?** Yes — required. Customer-side conversational wedge.
- **SMS at v1?** Yes — required. Lowest-common-denominator no-app channel.
- **Email at v1?** Yes for transactional + weekly digest. NOT for marketing campaigns at v1 (per Bet 5: marketing-as-conversation > campaigns; any campaign-style email lands at v2 with explicit owner approval per send).
- **Native mobile vs PWA?** Native (per ADR 0011). React Native via Expo for staff/owner/customer (where used).
- **Wallet pass at v1?** Yes for customer; required for the dignity-preserving reminder (see passive modality).
