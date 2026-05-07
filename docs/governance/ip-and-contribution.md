# IP and contribution

**Status:** v1 (2026-05-07).

## Posture

Livia is a closed-source commercial product with selective open-source contribution. IP is assigned to the company by employees + contractors; OSS is consumed and contributed-to with discipline.

## Employee + contractor IP

Every employee + contractor signs:
- **IP assignment.** Work product created in the course of work for Livia is assigned to Livia.
- **Confidentiality.** Customer data, business strategy, code, and roadmap commitments treated confidentially.
- **Non-disparagement** (mutual; reasonable; no NDA-as-silencer for misconduct claims).

The IP assignment + confidentiality is signed before any code or doc commit + before access to customer data.

## Pre-existing IP

If a contributor has pre-existing IP they want to bring (a personal library, a prior project, a research artefact):
- Disclosed in writing on day 1.
- Licensed to Livia for use under terms agreed (typically Apache-2.0 or MIT).
- Or carved out from IP assignment with explicit scope.

We don't sneak third-party IP into the codebase.

## OSS consumption

Per `docs/engineering/security.md`:
- Lockfile committed.
- New top-level dependency requires PR review with security justification + license check.
- License audit in CI: no GPL / AGPL / SSPL / business-source-licence in customer-shipping artifacts. Apache-2.0, MIT, BSD, ISC, MPL-2.0 all OK.
- GPL OK in tooling (e.g., a build script that uses a GPL-licensed CLI tool).
- License attributions surfaced at `livia.io/legal/oss-attributions` per Apache-2.0 + MIT requirements.

## OSS contribution from Livia engineers

Engineers may contribute to external OSS projects on company time provided:
- Contribution is to a project Livia uses or benefits from.
- Contribution is reviewed by head of engineering before push (small fixes excepted).
- IP assignment to the OSS project is consistent with Livia's IP assignment policy (typically the project's CLA + Livia's assignment overlap correctly).
- No proprietary Livia code is included in the contribution.

## OSS publication from Livia

Selectively, Livia may publish components as OSS:
- The `aurora` design tokens at v1.5 (planned; per ADR 0007).
- Per-locale Liv corpus tooling at v2+ (planned).
- Eval framework reference implementation at v2+ (planned, partial).

Publication requires:
- RFC.
- Founder + head of engineering sign-off.
- License selection (Apache-2.0 default; permissive matching consumer expectation).
- Commitment to maintenance OR explicit "as-is" disclosure.
- No customer data, customer-specific tuning, or proprietary brand-of-Liv corpus included.

## Trademark

- "Livia" + "Liv" are registered trademarks (in flight at v1; final at v1.5).
- Trademark use by partners requires brand-asset-usage agreement.
- Trademark misuse pursued via legal channels (counsel-led).

## Customer data + IP

- We are processor for customer data, not controller (per `docs/policy/data-residency.md` + DPA).
- Customer-generated content (their booking data, their customer database, their tone-of-voice training data) is theirs. We hold it; we don't own it.
- We may use anonymised, aggregated cross-tenant data (per ADR 0014) only with k≥10 + opt-in.
- We never claim derivative IP rights over customer data.

## AI-generated content

- LLM-generated code (e.g., Replit-Agent-assisted refactors, Claude-suggested tests): treated as authored by the contributor; same IP rules apply; contributor responsible for review + accuracy.
- LLM-generated brand copy: brand stewards review; cannot be merged untouched onto customer surfaces.
- LLM-generated Liv-mouth content: per ADR 0016 eval; cannot ship untested.

## Disputes

- IP disputes between Livia and an employee/contractor go to mediation first; arbitration second; courts last.
- IP disputes with external parties go to counsel.
- We don't pre-emptively sue. We defend when forced.

## Annual review

This doc + IP assignments revisited at foundation audit. Counsel review every 2 years.

## Open questions

- Should we establish a contributor licence agreement (CLA) for any open-sourced components? (Per Apache-2.0 default; CLA only if needed.)
- Should engineers' personal-time OSS contributions to projects Livia *doesn't* use require disclosure? (Currently no; revisit if conflict-of-interest case emerges.)
