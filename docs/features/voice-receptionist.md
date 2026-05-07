# Feature S6 — Voice receptionist (Liv answers the phone)

**What it is.** Inbound calls to the salon's main number are answered by Liv with character voice, per-tenant memory (caller-id → known regular → tone-match), book/rebook/cancel ability, with seamless escalation to staff. Mandatory AI disclosure at first contact.

**Surfaces.** Voice (telephony). Indirectly: visual (Receptionist sees call summary in her queue; Owner sees voice-call activity in weekly digest).

**Configurations needed.** v1: C1, C2, C3, C4, C5 (single-shop; solo) per F7 sequencing. C6+ at v2.

**Verticals.** v1: **Hair + Beauty only** per F7 narrowing. v2 expands.

**Personas served.**
- P7 Customer (primary, especially over-50 demographic).
- P6 Receptionist (relieves ~50% of call volume; sees handoffs in her queue).
- Indirectly: every internal persona by removing the phone-burden.

**Modalities.** Voice native. Visual surface for staff to review call transcripts/summaries.

**Rung.** R2 from day one (Liv answers; offers to book; escalates anything unsure). R3 by month 3 (handles full booking, refund-recommendations, simple Q&A autonomously).

**Dependencies.**
- Telephony provider (Twilio Voice or comparable)
- TTS (ElevenLabs with per-tenant voice memory — different brands can have slightly different voice personalities while remaining recognisably "Liv")
- STT (Deepgram or Whisper with low-latency mode)
- LLM with tool-calling (the booking, lookup, escalate tools)
- Auth + tenant identification by called-number
- Per-tenant phone-number provisioning + porting flow
- Call recording + storage (EU residency)

**Complexity.** XL (the deepest single engineering challenge in v1).

**Sub-features.**
- Mandatory AI disclosure at first contact: *"Hi, you've reached Aurora Studio — this is Liv, the studio's AI receptionist. How can I help?"*
- Caller identification (caller-id → customer record → CT classification)
- Tone-match (CT3 VIP gets concierge-deluxe register; CT1 New gets concierge-soft)
- Booking flow via voice
- Cancellation/reschedule via voice
- Refund-request triage (can't process; routes to Owner/Manager per cap-ladder)
- Escalate-to-human (with context preserved): "let me get Niamh for you — she'll be on in a moment."
- Voicemail mode if no human available
- Out-of-hours mode: bookings only; messages taken
- Call recording with consent (one-time + per-call disclosure)
- Per-call audit entry + transcript
- Per-call quality score (eval input)

**Power-user / casual.** Per-tenant-customisable register knob (default Liv-character; tunable for budget-positioning vs luxury-positioning).

**Accessibility.**
- Slower speech-rate option (caller-detectable: hesitation patterns, repeated requests).
- Repeat-back of any captured detail before commit ("9am Tuesday with Lara — yes?").
- Hand-off to human on detection of frustration / confusion.

**The "in its own league" angle.**
- **No salon-software incumbent answers the phone.** Phorest, Fresha, Square, Mindbody, Booksy — all zero. Voice receptionists exist in the SMB world (Goodcall, Numa, Maven) but none has per-tenant memory, none has character, none integrates with the salon operating layer.
- **Salon owners pay people €25-40k/yr to answer the phone.** Liv answers the phone for €X/mo (F9 prices). The economics are uncontested.
- **The wedge holds because incumbents would have to add: telephony stack, voice TTS with character, low-latency LLM tool-calling, per-tenant memory.** Each is multi-quarter engineering. Together, multi-year.

This is **the single deepest wedge in Livia's v1.** F7 anchors it. F8 architects to deliver it. F9 prices it.

## Operational notes

- **Compliance disclosure** is mandatory under EU AI Act (Article 50, transparency obligation for AI systems interacting with humans) AND consumer-protection law in IE/UK.
- **Call recording consent** required before recording (per IE Data Protection Commissioner guidance) — implemented as auto-disclosure at the start of each call.
- **Failure mode:** if voice stack is down (TTS fail, STT fail, LLM unreachable), call routes to human (Receptionist queue or Owner phone) with explicit "I'm having technical trouble — let me get someone for you" — never dead air, never fake-success.
- **Cost model:** per-call all-in cost target ≤ €0.30 at typical conversation length. F8 ADR confirms.
