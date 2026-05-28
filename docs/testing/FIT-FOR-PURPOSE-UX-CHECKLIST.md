## Fit-for-purpose UX checklist (visual + flow testing)

Use this during screenshot review and live walkthroughs. The goal is **not** “pretty”; it’s “does this screen do the job for this user, with minimum friction, in the right tone?”

### Before you judge a screen

- **user hat**: founder / owner / manager / staff / customer / operator (internal ops)
- **job-to-be-done**: what are they trying to complete in the next 60 seconds?
- **context**: urgent vs routine, mobile vs desktop, first-time vs returning

### Fit-for-purpose questions (ask every time)

- **useful**: does this screen answer the user’s top question *immediately*?
- **clear next step**: is there one obvious primary action?
- **flow**: are there extra steps we can remove or pre-fill?
- **trust**: do we show the minimum proof needed (policies, consent, confirmation, receipts)?
- **tone**: is copy aligned with the vertical + situation (clinical vs warm vs brisk)?
- **error-proofing**: what’s the most common mistake here and did we guard it?
- **accessibility**: can it be used with keyboard + screen reader; no “icon-only mystery” buttons
- **mobile reality**: does the primary action stay reachable without scrolling 3 screens?
- **does it feel broken**: navigation should reset scroll appropriately; loading states should be explicit

### Marketing-specific (livia.io)

- **truth alignment**: every claim is shipped (SMS/email/web chat/voice) or clearly labeled beta/alpha.
- **pricing alignment**: prices come from the real catalogue (`@workspace/entitlements`), not hand-edited copy.
- **why us**: after 20 seconds, can someone say *what Livia is* and *who it’s for*?
- **conversion path**: the next step is always visible (demo, join beta, contact).

### Internal ops / support-specific

- **triage speed**: can an operator answer “what happened / who’s impacted / what to do next” in < 30s?
- **identifiers**: requestId / bookingId / conversationId are visible + copyable.
- **timeline**: the sequence of events is easy to follow (latest first, time-stamped).
- **handoff**: assign, note, resolve are obvious; audit expectations are clear.

