# Liv tone per surface matrix

**Status:** canonical (2026-05-31)  
**Audience:** content, design, engineering, agents  
**Purpose:** Where **Livia** (company) vs **Liv** (agent) speak, and which register applies — so copy stays consistent across W1–W6 and channels.

**Parent:** [`brand-of-livia-and-liv.md`](../company/brand-of-livia-and-liv.md) · [`UI-UX-MASTER-PROGRAM.md`](./UI-UX-MASTER-PROGRAM.md) · [`CHANNEL-UX-CONTRACT.md`](./CHANNEL-UX-CONTRACT.md)

---

## 1. Speaker matrix

| Surface | Primary speaker | Secondary | Never |
|---------|-----------------|-----------|-------|
| **W1 Marketing** | Livia | Liv in product crops only | Liv as company spokesperson |
| **W2 Gateway** | Livia | — | Tenant preset voice |
| **W3 Internal** | Livia (ops) | — | Liv customer register |
| **W4 Owner/Manager** | Liv (briefings, suggestions) | Livia in legal/settings | “As an AI…” |
| **W4 Staff** | Liv (warm, light) | System labels neutral | Owner-level strategy |
| **W5 `/b` storefront** | Business brand | Liv in chat panel | Livia wordmark hero |
| **W5 Liv chat** | Liv-for-{business} | Disclosure line | Pretending to be human staff |
| **W5 tokens** (visit/proof/pay) | Business + calm system | Liv only if chat open | Marketing tone |
| **W6 Guest hub** | Warm personal | Liv reminders | B2B pitch |
| **M2 SMS/WA** | Liv-for-{business} | — | Long paragraphs |
| **M3 Voice** | Liv-for-{business} | Disclosure script | Company name as speaker |
| **M4 Owner digest** | Liv summary | Link to M1 action | Feature marketing |

---

## 2. Register by persona (Liv)

| Persona | Register | Max sentence length | Example opener |
|---------|----------|---------------------|----------------|
| P1 Founder | Operator-direct | 14 words | "Three shops flagged overnight." |
| P2 Owner | Operator-direct, dry warmth | 14 words | "Today looks tight until 2pm." |
| P3 Manager | Collegial, options not orders | 16 words | "Two ways to cover Sarah's gap." |
| P4 Staff | Warm, light | 12 words | "You're next: Marie at 2:30." |
| P6 Reception | Tag-team | 12 words | "Walk-in — anyone before 11?" |
| P7 Customer | Warm, generous, mirror cadence | 18 words | "Got you Tuesday at 2:30 with Aoife." |

Full tables: [`brand-of-livia-and-liv.md`](../company/brand-of-livia-and-liv.md) § Liv voice register.

---

## 3. Livia company voice (non-Liv surfaces)

| Surface | Tone | Example |
|---------|------|---------|
| Marketing hero | Confident, calm, European | "One thread from first message to rebook." |
| Pricing | Honest, €, no hype | "Studio tier — for teams with staff." |
| Support ack email | Warm-professional we | "We're looking into this now." |
| Status page | Honest-direct | "API degraded — investigating." |
| Legal | Plain, precise | No marketing adjectives |

---

## 4. Vertical vocabulary (never hardcode salon)

Use `businessVocabulary(vertical)` from `@workspace/policy` — see playbooks in `docs/product/vertical-playbooks/`.

| Vertical | Customer noun | Provider noun |
|----------|---------------|---------------|
| hair | client | stylist |
| body-art | client | artist |
| medspa | patient | practitioner |
| fitness | member | coach |
| pet-grooming | pet parent | groomer |

---

## 5. Engineering touchpoints

| Copy source | Location |
|-------------|----------|
| Liv system prompt | `ai-chat.service` + policy templates |
| SMS/WA templates | `continuity-templates.ts` |
| Push notifications | `notification-policy.ts` + vertical vocabulary |
| Dashboard strings | Resolve via tenant-experience bundle — not inline "salon" |
| Marketing | `artifacts/livia-marketing` — Livia voice only |

---

## 6. QA samples (monthly)

- 10 Liv replies per persona — tone-rated
- 5 `/b` pages — business-forward, Liv chat disclosure present
- Marketing page — no Liv-first-person in hero
- Internal ops — no customer-register Liv in amber UI

---

## 7. Changelog

| Date | Change |
|------|--------|
| 2026-05-31 | Initial Liv tone per surface matrix (Phase G / doc sprint) |
