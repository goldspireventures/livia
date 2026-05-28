# v2 GTM — “wow” layer (Liv-centred)

**Status:** Active product intent on top of [v2 engineering close](./V2-ENGINEERING-CLOSED.md)  
**Authority for Liv engineering:** [`LIV-OPERATING-SYSTEM.md`](./LIV-OPERATING-SYSTEM.md) · [`LIV-EXECUTION-PLAN.md`](./LIV-EXECUTION-PLAN.md)

---

## Thesis

v2 is the **GTM version**: prospects feel **livia.io**, owners feel **spoilt for choice**, everyone feels **Liv** is the centre of gravity — not a chatbot feature bolted on.

| Audience | “Damn” moment |
|----------|----------------|
| **Customer** | Liv books on `/b/{slug}` with disclosure, real slots, confirmation SMS/email |
| **Owner / founder** | Morning briefing + **Owner toolkit** + **Ask Liv** in inbox |
| **Manager** | Queue + rota + Liv draft on threads |
| **Staff** | My chair + mobile rota glance |
| **Livia Inc** | Internal Liv assist + platform health |

---

## Shipped in GTM layer (in-repo)

| Item | Where |
|------|--------|
| **Liv Command Hub** | Dashboard + chain — briefing refresh, inbox, toolkit, tune Liv, preview public Liv |
| **Owner toolkit** | `/toolkit` — every nav ritual + Liv/policy/comms settings |
| **Ask Liv (inbox)** | `POST .../liv-assist` wired in UI — drafts into reply box |
| **Team rota (mobile)** | `/rota` — list shifts + deep link to web editor |
| **Liv runtime** | Registry, tenant pool, staff + public profiles, morning briefing tool |

---

## Still v3 / founder (not blocking GTM narrative)

- Live WhatsApp/Instagram OAuth
- Nordic voice **production** casts
- Full workflow depth (healing, waitlist, intake gates)
- Native mobile **create** shift (web rota is editor of record)
- Paying tenant proof — [`FOUNDER-SHIP-LANE.md`](./FOUNDER-SHIP-LANE.md)

---

## Build rules (Liv)

1. New behaviour → **tool** or **workflow**, not prompt hacks in `ai-chat.service.ts`.
2. Every owner-facing Liv surface links to **inbox**, **toolkit**, or **settings?tab=liv`.
3. “Spoilt for choice” = **toolkit** shows all gated rituals; never hide tier/vertical tools behind mystery menus.

---

## Stakeholder value map

External vs internal actors, ecosystem handoffs, and OS principles: [`LIVIA-GLOBAL-PRODUCT-SYSTEM.md`](./LIVIA-GLOBAL-PRODUCT-SYSTEM.md) **Part X**.  
Payroll/HR within OS scope: [`LIVIA-COMPLETE-SYSTEM-SPEC.md`](./LIVIA-COMPLETE-SYSTEM-SPEC.md) **§7**.
