# Data Processing Agreement — Template (DRAFT — pre-counsel-review)

**Status:** Draft v1 (2026-05-07). NOT YET COUNSEL-REVIEWED. Will be revised before publication on `livia.io/legal/dpa`.

**Effective:** signed digitally per tenant at sign-up.
**Anchor:** GDPR Art. 28.

This DPA forms part of the agreement between **Livia Technologies Ltd** (the "Processor") and **the Salon** (the "Controller") that has subscribed to the Livia service.

## 1. Parties

- **Controller:** the Salon, with details captured at sign-up.
- **Processor:** Livia Technologies Ltd, registered in Ireland.

## 2. Scope

This DPA applies to all personal data the Processor processes on behalf of the Controller in the course of providing the Livia service.

## 3. Subject matter, duration, nature, purpose, types of data, categories of data subjects

| | |
|---|---|
| Subject matter | The Livia service: AI-native operating service for the Salon's appointment-based business. |
| Duration | While the Salon's subscription is active + the data retention period thereafter (per `docs/policy/data-retention.md`). |
| Nature + purpose | Operating the Salon's customer relationships, bookings, communications, and operational workflows. |
| Types of personal data | Identification (name, contact details), booking + service history, communications transcripts, voice recordings (where enabled), photographs (where applicable for the Salon's vertical), payment metadata. |
| Categories of data subjects | The Salon's customers; the Salon's staff. |
| Special categories | Health data only where the Salon's vertical requires it (medspa, allied-health adjacency). Subject to Salon's lawful basis under Art. 9. |

## 4. Processor obligations (Art. 28)

The Processor shall:

(a) Process personal data only on documented instructions from the Controller, including with regard to transfers, unless required to do so by EU/Member-State law.

(b) Ensure that persons authorised to process personal data are committed to confidentiality.

(c) Take all measures required pursuant to Art. 32 (security of processing) — see Schedule II.

(d) Engage sub-processors only on the conditions set out in this DPA — see Schedule III.

(e) Taking into account the nature of the processing, assist the Controller by appropriate technical and organisational measures, in fulfilling the Controller's obligation to respond to requests for exercising the data subject's rights.

(f) Assist the Controller in ensuring compliance with the obligations pursuant to Articles 32 to 36 (security, breach notification, DPIA).

(g) At the choice of the Controller, delete or return all personal data after end of provision of services, and delete existing copies unless EU/Member-State law requires storage.

(h) Make available to the Controller all information necessary to demonstrate compliance with Art. 28.

## 5. Sub-processors

Per `sub-processors.md`. The Controller authorises the use of the listed sub-processors.

For new sub-processors:
- The Processor will give the Controller 30 days' notice via email + `sub-processors.md` update.
- The Controller may object during the 30-day window; if no resolution, the Controller may terminate the agreement without penalty.

## 6. Data subject rights

The Processor shall assist the Controller (within 7 business days of request):
- Subject Access Requests: provide tools (export endpoint) so the Controller can fulfill.
- Erasure: provide tools (delete endpoint) so the Controller can fulfill.
- Rectification: provide UI surface for direct correction.
- Portability: export in machine-readable JSON + CSV.
- Restriction: provide soft-delete / pause-processing capability.
- Objection: documented in product surface.

## 7. Personal data breach

The Processor shall notify the Controller without undue delay (target: within 24 hours of awareness) on becoming aware of a personal data breach.

The notification will include:
- Nature of the breach + (where possible) categories + approximate number of data subjects affected + records concerned.
- Likely consequences.
- Measures taken or proposed.
- Designated contact point.

The Controller is responsible for notification to the supervisory authority (Art. 33) and data subjects (Art. 34).

## 8. International transfers

Personal data is processed within the EU/EEA. Transfers outside the EU/EEA are restricted to:
- LLM inference to Anthropic (per `data-residency.md`); covered by Anthropic Commercial Terms + zero-retention assurance.
- Push notification dispatch via APNs (Apple) + FCM (Google); payload contains only headline + deep link.

Where a transfer is to a third country without an adequacy decision, Standard Contractual Clauses or equivalent safeguards apply.

## 9. Audit rights

The Controller may audit the Processor's compliance with this DPA:
- By reviewing the Processor's published policies + audit reports (SOC 2 Type 1 at v1; Type 2 at v3).
- By requesting an annual compliance attestation (provided in writing).
- By onsite audit, on 90 days' notice, at the Controller's expense + subject to confidentiality.

## 10. Termination + return / deletion

On termination of the agreement:
- The Processor will allow the Controller to export all personal data within 30 days (full export available immediately on cancellation per "easy to leave" commitment).
- After 30 days, the Processor will hard-delete personal data per `docs/policy/data-retention.md`.
- Audit log entries retained 7 years per legal obligation.
- Backup-retention conflict resolved per data-retention policy.

## 11. Liability

Per the main agreement (Terms of Service § 11). The DPA-specific carve-out: the Processor remains liable for its sub-processors' GDPR violations.

## Schedule I — Description of processing

(Mirrors § 3.)

## Schedule II — Technical + organisational security measures (Art. 32)

The Processor implements the following measures:

### Encryption
- TLS 1.3 minimum on the wire.
- AES-256 at rest (provider-managed).
- BYOK at v3 enterprise tier.

### Access control
- Per `docs/policy/access-control.md`.
- MFA mandatory for OWN/ADM/ADM-D roles by v1 ship.
- No standing production access for Processor staff; break-glass logged + Owner-disclosed.

### Resilience
- Backups (encrypted; 30-day retention).
- Incident response per `docs/engineering/incident-response.md`.
- Disaster recovery plan + annual drill.

### Monitoring + audit
- Audit log per ADR 0015 (hash-chained, append-only, EU-resident).
- Sentry for application errors (PII-redacted).
- Security monitoring 24/7 (on-call rotation).

### Data minimisation
- Customer data scoped per tenant; cross-tenant access requires opt-in + k≥10 + RFC.
- Conversation transcripts purged after 90 days unless flagged.
- Voice recordings OFF by default.

### Vendor management
- Sub-processors per Schedule III; DPA + EU residency required.
- Annual subprocessor review.

### Personnel
- Confidentiality + IP assignment signed.
- Background checks (where lawfully permitted).
- Annual security training.

## Schedule III — Sub-processors

Per `sub-processors.md` (always-current; not duplicated here for sync reasons).

---

**Drafting notes (delete pre-publication):**

- Counsel: please review § 4 (Art. 28 obligations) and § 8 (transfers; SCC adequacy for Anthropic); confirm Schedule II completeness.
- Per-market addenda needed — UK adds the UK Adequacy Decision context (v1.5); Switzerland adds FADP at v3.
- "Easy to leave" + 30-day export commitment is brand-anchored; counsel to make legally bulletproof without diluting customer-facing promise.
