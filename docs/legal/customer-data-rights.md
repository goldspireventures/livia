# Customer Data Rights (DRAFT — pre-counsel-review)

**Status:** Draft v1 (2026-05-07). For salon customers (P7) — the people who book with salons that use Livia.

This is a customer-facing explainer. Published at `livia.io/legal/customer-rights`.

## Quick read

- The salon you booked with controls your data. Livia just runs the software.
- You have GDPR rights — see below.
- You can ask Livia for help if your salon doesn't respond.
- Liv (the AI you're talking to) is honest about being an AI.

## Who controls your data

When you booked with a salon — let's say "Style Loft, Dublin" — they took your data: name, contact, what you booked.

- **Style Loft is the controller.** They decide what to do with your data.
- **Livia (the company) is the processor.** We hold the data on Style Loft's behalf, in the software they use to run their business.

This means: for most data questions, **contact the salon directly first.** They're the people who know you and have your booking details.

## Your GDPR rights

You have the right to:

### 1. Know what data the salon has about you (Right to Access)

Email the salon or message them in WhatsApp / SMS. They should respond within 30 days.

If they can't or won't, email **privacy@livia.io** with:
- Salon name + city.
- Your name + email + phone (so we can locate the records).
- What you're asking for.

We'll forward your request to the salon's account holder + escalate within 7 days. If the salon still doesn't respond within 30 total days, we'll provide what we can.

### 2. Get a copy of your data (Right to Portability)

Same process. We can provide a JSON + CSV bundle.

### 3. Correct your data (Right to Rectification)

Easiest: tell the salon directly.

### 4. Delete your data (Right to Erasure / "Right to be Forgotten")

Tell the salon directly. They have controls in Livia to delete you.

If they don't, contact privacy@livia.io. We'll forward + escalate. After 30 days unresolved, we'll act on the request — soft-delete + 30-day grace + hard-delete per our retention policy.

### 5. Restrict or object to processing

Contact the salon. We support pause-processing in the software.

### 6. Not be subject to fully automated decisions with significant effect

You're not. Liv may handle bookings or refunds for you, but:
- For decisions affecting your money (refunds), there's a cap-bound ladder — beyond a threshold, a human must approve.
- For any decision Liv makes that affects you, you can request human review.
- The salon's owner can override any Liv decision.

### 7. Withdraw consent (where consent is the legal basis)

For marketing-style messaging (rare in salon-context — most salon messages are about your bookings, which is contract not consent): unsubscribe via the link in the message, or tell the salon.

## Talking to Liv

When you message a salon and Liv responds:

- **Liv is an AI.** Per EU AI Act Art. 50, Liv discloses itself in the first message + every outbound communication.
- **Liv works for the salon, not for Livia.** It uses the salon's tone, the salon's policies, the salon's prices.
- **Liv won't try to sell you things outside the salon.** No upsells to other businesses; no marketing for third parties.
- **Liv handles your data per the salon's policies.** Your data isn't used to train other AI.
- **You can ask for a human.** Just say so. Liv will route to the salon owner / staff.

## What about voice calls?

Where the salon has voice receptionist enabled and you call the salon:
- The first thing you'll hear: "Hi, I'm Liv, the AI assistant for [salon name]."
- The call may be recorded if the salon has enabled it (usually 30-day retention; OFF by default).
- You can press 1 (or say "human") at any time to be put through to a person.

## Where your data lives

Your data lives in the EU/Ireland region. It doesn't leave the EU except for:
- The conversational AI (Anthropic) processes your message to generate Liv's response — they don't keep it or train on it.
- Push notifications go via Apple/Google's networks — but those messages contain only a headline, not your full conversation.

## Where to complain

If you're unhappy with how the salon (or Livia, where we acted as processor) handled your data:

1. Try the salon first.
2. Try **privacy@livia.io** second.
3. Complain to the data protection authority:
   - **Ireland:** Data Protection Commission, [www.dataprotection.ie](https://www.dataprotection.ie)
   - **UK** (v1.5+): Information Commissioner's Office, [ico.org.uk](https://ico.org.uk)
   - **Other EU markets** (v2+): your national DPA.

You don't need to go through Livia first — you can complain directly to your DPA.

## Honest things

- We're a small team. We try to respond fast. We'll tell you if something's complicated.
- The salon owns the relationship with you. We're the software they use.
- If a salon is mishandling your data, we want to know — we have AUP + tenant-suspension powers per `acceptable-use.md`.
- Your data is not for sale, ever. Not by us. Not by the salon (per their DPA with us).

---

**Drafting notes (delete pre-publication):**

- Counsel: please confirm § "Talking to Liv" disclosure language meets EU AI Act Art. 50 + ePrivacy obligations for chatbots.
- Voice recording disclosure (§ "What about voice calls") needs confirmation against per-market voice-recording laws (e.g., Germany requires both-party consent — relevant when DACH opens at v3).
- "You don't need to go through Livia first" language — counsel to confirm this is accurate per Art. 77.
