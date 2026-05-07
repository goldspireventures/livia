# Workflows ↔ Features cross-index

**Status:** F4 (2026-05-07). Falls out of the workflow + feature inventory. Used by F8 engineering planning + F9 packaging decisions.

## Workflow → Features it uses

| Workflow | Primary features |
|---|---|
| A01 Book | Multi-staff calendar; deposit collection; intake form; wallet pass; SMS/WhatsApp confirmation; LLM tool-calling; customer-record (CT lookup) |
| A06 Refund-request | Refund processing; refund-cap ladder; payment provider integration; notification cascade; audit log |
| A07 No-show | Detection (scheduled job); customer messaging (soft-touch); waitlist; deposit forfeit; CT4 classifier; weekly digest entry |
| B02 Time-off-request | Coverage analysis; rota; customer comms drafts; rebook; delegations awareness |
| C01 Rota build/publish | Multi-staff calendar; coverage analysis; staff availability; conflict resolution |
| D01 Weekly digest | Reports; anomaly detection; pattern recognition; LLM voice composition; email + push delivery |
| E01 Refund-ladder escalation | Refund-cap ladder; routing per `reports_to` + `delegations`; notification cascade |
| E03 Owner-on-holiday | Delegations table mutation; notification re-routing; banner system; return digest composition |
| F03 "Liv was wrong" rollback | Audit log; eval data point; notification cascade; payment reversal (if applicable) |
| K01 COVID-style closure | Mass-reschedule tool; deposit-refund-or-credit options; comms cascade; bulk wallet pass updates |
| L01 SMS-only customer booking | SMS gateway; LLM tool-calling; payment-link generation; customer-record |
| S6 Voice receptionist (cross-cutting) | Telephony; TTS/STT; LLM tool-calling; per-tenant voice memory; AI disclosure; call recording (consent-gated) |

## Feature → Workflows it appears in

| Feature | Workflows |
|---|---|
| Multi-staff calendar | A01, A02, A07, B02, C01, C05, F03 |
| WhatsApp/SMS bidirectional | A01-A14 (all customer-facing); F03 (corrective messages) |
| Voice receptionist | A01, A02, A03, A09 (customer escalation start) |
| Audit log | All workflows (every action audit-logged) |
| Refund-cap ladder | A06, E01, all crisis-mode K-workflows |
| Deposit collection | A01, A05, A07 (forfeit), K01 |
| Wallet pass | A01, A14, A15, K01 |
| Weekly digest | D01 (it IS this workflow); references all other workflows' summaries |
| AI training review | F02, F03, F05; admin surface for OWN |
| Cross-tenant intelligence | D01 (insights inclusion); standalone surface |

## Configuration → Workflows + Features required

| Configuration | Required workflows | Required features |
|---|---|---|
| C2 Solo single-chair | A01-A15 minus A07 (waitlist), B-workflows N/A, C-workflows N/A, D01, F03, G01-G06 (Owner = entire admin), L01-L02 (no-app paths) | Mobile Today (Owner cockpit); WhatsApp; voice; deposit; wallet pass; weekly digest; settings; billing |
| C5 Single-shop with mgr | All A; all B; all C; D01-D04, D09; E01-E07; F03-F06; G01-G06; J01 vertical-specific | All of the above plus multi-staff calendar; rota; delegations editor; audit log search |
| C7 Multi-shop chain | All of C5 PLUS H01-H05 cross-shop | All of C5 plus cross-shop dashboard; brand consistency check |
| C10 Chair-rental | I01 chair-rental specific; A-workflows scoped per Renter; D01 host-scope + per-Renter scope | Rent-collection module; chair-availability; renter-data-isolation enforcement |
| C13 Multi-brand portfolio | I04 multi-brand specific; per-brand scoped A-workflows | Brand-isolation enforcement; cross-brand customer-recognition (with privacy gates) |
| Medspa vertical (any C) | J01: informed consent, contraindication check, post-procedure aftercare, before/after photo | Vertical-specific intake (medical history); special-category data handling; complications protocol routing |

## Persona → Workflows they touch + Features they use

| Persona | Workflows (primary) | Features (primary) |
|---|---|---|
| P1 Founder | D01 (chain digest), D04, D08, E03, F03, G02, H01-H05 | Cross-shop dashboard; chain-rollup reports; audit log (full); cross-tenant intelligence |
| P2a Owner-with-Mgr | D01, D04, D05, E01 (top of ladder), E03, F03, G01-G06 | Owner cockpit; reports; settings; audit log (full); brand customisation |
| P2b Owner-no-Mgr | All workflows touch them at some level (they ARE the team); especially A-workflows directly, D01, E03 (R5 test), F03 | Mobile Today (Owner cockpit); voice receptionist (THE wedge for them); WhatsApp; daily cash close |
| P3 Manager | C-workflows; E01 (mid-ladder); B02 (approver); A07 (no-show recovery) | Floor + queue; multi-staff calendar; rota; daily cash close |
| P4b Senior-w-admin | B02 (scoped approver); C04 (scoped); same as P4a otherwise | "My Day" + team-tile; scoped delegation surface |
| P4a Senior STAFF | A07 (notification only), B01-B07 (own), B09 (personal-rebook) | "My Day"; push notifications; own-earnings (private); own-clients view |
| P5 Junior STAFF | B-workflows (own); A01 (in-shop); A08 (walk-in) | "My Day" with hero empty-state; one-tap "book this walk-in" |
| P6 Receptionist | A01 (heavy), A03, A06 (REC initiator), A07 (recovery), A08, A13 | Multi-staff calendar; tablet kiosk; waitlist surface; cash close (REC contribution) |
| P7 Customer | A01-A15 (their side); F03 (when affected) | WhatsApp/SMS; voice line; public booking page; wallet pass |

## Ambition rung → Workflows + Features it unlocks

| Rung | New workflows enabled | New features enabled |
|---|---|---|
| R1 | All workflows present in "suggest-only" mode | Mobile Today + dashboard read; full audit log; voice receptionist (in escalate-everything mode) |
| R2 | A01 confirmations within preferences; A06 staff-can-tap-Liv's-recommendation; A07 soft-touch autonomous | WhatsApp full bidirectional; voice receptionist confirms regulars; weekly digest with patterns |
| R3 | A06 within-cap autonomous routing; B02 full coverage analysis + comms drafts; D01 in voice with proposed plans; E01 cap ladder fully active; A07 full sequence including waitlist | Cross-tenant intelligence surface (with k≥10); refund-ladder UX; "Liv was wrong" rollback as visible surface |
| R4 | D01 with proposed plans for top patterns; E03 holiday with elevated cap; F06 anomaly escalation with proposed fix; H01-H05 cross-shop (chain) | Plan-proposal surface; pattern explainer; anomaly drilldown |
| R5 | E03 owner-on-holiday with R5 = full operator (P2b solo barbershop); D01 becomes weekly check-in; A-workflows fully autonomous within policy | Holiday-mode surface; "the shop ran" return-from-holiday digest |

---

The cross-index is the **single most-cited F4 artifact** for F8 packaging decisions and F9 pricing tier construction. Every feature in a tier needs to support every workflow at the rung committed for that tier.
