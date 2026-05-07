# Policy — Acceptable use

**Status:** v1 (2026-05-07)
**Anchors:** `docs/legal/terms-of-service.md` § Restrictions; `docs/policy/data-residency.md`; Anthropic Acceptable Use Policy; Twilio AUP; Stripe AUP.

## Posture

Livia is built for legitimate appointment-based service businesses operating lawfully in the EU/IE/UK. Acceptable use defines what tenants may + may not do with the product. Violations may result in suspension or termination.

This is the operator-facing version. The customer-facing legal version lives in `docs/legal/terms-of-service.md` § Restrictions.

## Permitted use

- Operating an appointment-based service business lawfully in jurisdictions where Livia operates.
- Communicating with customers (CT2 Regulars, CT3 New, etc.) about their bookings, services, and the salon.
- Storing customer data in service of providing services to those customers.
- Using Liv to draft, send, and respond to customer communications about salon business.
- Sharing aggregate anonymous data to peer-set insights (opt-in per `cross-tenant-intelligence.md`).
- Configuring Liv with shop-specific tone, knowledge, and policies.
- Onboarding staff, customers, services, and bookings as needed.

## Prohibited use

The following are grounds for immediate suspension + investigation:

### Content + communication
- Sending unsolicited marketing or spam to people who haven't booked or shown interest.
- Sending content that violates the WhatsApp Business Solution policies, Twilio AUP, or Apple Push Notification Service rules.
- Using Liv to harass, threaten, defame, or discriminate against any person.
- Using Liv to send sexually explicit, hateful, or unlawful content.
- Impersonating another person or business.

### Data + privacy
- Collecting customer data for purposes other than operating the salon (e.g., resale, marketing-list-building outside the tenant).
- Storing customer data on behalf of someone else (sub-processing without disclosure).
- Bypassing GDPR consent + erasure obligations.
- Using customer data for purposes the customer didn't consent to.
- Importing customer data the tenant doesn't have lawful basis to hold.

### Service operation
- Reverse-engineering Liv to build a competing product.
- Scraping the platform.
- Probing for vulnerabilities outside the bug-bounty programme (per `vulnerability-disclosure.md`).
- Operating the platform in a way designed to overload subprocessor quotas (e.g., abusing Twilio voice minutes).
- Operating multiple tenant accounts to evade rate limits, pricing, or terms.

### Industry-specific
- Operating a vertical that isn't supported (e.g., trying to use Hair-templates for a regulated medical clinic).
- Offering services prohibited by jurisdiction (e.g., CBD-related services where unlawful; massage-services where licensure is required and absent).
- Failing to maintain insurance + licensing required for the salon's vertical.

### Business model
- Operating Livia in a marketplace model (insertion between salon and customer for commission) without explicit Livia agreement.
- White-labelling Livia without explicit agreement (see `governance/ip-and-contribution.md`).
- Operating Livia for a regulated industry without disclosing that to Livia + counsel review (e.g., medspa without informed-consent setup; allied health without compliance review).

## Enforcement

### Detection
- Eval suite signal anomalies (e.g., unusually-high refund rate; unusual outbound message volume).
- Customer complaints (forwarded by tenants to Livia).
- Subprocessor abuse signals (Twilio reports of A2P violation; Anthropic content-policy violation).
- Audit log review for break-glass-revealed misuse.

### Response
1. **First-touch suspected violation:** CS contacts Owner within 24h; provides evidence; gives Owner chance to respond + remediate.
2. **Confirmed violation:** depending on severity:
   - Warning + 7-day remediation window.
   - Feature-restriction (e.g., outbound DM disabled).
   - Tenant suspension (read-only mode; data preserved; Owner export available).
   - Tenant termination per `docs/policy/data-retention.md` departure flow.
3. **Severe violation** (illegal content; deliberate fraud; data abuse): immediate suspension + counsel-led response + per-market regulatory notification if required.

### Appeal
- Owner may appeal to founder within 14 days of suspension/termination.
- External-counsel-mediated for disputes Livia + Owner can't resolve.

## What we don't enforce

- We don't police the salon's customer-treatment style (within lawful bounds + the brand voice we lend Liv to).
- We don't police pricing or discounting within the salon's market.
- We don't police competitive practices between tenants (a salon competing with another salon down the street is not our business).

## Vendor cascade

These prohibited uses are also constrained by our subprocessors. Violations of Anthropic's AUP, Twilio's AUP, or Stripe's AUP may force us to suspend the tenant immediately + report upstream as required.

## Annual review

Reviewed annually + on substantive policy change at any subprocessor. Last review: 2026-05-07. Next: 2027-05.

## Open questions

- Should we publish AUP enforcement statistics annually (transparency report)? (Currently no; revisit at v1.5.)
- Should "marketplace model" prohibition be relaxed for partner programme at v3? (Specific carveout TBD.)

## EU/IRE residency

Enforcement actions audited + retained in EU/IRE region.
