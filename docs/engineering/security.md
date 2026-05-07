# Security posture

**Status:** v1 (2026-05-07). Reads with `docs/policy/access-control.md`, `docs/policy/security-policy.md`, `docs/policy/vulnerability-disclosure.md`.

## Posture

Security is a property of the system, not a feature. Trust-amplification (Bet 2) requires that every claim we make about safe handling of customer data is true at the architecture level, not just at the policy level.

## The seven security commitments

### 1. Defence in depth

- App-level tenant scoping (query helpers).
- Postgres RLS (second line).
- Per-artifact DB roles (least privilege).
- Network-level isolation (VPC, security groups).
- Audit log for break-glass (ADR 0015).

A failure at any layer is caught by the next.

### 2. EU residency by default

- All compute + storage in EU (Frankfurt primary; Dublin replica).
- All vendor selection requires EU-residency option (per ADR 0017 + `docs/policy/data-residency.md`).
- No cross-region replication outside EU.

### 3. Encryption everywhere

- TLS 1.3 minimum on the wire (HSTS preload).
- Postgres at rest: provider-managed AES-256.
- Object storage: SSE-KMS with provider-managed keys.
- Tenant-managed BYOK at v3 enterprise tier.
- Backups encrypted; backup keys rotated per access-control policy.

### 4. Identity + authentication

- Clerk for human auth (per ADR 0003).
- MFA enforced for all OWN/ADM/ADM-D roles by v1 ship.
- SSO (SAML/OIDC) for enterprise tier at v3.
- Service-to-service auth via mTLS or signed JWTs (no shared secrets in headers).

### 5. Least privilege

- Roles per `docs/policy/access-control.md`.
- DB roles per artifact per principle 7 in `principles.md`.
- Cloud IAM roles per service; no human assigned admin without break-glass.

### 6. Auditability

- Audit log per ADR 0015 (hash-chained, append-only, EU-resident).
- Break-glass operations logged + Owner-disclosed within 24h.
- Eval suite traces (per ADR 0016) provide audit material for AI-decision review.

### 7. Vulnerability discipline

- Dependency scanning (`pnpm audit` + Dependabot equivalent) on every PR.
- SAST in CI (semgrep or equivalent).
- DAST quarterly against staging.
- Annual external penetration test (third-party EU firm).
- Bug bounty programme at v1.5 (post-stability).

## AppSec rules (the things engineers must do)

### Input validation
- All input through Zod schemas (`packages/schema/`).
- No raw SQL (per data-model rules); query helpers only.
- Output encoded for context (HTML escape; SQL parameterised; URL-safe).

### Authentication & authorisation
- Every endpoint requires authentication unless explicitly marked public (booking widget, marketing site).
- Authorisation checked per request; never assumed from session.
- Scope checks per ADR 0009/0010 enforced at query layer + endpoint layer (defence in depth).

### Secret handling
- No secrets in code, in git, in logs, in errors.
- Secrets via env vars + cloud secret manager; rotated per `docs/policy/access-control.md`.
- Pre-commit hook + CI scan blocks accidental commits.

### Logging
- Structured logging only (`pino`).
- PII redaction at the logger level.
- Stack traces include request_id; never include user passwords/tokens.

### Sessions
- Cookie-based via Clerk; `Secure`, `HttpOnly`, `SameSite=Lax`.
- Session timeout: 30 days max for web; 90 days for mobile (with biometric re-auth on sensitive actions per ADR 0011 N2).

### CSRF
- SameSite cookies + CSRF tokens for state-changing endpoints.
- Public booking endpoints use per-tenant signed URLs.

### XSS
- React for surface rendering (escapes by default).
- No `dangerouslySetInnerHTML` without explicit RFC + content-source review.
- CSP header strict; no inline scripts; nonce-based for unavoidable cases.

### Headers
- HSTS preload.
- CSP per artifact.
- X-Content-Type-Options: nosniff.
- X-Frame-Options: DENY (except embed-allowed surfaces).
- Referrer-Policy: strict-origin-when-cross-origin.
- Permissions-Policy: minimised.

### File uploads
- MIME validation + content sniffing.
- Per-tenant object storage prefix (no cross-tenant blob access).
- Virus scanning (ClamAV-equivalent) on uploads.
- File size limits per type.

## Supply chain security

- Lockfile committed (`pnpm-lock.yaml`).
- Dependency updates via Renovate or Dependabot; auto-merge minor + patch on green CI; manual review for major.
- New top-level dependency requires PR review with security justification.
- License audit in CI (no GPL in artifacts; GPL OK in tooling).

## Incident response

Per `docs/engineering/incident-response.md`. Security incidents (`SEV-SEC`) get parallel handling: ops runbook + counsel notification + per-market regulatory clock (GDPR 72-hour for breach; per-market specifics in `regulatory-and-legal.md`).

## Compliance posture

Per `docs/business/regulatory-and-legal.md`:
- GDPR (default operating model).
- EU AI Act (treated as plausibly high-risk; built accordingly).
- PSD2/SCA (Stripe-handled).
- SOC 2 Type 1 at Gate 3 of `launch-plan.md`; Type 2 at v3.
- ISO 27001 at v3+ (enterprise demand-driven).

## What we don't claim

- We don't claim "military-grade encryption" — that's marketing fluff.
- We don't claim "end-to-end encryption" — Liv reads conversations to operate; that's not E2EE.
- We don't claim "zero-knowledge" — same reason.
- We claim what we do: EU residency; audit-log spine; per-tenant runtime isolation; eval-driven; trust-amplification.

## Annual review

This doc + `docs/policy/security-policy.md` reviewed annually by founder + head of engineering + counsel. Last review: 2026-05-07. Next: 2027-05.

## Open questions

- Bug bounty at v1 vs v1.5 — pulling earlier signals goodwill but adds noise; currently v1.5.
- WAF (Cloudflare or AWS WAF) — currently provider-managed; revisit at scale.
