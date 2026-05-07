# Modality and locale overview — F1

**Status:** F1 (2026-05-07). F3 promotes this into a deep spine doc (`docs/modality-and-locale.md`).

Two cross-axes that cut through every persona × configuration × vertical cell: how Liv reaches the human, and where the human is.

---

## Modality — how Liv reaches the human

Four modalities. Each has a distinct engineering surface, latency profile, persona affinity, and competitive landscape.

### M1 — Visual (dashboard, mobile app, public booking page, kiosk)

**What it is.** Pixel surfaces. The Owner's dashboard, the Staff's "My Day" mobile app, the Customer's `livia.io/b/<salon>` booking page, optionally a tablet kiosk at the front desk for Receptionist-led check-in.

**When Liv uses it.** Default for visible/considered actions: morning briefing, weekly digest, audit log review, settings, multi-staff scheduling, AI-training review. Anything the Owner wants to *see* in front of them.

**Personas it serves best.** P1 Founder (multi-shop visualisation), P3 Manager (multi-staff scheduling), P6 Receptionist (multi-staff scheduling at front desk).

**Competitors who do it well.** Phorest (mature dashboard); Mindbody (chain-mature); Boulevard (modern visual design).
**Competitors who do it poorly.** Booksy (cluttered); Vagaro (90s-feeling).

**Engineering implications.** Standard web/mobile stack. Aurora-Midnight design system.

**Livia commitment.** **v1.** Required.

---

### M2 — Conversational (in-app chat, WhatsApp/SMS bidirectional)

**What it is.** Text chat with Liv. In-app for staff/owner; WhatsApp + SMS for customers (and for owners who prefer it). Liv reads and writes natural language, takes actions in the system in response.

**When Liv uses it.** Customer-facing: booking, rebooking, cancellation, refund request, FAQ, complaint triage. Staff-facing: "what's my next appointment?", "can I swap Saturday with Niamh?". Owner-facing: "how did we do today?", "approve refund for Mary".

