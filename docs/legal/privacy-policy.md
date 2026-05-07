# Privacy Policy (DRAFT — pre-counsel-review)

**Status:** Draft v1 (2026-05-07). NOT YET COUNSEL-REVIEWED. Will be revised before publication on `livia.io/legal/privacy`.

**Effective date:** TBD (post-counsel-review)
**Controller:** Livia Technologies Ltd, registered in Ireland, [number TBD], [address TBD].

## Quick read

- We store your data in the EU (Frankfurt primary; Dublin replica).
- We never sell your data.
- We never use your data to train external AI models.
- You can export everything any time.
- You can delete everything any time.
- Your customers (P7) have rights too — see `customer-data-rights.md`.

The rest is detail.

## 1. Who this policy applies to

Three audiences:
- **Salons (our customers / "tenants"):** the businesses that pay for Livia. We are processor for their customer data + controller for their salon-account data.
- **Salon customers (the "P7"):** people who book with a salon using Livia. Their salon is the controller for their data; we are processor.
- **Visitors to `livia.io`:** people browsing our marketing site. We are controller for their data.

## 2. Data we collect (salons)

When you sign up:
- Name, email, password (via Clerk), phone, salon name, address, vertical.
- Payment method (via Stripe; we store metadata, not the card itself).
- Optional: company logo, brand assets, voice samples.

When you use Livia:
- Booking data, customer data, communication transcripts, AI training inputs.
- Audit log of your actions in the platform.
- Usage data (which features you use; for product improvement).

When you contact us:
- Support history.

## 3. Data we collect (salon customers / P7)

What the salon collects from you, on the salon's behalf:
- Name, email, phone (whatever you give them).
- Booking history with that salon.
- Communication history with the salon (DMs, voice calls).
- Photos / consent forms you provide (if applicable for the salon's vertical).

The **salon is the controller** for this data. We process it on their behalf per their DPA with us.

## 4. Data we collect (livia.io visitors)

- Anonymised analytics via Plausible (no cookies, no cross-site tracking).
- Form submissions (e.g., contact form) — name, email, message.

## 5. Why we process data (legal basis)

| Audience | Purpose | Legal basis |
|---|---|---|
| Salon | Provide the service | Contract (Art. 6(1)(b)) |
| Salon | Billing | Contract (Art. 6(1)(b)) |
| Salon | Customer support | Contract + legitimate interest |
| Salon | Product improvement | Legitimate interest (Art. 6(1)(f)); opt-out via Settings |
| Salon customer (P7) | The salon's lawful basis (consent + contract typically) | Per the salon |
| Visitor | Anonymous analytics | Legitimate interest |
| Visitor | Contact form response | Consent / contract preparation |

## 6. Where data lives

- All tenant data (your salon + your customers' data) lives in the EU/Ireland region of our hosting.
- Per `docs/policy/data-residency.md`.
- Subprocessors per `sub-processors.md`.

## 7. Who we share data with

Subprocessors per `sub-processors.md`. Categories:
- Hosting + storage (Replit / cloud providers).
- Authentication (Clerk).
- Email (Resend).
- SMS + voice (Twilio).
- AI inference (Anthropic, via Replit AI Integrations proxy).
- Error monitoring (Sentry).
- Analytics (Plausible — anonymous-only).
- Payments (Stripe).

Otherwise: we don't share. Specifically:
- **We don't sell.**
- **We don't share with marketers.**
- **We don't share with data brokers.**
- **We don't share with AI training pipelines** — Anthropic API tier is zero-retention for training.

We may share if compelled by law (subpoena, court order). In those cases, we minimise disclosure + notify you unless legally prohibited.

## 8. How long we keep data

Per `docs/policy/data-retention.md`. Headlines:
- Booking records: 7 years post-cancellation (tax/audit minimum).
- Customer profiles: 30 days after deletion.
- Conversation transcripts: 90 days, then summarised + raw discarded.
- Voice recordings: OFF by default; 30 days if enabled.
- Analytics: 24 months aggregated.

## 9. Your rights (GDPR)

You have the right to:
- **Access** your data (free; we'll provide within 30 days).
- **Portability** — export in machine-readable format.
- **Rectification** — correct inaccurate data.
- **Erasure** ("right to be forgotten") — request deletion.
- **Restriction** — pause processing.
- **Object** to processing based on legitimate interest.
- **Not be subject to automated decisions** with legal/significant effect (see § 12 on Liv).

Exercise any right by emailing **privacy@livia.io**. We respond within 30 days.

## 10. Salon customers (P7) — your rights

Your salon is the controller for your data. Direct requests to your salon. If you can't reach them or they don't respond, contact **privacy@livia.io** and we'll forward + escalate.

## 11. Cookies + similar

Per `cookie-policy.md`. Headlines:
- `livia.io` marketing site: minimal cookies; no tracking; no cross-site.
- Dashboard: session cookie (HttpOnly, Secure, SameSite=Lax).
- Customer booking widget: minimal session storage; no third-party cookies.

## 12. AI / automated decision-making (Liv)

Liv is an AI agent. Things to know:

- Liv discloses itself as AI to your customers per EU AI Act Art. 50.
- Liv operates within capability scope you grant per role (cap-bound).
- Liv decisions affecting customer money (refunds) follow a cap-bound ladder; high-cap decisions escalate to humans.
- Liv decisions are eval-tested before deployment per ADR 0016.
- Customers can request human review of any Liv decision affecting them.
- Liv does not make decisions with legal effect on customers without human-in-the-loop fallback.

## 13. International transfers

Tenant data stays in EU. The two cross-region exceptions per `docs/policy/data-residency.md`:
- **LLM inference** to Anthropic — they process per their default region per Anthropic Commercial Terms; no training on data.
- **Push notification dispatch** — APNs (Apple) + FCM (Google); payload contains only headline + deep link (no PII beyond first-name initial).

## 14. Security

Per `docs/policy/security-policy.md`. Headlines:
- TLS 1.3 minimum.
- AES-256 at rest.
- MFA mandatory for owner-tier roles.
- Hash-chained audit log.
- Annual external pen-test (publication of summary at v1.5).
- Bug bounty programme at v1.5.

## 15. Breach notification

Per `docs/engineering/incident-response.md`:
- DPA notification within 72 hours per Art. 33 if breach is "likely to result in risk."
- Affected controller (your salon) notification simultaneous.
- Affected customers (P7) notified by their controller (your salon) per Art. 34 if high-risk.

## 16. Children

We don't knowingly collect data from children under 16. If you're a salon and you collect data from children (e.g., children's hair salon), that's your responsibility per the controller relationship.

## 17. Changes to this policy

- Material changes: 30 days email notice + dashboard banner.
- Non-material changes: changelog entry on `livia.io/legal/privacy/changelog`.

## 18. Contact

- Privacy questions / data subject requests: **privacy@livia.io**
- General: **founder@livia.io**
- DPC IE (Ireland's GDPR supervisory authority): you may complain directly to the Data Protection Commission, 21 Fitzwilliam Square South, Dublin 2, [www.dataprotection.ie](https://www.dataprotection.ie).

---

**Drafting notes (delete pre-publication):**

- Counsel: please review § 9 (rights) and § 12 (Liv / Art. 22) for full GDPR + EU AI Act conformity.
- Per-market additions needed (UK at v1.5; Nordic data protection authorities at v2; per-market controllers at v3).
- DPC IE complaint route mentioned per best practice; counsel to confirm whether we should mention other DPAs at v1.5 expansion.
