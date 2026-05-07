# Policy — DPIA template

**Status:** v1 (2026-05-07)
**Anchors:** GDPR Art. 35 (Data Protection Impact Assessment); EU AI Act (high-risk system documentation); `docs/business/regulatory-and-legal.md`.

This is the template. Per-feature DPIAs (one per high-risk processing activity) are produced from this template + signed by founder + counsel.

## When a DPIA is required

GDPR Art. 35 requires a DPIA when processing is "likely to result in a high risk to the rights and freedoms of natural persons." We treat the following Livia features as triggering DPIA:

- **Voice receptionist** — automated processing of voice data; AI decision-making affecting customers.
- **Liv-authored outbound communications** — AI authoring at scale.
- **Cross-tenant intelligence** — aggregation across data subjects.
- **Audit log search** — broad accessibility of operational data.
- **Cap-bound refund ladder** — automated decision affecting customer money.
- **Drift recovery** — automated outreach to customers based on inferred state.
- **Booking via voice** — automated decision making per Art. 22.
- **Customer-typology classification** — automated profiling.
- **Cross-tenant aggregate publication** — re-identification risk vector.
- **Liv-character localisation** — large-scale language processing.

Each of the above has its own DPIA file at `docs/dpia/<feature-slug>.md`.

## DPIA template

```markdown
# DPIA: <feature name>

**Status:** Draft | Reviewed | Counsel-approved | Published | Superseded
**Author:** <name>
**Counsel reviewer:** <external counsel firm + named attorney>
**Date drafted:** YYYY-MM-DD
**Date approved:** YYYY-MM-DD
**Next review:** YYYY-MM-DD (annual or on substantive change)

## 1. Description of processing

(What data is processed; how it's collected; the systems involved; the data flow.)

- Personal data categories processed: ...
- Data subjects: ...
- Recipients: ...
- Retention: per `docs/policy/data-retention.md` row(s).
- Automated decision-making: yes/no — if yes, describe Art. 22 mitigations.
- International transfers: per `docs/policy/data-residency.md`.

## 2. Necessity + proportionality

(Why this processing is necessary for the legitimate operation of Livia. Why minimum-data-necessary principle is honoured.)

## 3. Risk assessment

| # | Risk | Likelihood | Severity | Inherent risk |
|---|---|---|---|---|
| 1 | ... | Low/Med/High | Low/Med/High | ... |

(Risks include: unauthorised access; cross-tenant leak; AI decision error; profiling without consent; bias in training; re-identification; etc.)

## 4. Mitigations

| # | Mitigation | Reduces which risk | Residual risk |
|---|---|---|---|
| 1 | ... | risk #N | Low/Med/High |

(Mitigations may include: scope checks per ADR 0009; audit log per ADR 0015; eval thresholds per ADR 0016; opt-in per `cross-tenant-intelligence.md`; etc.)

## 5. Consultation

- Internal consultation with: head of engineering, head of CS, brand stewards, founder.
- DPO consultation (where DPO appointed): ...
- Data subject consultation (where applicable): design partner survey response from cohort.

## 6. Decision

- Process the activity AS-IS.
- Process AFTER mitigations.
- Defer pending further analysis.
- Reject + redesign.

## 7. Sign-off

- Founder: ___ Date: ___
- Counsel: ___ Date: ___
- Head of engineering: ___ Date: ___

## 8. Cadence

- Reviewed annually OR on:
  - Substantive feature change.
  - New evidence of risk (incident, regulator guidance change).
  - Subprocessor change affecting this processing.

## 9. EU AI Act considerations

(Where the feature involves AI: classify per EU AI Act risk tiers; document conformity; reference eval suite per ADR 0016.)

- AI Act risk classification: minimal | limited | high | unacceptable.
- Transparency obligations (Art. 50): ___
- Conformity assessment (where high-risk): ___
- Post-market monitoring (per ADR 0017 observability): ___

## 10. EU/IRE residency

All processing per this DPIA is EU-region.
```

## Cadence

- Each DPIA reviewed annually at foundation audit.
- Each DPIA reviewed on substantive change to the feature it covers.
- Each DPIA reviewed on regulatory guidance change (DPC IE; EDPB; EU AI Act guidance).
- New high-risk processing activity = new DPIA before launch.

## DPIA library

Per-feature DPIAs as they're authored:
- `docs/dpia/voice-receptionist.md`
- `docs/dpia/liv-authored-outbound.md`
- `docs/dpia/cross-tenant-intelligence.md`
- `docs/dpia/audit-log-search.md`
- `docs/dpia/cap-bound-refund-ladder.md`
- `docs/dpia/drift-recovery.md`
- `docs/dpia/booking-via-voice.md`
- `docs/dpia/customer-typology-classification.md`
- `docs/dpia/cross-tenant-aggregate-publication.md`
- `docs/dpia/liv-character-localisation.md`

(Authored as features ship. Listed here so the gap is visible.)

## Annual review

Reviewed annually + on substantive change to GDPR/AI-Act guidance. Last review: 2026-05-07. Next: 2027-05.

## Open questions

- Should DPIAs be published (transparency) or kept internal-only? (Currently internal; revisit per customer demand at v1.5.)
- DPO appointment timing — Livia is not yet required to appoint a DPO under Art. 37, but counsel review at v1.5 to confirm.

## EU/IRE residency

All DPIAs + their underlying analyses retained EU-region.
