# Feature S5.01 — WhatsApp booking flow

**What it is.** End-to-end booking flow conducted entirely in WhatsApp (or SMS), 4-6 messages typical, no app required. The customer-side conversational wedge.

**Surfaces.** WhatsApp (verified business sender per Meta API). SMS fallback (for non-WhatsApp customers). In-app chat for staff/owner side (not customer side).

**Configurations.** Universal.
**Verticals.** v1 Hair + Beauty primary; expanded per F4 vertical-specific workflows for medspa (with intake form delivered via WhatsApp doc), tattoo (design-proof image attachments), etc.

**Personas.** P7 Customer primary. Indirectly: P3/P6 staff (sees the conversations in the salon-side chat queue).

**Modalities.** Conversational. No-app variant: SMS path is identical in shape; WhatsApp is preferred when available.

**Rung.** R2 from Day 1 (Liv books CT2-CT3 confirmations within preferences without asking). R3 by Month 1 (full autonomous booking for any CT).

**Dependencies.**
- WhatsApp Business API (verified sender, Meta-approved templates for outbound)
- SMS gateway (Twilio or comparable)
- LLM with tool-calling (the booking, customer-lookup, deposit-trigger tools)
- Customer-record (CT classification)
- Calendar / availability
- Payment provider (deposit)
- Wallet pass issuance

**Complexity.** L.

**Sub-features.**
- Bidirectional messaging (customer-initiated; outbound templates for time-sensitive)
- 24h customer-initiated session window awareness (re-engagement requires template after window)
- Slot proposal (1-3 options with stylist + time)
- Intake form delivery (CT1 New) as inline messages or doc attachment per vertical
- Deposit collection link
- Confirmation with wallet pass + ICS calendar invite
- Reschedule via "RESCHEDULE" reply
- Cancellation via "CANCEL" reply
- Disclosure (Liv identifies as AI on first contact per regulatory requirement)
- Hand-off to human on customer request ("can I talk to someone?") within shop hours

**Power-user / casual.** N/A for customer side; casual is the only mode.

**Accessibility.**
- SMS path supports customers without smartphones.
- Long-form messages broken into chunks.
- Slow-typing animation suppressed; immediate response is the affordance.
- Screen-reader-friendly outbound templates (no emoji-heavy; meaningful structure).
- Multi-language support per F1/F3 modality-and-locale (English-IE, Polish, PT-BR, Ukrainian, Lithuanian at v1).

**The "in its own league" angle.**
- **Most incumbents have SMS reminders, few have bidirectional WhatsApp with character.**
- **Fresha has light chat** but not character-led; not the booking-IS-the-conversation model.
- **Phorest's customer messaging is template-driven and feels like a form.**
- Livia's WhatsApp flow IS Liv — the customer-side "she's a colleague who answers the phone, the DM, the email" promise.

## Operational notes

- **24h rule.** Customer-initiated WhatsApp session is open for 24h after their last message; outside that window, only Meta-approved templates can initiate. Liv routes accordingly.
- **Template approval.** Templates need pre-approval from Meta; F8 includes the template inventory + approval pipeline.
- **Per-tenant phone number.** Each salon gets a verified business number — mass-send not possible (and explicitly avoided per Bet 5).
- **Cost model.** WhatsApp per-conversation cost (per Meta pricing); typical conversation cost ≤€0.05; well below voice cost (~€0.30).
- **Failure mode.** If WhatsApp API is down, Liv falls back to SMS automatically with a one-line note in the SMS itself ("WhatsApp unavailable — replying via SMS. Hi Mary — Lara has Tuesday 9am — yours?").
