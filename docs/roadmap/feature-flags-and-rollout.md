# Feature flags and rollout

**Status:** v1 lock (2026-05-07). Reads with `docs/engineering/release-pipeline.md`.

## Posture

We use feature flags as **rollout control + kill-switch**, not as branching strategy. Flags are temporary by default; permanent flags require explicit ADR.

## Flag taxonomy

| Type | Purpose | Lifetime | Naming |
|---|---|---|---|
| **Release flag** | Hide in-progress feature behind flag during build; flip on once eval-pass + acceptance criteria hold. | ≤90 days; deleted after stable rollout. | `release.<feature-slug>` |
| **Permission flag** | Tenant-tier-bound or role-bound capability (e.g., chair-rental dashboard for C10 hosts only). | Permanent; tied to pricing tier or persona. | `tier.<tier>.<capability>` or `role.<role>.<capability>` |
| **Locale flag** | Capability gated by locale availability (e.g., voice receptionist in en-IE only at v1). | Permanent; flips per locale rollout. | `locale.<lang>-<region>.<capability>` |
| **Vertical flag** | Capability gated by vertical (e.g., class-booking for Fitness only). | Permanent; flips per vertical rollout. | `vertical.<vertical>.<capability>` |
| **Experiment flag** | A/B test or staged rollout for a low-risk decision (e.g., briefing-card layout v1 vs v2). | ≤60 days; concluded by RFC + decision. | `experiment.<topic>.<variant>` |
| **Kill-switch flag** | Emergency disable for a feature in production. | Permanent (always in-place); usually OFF. | `killswitch.<feature-slug>` |

## Rollout sequence (the standard playbook)

A new feature ships through this sequence. Skipping stages requires founder sign-off + RFC.

1. **Internal** (`release.<feature>` ON for `business_id IN (LIVIA_INTERNAL_BUSINESSES)`).
2. **Design partners** (cohort 1 — first 10) — flag ON for those tenants only. Design-partner weekly call surfaces issues.
3. **Cohort expansion** — flag ON for any tenant with `feature_preview_optin = true` (typically ~10–20% who explicitly opt in via Settings → Lab).
4. **Gradual rollout** — flag ON for 10% of remaining tenants (hashed by `business_id`); monitor evals + Owner feedback for 7 days.
5. **50% rollout** — second 7-day window.
6. **100% rollout** — flag ON for all eligible tenants.
7. **Flag retirement** — once stable for 30 days, flag deleted; default code path is on.

## Per-tenant overrides

Flags can be force-ON or force-OFF per tenant for:
- Design-partner roadmap influence.
- Customer-requested kill-switch (a tenant disables a capability).
- Founder-discretionary preview for a strategic prospect.

Per-tenant overrides are logged in the audit log (ADR 0015) — both setting the override AND each invocation of the flag-overridden code path.

## Kill-switches we maintain permanently

These flags exist always; they're OFF unless emergency demands ON:

- `killswitch.voice-receptionist` — disables voice receptionist for all tenants; falls back to "press 1 to leave a message; we'll call you back."
- `killswitch.outbound-dm` — Liv stops sending outbound customer DMs (emergency stop on a content/regulatory issue).
- `killswitch.cross-tenant-intelligence` — disables peer-set publishing.
- `killswitch.audit-log-search` — disables Owner audit log search (used only if a perf incident threatens primary workload).
- `killswitch.refund-auto` — Liv stops auto-issuing refunds; all refunds escalate to human.
- `killswitch.briefing-send` — disables Sunday digest + morning briefing dispatch.

Kill-switches are exercisable in <60 seconds by the on-call engineer. Practice kill-switch drills quarterly.

## What's NOT a flag

- **Branding / surface copy changes.** Done via deploys, not flags.
- **Pricing changes.** Done via tenant tier + Stripe price IDs, not flags.
- **GDPR-compliance-critical capability.** Cannot be flagged off (e.g., audit log writes; right-to-erasure; data residency). Required-on.
- **EU AI Act disclosure surfaces.** Required-on per `docs/policy/data-residency.md` C1/C2.

## Permanent-flag governance

A permanent flag (tier, role, locale, vertical, kill-switch) requires:
- ADR or RFC describing why it's permanent.
- Documentation in this file.
- Annual review in the foundation audit (is it still needed? Should it be retired?).

## Tooling

Flag system:
- **v1:** Postgres-backed flag table + per-request resolver; cached per request; no external vendor.
- **v1.5+:** Evaluate ConfigCat or LaunchDarkly if our flag system creaks at scale; EU-residency required.

## Rollout monitoring

For every release-flag rollout:
- Eval-suite signal (per ADR 0016) monitored continuously.
- "Liv was wrong" surface weighted: any uptick during rollout pauses + investigates.
- Per-tenant cost envelope (ADR 0012) monitored: rollout pause if cost-per-tenant rises >15%.
- Owner sentiment from weekly digest read-receipts + any inbound complaint.

## Open questions

- Should design-partner flag-override discoverable to OTHER design partners? (Currently no — each partner sees only their own.)
- Cohort definition for "feature_preview_optin" — a Settings toggle or invite-only? (Currently leaning Settings toggle for simplicity.)
