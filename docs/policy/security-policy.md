# Policy — Security

**Status:** v1 (2026-05-07)
**Anchors:** `docs/engineering/security.md`, ADR 0014 (isolation), ADR 0015 (audit log), GDPR Art. 32, EU AI Act.

## Posture

Security is a property of the system. Trust amplification (Bet 2) requires every claim about safe handling of customer data is true at the architecture level.

This is the governance-side, customer-facing-summary version. The engineering-side detail lives at `docs/engineering/security.md`.

## The seven commitments (mirrors engineering/security.md)

1. Defence in depth.
2. EU residency by default.
3. Encryption everywhere.
4. Identity + authentication (MFA for OWN/ADM/ADM-D; SSO for enterprise).
5. Least privilege.
6. Auditability (hash-chained audit log per ADR 0015).
7. Vulnerability discipline.

## Threat model (summary)

Detail in `docs/threat-model.md` (when authored — v1.5).

| Threat actor | Motivation | Highest-risk attack | Mitigation |
|---|---|---|---|
| Opportunistic external attacker | Data theft for resale; credential stuffing | API endpoint abuse; credential stuffing on Owner accounts | Rate limit, MFA, anomaly detection, short session lifetime |
| Targeted external attacker | Brand damage; customer data exfiltration | Supply chain compromise; sophisticated phishing | Dependency scanning, SAST, MFA, principle-7 isolation |
| Malicious insider (rare; never assumed) | Data exfiltration | Bulk data export | No standing prod access; break-glass audited; offboarding rotation |
| Malicious tenant | Cross-tenant data access | Tenant-id spoofing; query-helper bypass | App-layer + RLS double-enforcement; per-artifact DB roles |
| Confused tenant (more common) | Accidental misconfiguration | Disclosing too much in DM; refunding too generously | Cap-bound roles; eval-tested guardrails; "Liv was wrong" rollback |
| Hostile competitor | Competitive intel; customer poaching | Demo-account abuse; trial-period reverse-engineering | Demo-account rate limit; trial gated to verified salons |
| Government / lawful intercept | Legal disclosure | Subpoena for tenant data | Counsel-led; minimum-disclosure response; per-jurisdiction analysis |

## Customer-trust commitments

Surfaced on `livia.io/security` (when published per F9 GTM):

- EU-resident data (Frankfurt primary; Dublin replica).
- TLS 1.3 minimum on the wire.
- AES-256 at rest.
- Hash-chained audit log (Owner-readable).
- MFA-mandatory for owner-tier roles by v1 ship.
- SOC 2 Type 1 in flight at v1; Type 2 by v3.
- Annual external pen-test (publication of summary at v1.5).
- Bug bounty programme at v1.5.
- Easy-to-leave: day-of-departure full export.

## What we will not commit to (honesty list)

- "Bank-grade security" — undefined; we don't claim it.
- "Military-grade encryption" — marketing fluff; we don't claim it.
- "End-to-end encryption" — Liv reads conversations to operate; not E2EE.
- "Zero-knowledge architecture" — same.
- "We never get hacked" — we'll have incidents; we'll handle them per `incident-response.md`.

## Notification commitments

- SEV-SEC + GDPR-relevant breach: counsel within 1 hour; DPA + affected controllers within 72 hours; affected customers per Art. 34 if high-risk.
- SOC 2 reporting (annually after Type 1 issued).
- Per-customer audit support (annually for enterprise; on-request for studio/chain).

## Internal cadence

- Weekly: dependency-scan results review.
- Monthly: access review (who has what access; do they still need it).
- Quarterly: kill-switch drill, rollback drill.
- Annually: SEV-SEC tabletop with counsel; full pen-test; threat-model refresh.

## Annual review

Reviewed annually + on substantive change. Last review: 2026-05-07. Next: 2027-05.

## Open questions

- Pen-test publication — full report, summary, or attestation only? (Currently leaning summary.)
- Public threat model — strengthens trust signal but informs attackers; revisit at v2.

## EU/IRE residency

All security policy applies EU-region; pen-test scope EU-region; bug bounty scope EU-region.
