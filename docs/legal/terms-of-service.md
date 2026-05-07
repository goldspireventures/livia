# Terms of Service (DRAFT — pre-counsel-review)

**Status:** Draft v1 (2026-05-07). NOT YET COUNSEL-REVIEWED. Will be revised before publication on `livia.io/legal/tos`.

**Effective date:** TBD (post-counsel-review)
**Operator:** Livia Technologies Ltd, registered in Ireland, [registered number TBD], [registered address TBD].

## 1. Who this agreement is between

This agreement is between **Livia Technologies Ltd** ("Livia", "we", "us") and **the business** ("you", "the Salon") that uses the Livia service.

By creating an account, you agree to these Terms.

## 2. The service

Livia is an AI-native operating service for appointment-based service businesses. It includes:
- The web dashboard at `app.livia.io`.
- The mobile app on App Store + Play Store.
- The customer-facing booking page at `b.livia.io/<your-slug>`.
- Liv, the AI agent that handles communications + operational tasks for your business.
- Voice receptionist (where enabled).
- WhatsApp + SMS booking flows.
- Audit log + reporting surfaces.

## 3. Your account

- You must be 18+ and the legal operator of the salon you register.
- You must provide accurate information.
- You're responsible for keeping your credentials safe.
- You're responsible for the actions of the people you invite to your salon.
- You agree to enable MFA for the OWN role by Gate 3 of our launch (the v1 ship date).

## 4. Subscription + payment

- Pricing per `livia.io/pricing`.
- Billed monthly or annually as you choose.
- Payments via Stripe.
- Upgrades pro-rate immediately; downgrades take effect next billing period.
- We may change pricing for new sign-ups at any time; existing subscribers get 30 days notice + ability to lock current pricing for 12 months by paying annually before change.

## 5. Voice receptionist outcome share

Where you've enabled the voice receptionist, we charge a 4% outcome share on bookings made via voice, capped at €5 per booking. This is in addition to your subscription. Per `livia.io/pricing` for full terms.

## 6. Your data

- Your customer data, your bookings, your communications history — yours.
- You own it; we hold it as data processor (GDPR Art. 28).
- We process it per `dpa-template.md` (the DPA you sign at sign-up).
- We will never sell your data.
- We will never use it to train external AI models.
- We may use anonymised aggregated data for cross-tenant intelligence ONLY if you opt in (per `cross-tenant-intelligence.md`).

## 7. Liv (the AI agent)

- Liv handles communications and operational tasks per the rules you configure.
- Liv may make mistakes. We commit to:
  - "Liv was wrong" surface: every Liv decision is reviewable.
  - Cap-bound roles: Liv operates within the scope you grant per role.
  - Refund-rollback: Liv-issued refunds can be reviewed + reversed within the cap-ladder.
- Liv discloses itself as AI to your customers (EU AI Act Art. 50).
- Liv refuses certain content classes per our brand-of-Liv refusal posture.
- Per ADR 0016: Liv decisions are eval-tested before deployment.

## 8. Acceptable use

You agree not to use Livia for:
- Unsolicited marketing or spam.
- Harassment, defamation, discrimination.
- Content that violates WhatsApp Business policies, Twilio AUP, or Apple/Google policies.
- Reverse-engineering or building a competing product.
- Operating the platform in a way that overloads our infrastructure.
- Any unlawful purpose.

Full list per `docs/policy/acceptable-use.md` (operational version) and `livia.io/legal/aup` (customer version, when published).

Violation may result in suspension or termination per the AUP enforcement process.

## 9. Service levels + availability

- We target 99.9% monthly uptime for core services (booking page, voice receptionist, Liv responses).
- Status page at `status.livia.io`.
- Service credits for sustained outages per Stripe Billing terms.
- We're not liable for outages caused by subprocessors beyond reasonable mitigation (per Schedule 2 of the DPA).

## 10. Easy to leave

You may cancel any time. On cancellation:
- Your data is exportable (JSON + CSV bundle) on the day you cancel.
- We retain your data for 30 days post-cancellation in case you change your mind.
- After 30 days, we hard-delete per `docs/policy/data-retention.md`.
- Pro-rata refund for unused subscription period (calendar-day basis).
- No early-termination fees.
- No "we'll keep your customer database hostage" tactics.

This is a contractual commitment, not a marketing claim.

## 11. Liability

(Counsel to draft per Irish/EU contract law. Drafting notes:
- Total liability cap = trailing 12 months of fees paid (industry standard).
- Carve-outs for: deliberate breach, IP infringement we caused, GDPR fines we caused.
- No consequential damages — but practical "real losses caused by our failure" needs to be honest, not exclusion-by-default.)

## 12. Disputes

- Try to resolve directly first. Email founder@livia.io.
- Mediation second (EU-based mediator).
- Arbitration third (per ICC EU rules).
- Litigation last (Dublin courts; Irish law).

## 13. Changes to these terms

- Material changes: 30 days email notice + a banner in the dashboard.
- You may cancel before the change takes effect.
- We won't change retroactively.

## 14. Termination by us

We may terminate your account if:
- You breach these terms or the AUP and don't cure within the AUP enforcement process.
- Your payment fails persistently (after multiple retry + outreach).
- You're subject to legal sanctions that prohibit our service.

We will give:
- 30 days notice (except for severe AUP violations or legal-mandated immediate termination).
- Full data export.
- Pro-rata refund.

## 15. Survival

The "easy to leave" commitment, your data export rights, and our confidentiality obligations survive termination.

## 16. Contact

- Service issues: support@livia.io
- Privacy / data subject requests: privacy@livia.io
- Security: security@livia.io
- Other: founder@livia.io

## 17. Counsel-pending sections

The following are intentionally light pending counsel review:

- Limitation of liability (§ 11)
- Force majeure
- Severability + entire agreement boilerplate
- Per-market addenda (UK at v1.5; Nordics at v2; DACH/FR at v3)
- Stripe Connect terms cascade (where you take deposits/tips through Connect)

---

**Drafting notes (delete pre-publication):**

- Counsel: please review focus on §§ 11, 12, 14, and ensure consistency with Irish Companies Act + Distance Selling Regs + e-Commerce Directive.
- Per-market addenda needed for: UK Consumer Rights Act (v1.5), Nordics distance selling (v2), DACH consumer protection (v3), French DGCCRF (v3).
- "Easy to leave" language (§ 10) is a marketing-anchored commitment; counsel to make it legally bulletproof without weakening the customer-facing promise.
- Anti-dark-pattern stance is brand-anchored; counsel to confirm we're meeting EU Consumer Rights Directive obligations exceeding minimum.