**Personas it serves best.** P7 Customer (especially under-35; chat-native; doesn't want to phone). P4a/b Senior STAFF (light-touch when busy on the chair). P1 Founder when on the move.

**Competitors who do it well.** Almost no one in salon software with character. WhatsApp Business API + a chat panel exists in some (Fresha has light chat); not character-led.
**Competitors who do it poorly.** Most. Generic chatbots feel like forms.

**Engineering implications.** WhatsApp Business API (verified sender; 24h customer-initiated session window; templates for outbound). SMS gateway. In-app realtime chat (Supabase realtime, or Pusher, or SSE). LLM with tool-calling for action-taking. Latency budget: <2s typical.

**Livia commitment.** **v1.** Required — the customer-side wedge sits here.

---

### M3 — Voice (Liv answers the phone)

**What it is.** Inbound phone calls answered by Liv with character voice. Outbound calls (rare; mostly for crisis comms) optional.

**When Liv uses it.** Always-on — every inbound call to the salon's main number is answered by Liv first, with seamless escalation to the Owner or Manager when needed.

**Personas it serves best.** P7 Customer (especially over-50 demographic, walk-by callers, the after-hours caller). Indirectly serves every internal persona by *removing* the phone-answering burden from them.

**Competitors who do it well.** Goodcall, Numa (US, generic SMB voice receptionist) — neither has character or per-tenant memory; neither is integrated with the rest of the operating surface.
**Competitors who do it poorly.** Phorest, Fresha, Square, Mindbody, Booksy (zero — none answer the phone).

**Engineering implications.** Telephony (Twilio Voice or comparable; per-tenant phone number provisioning). TTS with per-tenant voice memory (ElevenLabs or comparable). STT (Deepgram or Whisper). LLM with low-latency tool-calling. Latency budget: ≤ 600ms first-token, ≤ 2s typical full response. Mandatory AI disclosure (consumer protection + EU AI Act). Per-tenant call memory (caller-id → known regular → tone-match).

**Livia commitment.** **v1 — narrowed to single vertical (Hair+Beauty), single locale (English-IE), single configuration shape (single-shop with mgr or solo)** per F7 sequencing. The deepest single proof point and the wedge against incumbents who simply do not answer the phone.

---

### M4 — Passive (Liv just acts — weekly digest, surfaced alerts, push)

**What it is.** No human-initiated query; Liv produces the surface. Daily briefing email at 7am. Weekly digest Sunday evening. Push notification when something material happens. Wallet-pass updates. Liv-detected anomaly escalation (e.g., "Mary cancelled the Tuesday slot — she's now drifted to 95 days; want me to message her?").

**When Liv uses it.** When attention is needed but not immediate. The dignity-preserving modality — Liv shows up only when she's earned the moment.

**Personas it serves best.** P1 Founder (Sunday-evening triage), P2a/b Owner (morning briefing), P4a/b Senior (push notification when next-client confirmed/cancelled).

**Competitors who do it well.** Phorest weekly emails are decent but generic. Mindbody emails are noisy. Nobody does it in character.

**Engineering implications.** Scheduled jobs, push infra (APNs/FCM), email (Resend/Postmark with EU residency), wallet pass (PassKit). Liv-voice rendering of all surfaces.

**Livia commitment.** **v1.** Required for the briefing voice — it's where Liv shows up daily.

---

## Modality × persona affinity matrix

| Persona | Visual | Conversational | Voice | Passive |
|---|---|---|---|---|
| P1 Founder | High (multi-shop) | Medium (on-the-go) | Low (delegates phone) | **Very high (Sunday digest)** |
| P2a Owner-with-Mgr | High | High | Low | High |
| P2b Owner-no-Mgr | High | **Very high (WhatsApp-first)** | Medium (often answers own phone) | High |
| P3 Manager | **Very high (rota)** | High | Medium | High |
| P4a Senior STAFF | Medium (My Day) | Medium | **Very low** (does NOT want intermediary) | High (next-client push) |
| P4b Senior-w-admin | Medium | High | Low | High |
| P5 Junior STAFF | Medium (My Day; often empty) | Medium | Low | High |
| P6 Receptionist | **Very high (front desk)** | High | High (call handoff) | Medium |
| P7 Customer | Medium (booking page) | **Very high (DM/SMS)** | **Very high (the wedge)** | Medium (reminders) |

The voice modality is **uniquely a customer/receptionist surface**, almost not used by internal personas — which is exactly why the wedge holds: incumbents who serve internal personas first never built voice well.

---

## No-app variant — first-class persona axis

Every persona has a no-app variant. Common variants:

- **Owner who never logs in** — interacts with Liv only via WhatsApp + voice. Common for older single-shop Owners (P2b). All Owner workflows must have a chat-only or voice-only path.
- **Junior STAFF who never installs the app** — gets push via SMS, confirms via SMS, sees their day via SMS digest. Common in barbershop apprentice cells.
- **Customer who never opens an app** — books via SMS or voice or in-person; receives reminders via SMS; never sees a web page. **The largest no-app cohort.** All customer workflows must have a no-app path that is first-class, not a fallback.
- **Receptionist on a tablet** — never installs the staff app; works in a kiosk-mode browser tab. The kiosk surface is a visual modality variant.

**Engineering implication:** the no-app paths must be designed alongside the visual modality, not bolted on. Workflows that require an app login to complete (e.g., refund approval, time-off request) must have an explicit "you can also reply to this SMS to confirm" path or an "ask Liv to do it for you" voice-line path.

---

## Locale — where the human is

### v1 — Ireland

Sub-locale tags (matter for tone, expectations, broadband, competitor presence):
- **Dublin urban** — fastest broadband; Phorest dominant; price-tolerance highest; multi-language customer base (Polish, Portuguese, Brazilian, Ukrainian, Lithuanian commonplace).
- **Cork / Galway / Limerick urban** — Phorest dominant; price-tolerance high; some multi-language demand.
- **Regional urban (Waterford, Sligo, Drogheda, etc.)** — mixed Phorest / pen-and-paper; price-sensitive.
- **Market town** — pen-and-paper or Square dominant; older clientele; voice modality matters more.
- **Rural** — broadband variable (must support degraded mode); voice matters most; SMS-only customers common.

### v1 language commitments

- **English-IE mandatory.** Liv's default voice — Irish-inflected English, dry-warm register.
- **Irish (Gaeilge) symbolic.** Public booking page strings ("Cuir in áirithe / Book"), the homepage, occasional Liv signature flourishes. Not a full operating language at v1 — the symbolic gesture matters culturally; an actual all-Gaeilge workflow does not.
- **Polish** — Ireland's largest non-English-speaking community (~120k speakers, common salon staff and customer base); v1 strings + customer-side WhatsApp templates.
- **Portuguese (Brazilian)** — large Dublin community in beauty industry; v1 strings + customer-side templates.
- **Ukrainian** — significant post-2022 community; v1 strings.
- **Lithuanian** — established community; v1 strings.

Per-language Liv voice depth is **NOT v1** — at v1 the strings are translated; full per-locale character voice work (so French-Liv ≠ English-Liv-with-translator) lands at v2/v3 per F9 geographic expansion.

### v2-v3 expansion (forward reference to F9)

UK v2; Nordics, DACH, France, Iberia later. Each requires per-market voice work, currency, payment provider variation, regulatory variation, competitive landscape variation. F9 sequences.

---

## Hand-off

- Voice modality engineering plan → F8 (the deepest single engineering challenge).
- No-app workflow class → F4 (first-class workflow category, not a fallback).
- Locale sequencing and per-market depth → F9.
- Per-locale Liv voice character work → F10 (`brand-of-livia-and-liv.md`).
