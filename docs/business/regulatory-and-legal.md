# Regulatory and legal posture — F9

**Status:** F9 (2026-05-07), aligned with OS Phase A/B (2026-05-25). Reviewed by external counsel before each market launch (placeholder; legal review not in F9 scope).  
**Operator templates:** [`OPERATOR-READY-PACK.md`](./OPERATOR-READY-PACK.md) · [`templates/`](./templates/)

## GDPR posture

**Default operating model.**
- All personal data processing has a documented lawful basis (typically: contract for booking data; legitimate interest for ops; consent for marketing).
- Data residency: EU primary (Frankfurt), EU replica (Dublin). No backups out-of-EU.
- DPA included by default in customer contracts.
- Sub-processor list public on `livia.io/legal/sub-processors`; updated on change with 30-day notice.
- DPO: identified per legal entity; named in contract.

**DPIA template.** A reusable Data Protection Impact Assessment template lives in `docs/policy/dpia-template.md` (placeholder for F9). Used for: new persona launches, cross-tenant intelligence rollouts, voice receptionist new-locale rollouts, any feature that processes special-category data.

**Right-to-be-forgotten flow.** Self-serve in the customer-facing surface for end-customers; Owner-mediated for staff data; audit-log redaction (not deletion — chain integrity preserved with tombstones; ADR 0015).

## EU AI Act posture

Livia is **plausibly a high-risk AI under some readings** of the EU AI Act because Liv:
- Touches employment-adjacent decisions (rota proposals, team onboarding).
- Touches consumer-decisions (refund handling, drift recovery).
- Acts on behalf of natural persons in customer-facing contexts (voice + DM).

### Our posture

We **do not claim exemption.** We treat ourselves as plausibly high-risk and build accordingly:

- **Risk-management system.** The eval framework (ADR 0016) + audit log (ADR 0015) + observability (ADR 0017) + post-mortem culture compose this.
- **Data governance.** Tracked: data sources, lineage, quality, bias monitoring per persona × locale.
- **Technical documentation.** This `docs/` tree IS the technical documentation. Per-feature ADRs sit in `docs/adr/`.
- **Record-keeping.** Audit log is comprehensive and tamper-evident.
- **Transparency.** Customers always know they're interacting with Liv (Bet 7 — refusal of pretending to be human). Owners always know what Liv did and why.
- **Human oversight.** Every high-impact action class has a human-in-the-loop path (refunds above cap, hires, terminations, regulatory communications). The "Liv was wrong" surface is the rollback channel.
- **Accuracy + robustness + cybersecurity.** Eval suite + observability + per-tenant runtime isolation cover this.

We will engage external counsel at first market launch to confirm posture; this doc is the operating commitment until then.

## PSD2 / SCA + payment regulations

- **Provider:** Stripe (Stripe Ireland for IE/EU primary; Stripe UK for UK).
- **SCA:** Stripe handles SCA flows; we surface the challenge in customer-facing flows correctly.
- **Deposits + refunds:** all flow through Stripe; refunds above tenant-set cap require Owner approval (workflow engine; ADR 0013).
- **Payouts:** standard Stripe Connect for chair-rental hosts paying renters (or vice versa); we don't custody money.

## Employment-law adjacency

When Liv touches rota / time-off / hiring, she nudges into territory with employment-law liability per country.

| Liv touches | Risk | Mitigation |
|---|---|---|
| Rota proposals | If proposal is implemented as-is, could constitute scheduling decision; in some jurisdictions, requires employee consent or notice period. | Liv proposes; Manager confirms. Audit log records the proposal + the human confirmation. |
| Time-off approvals | Could constitute employment decision. | Always human-confirmed (Manager, sometimes Owner). Liv drafts; never decides. |
| Team invite (not job board) | Staff access is employment-adjacent but not automated hiring. | **Team → Invite** via Clerk; no in-product job board (removed 2026-05-25). Liv does not screen résumés. |
| Termination conversations | Liv never participates. Hard refusal. | In refusal taxonomy. |
| Performance feedback | Liv summarises Owner-input only; never generates. | In refusal taxonomy. |

We engage local counsel per market for employment-law specifics before opening that market.

## Consumer-protection adjacency

When Liv handles refunds and cancellations on the salon's behalf:

- **EU Consumer Rights Directive.** Distance-selling rules apply to bookings made online. Cancellation rights communicated in the booking confirmation.
- **Refund timeliness.** EU statutory periods (typically 14 days) are baked into the refund-ladder workflow defaults; per-tenant override allowed only upward (more generous), never downward.
- **Dispute resolution.** Standard ODR (Online Dispute Resolution) link in customer-facing flows.

## Per-market additional regulatory layer (placeholder index)

To be expanded per market launch:
- **IE:** Workplace Relations Commission (employment); CCPC (consumer); DPC (GDPR primary supervisory authority).
- **UK:** ICO; CMA; ACAS.
- **DE:** BfDI; BMAS; BNetzA (telecoms for voice line).
- **FR:** CNIL; DGCCRF.
- **etc.**

Each gets its own section as we open the market.

## What this earns us

Regulatory posture as a feature, not a tax. The trust-amplification brand earns the right to handle high-stakes operator decisions because we've shown we know what's at stake.

## Open questions

- EU AI Act — high-risk classification likelihood pending counsel review at first market launch.
- Voice receptionist + GDPR Article 22 (automated decision-making) — argument that booking decisions are transactional, not significant; pending counsel.
