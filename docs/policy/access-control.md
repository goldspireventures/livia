# Policy — Access control

**Status:** v1 (2026-05-07)
**Anchors:** ADR 0003 (Clerk auth), ADR 0009 (roles), ADR 0014 (isolation), ADR 0015 (audit log). Legal: GDPR Art. 32 (security of processing).

## Posture

Least privilege. Defence in depth. Every access logged. Break-glass exceptional + Owner-disclosed.

## Customer-facing access (memberships)

Per `docs/engineering/data-model.md` + ADR 0009/0010:
- All access by a customer's staff/owner happens through `memberships`.
- Membership has explicit `role`, `scope`, `cap_*` fields.
- Application enforces at query layer; Postgres RLS enforces as second line.
- MFA enforced for OWN/ADM/ADM-D by v1 ship. Optional for STA/REC at v1; mandatory by v1.5.

### Role capability matrix (summary; full in ADR 0009)

| Capability | OWN | ADM | ADM-D (scoped) | STA | REC |
|---|---|---|---|---|---|
| View shop calendar | ✅ | ✅ | ✅ (scope only) | ✅ (own) | ✅ |
| Edit shop calendar | ✅ | ✅ | ✅ (scope only) | ❌ | ✅ (limited) |
| View customer database | ✅ | ✅ | ✅ (scope only) | ✅ (own) | ✅ |
| Issue refund | ✅ unlimited | ✅ to cap | ✅ to cap (scope) | ✅ to cap (own) | ❌ |
| Approve time-off | ✅ | ✅ | ✅ (scope) | ❌ | ❌ |
| Edit AI training | ✅ | ✅ | ❌ | ❌ | ❌ |
| Manage billing | ✅ | ❌ | ❌ | ❌ | ❌ |
| Invite staff | ✅ | ✅ | ❌ | ❌ | ❌ |
| View audit log | ✅ | ✅ (own actions) | ✅ (scope, own) | ✅ (own only) | ✅ (own only) |
| Configure cross-tenant intelligence opt-in | ✅ | ❌ | ❌ | ❌ | ❌ |

### Delegation

- `delegations` table makes temporary capability uplift first-class (per ADR 0010).
- Time-bounded; revocable; logged.
- Cannot delegate beyond delegator's own caps.
- OWN can grant `OWN-temp` for owner-on-holiday; expires automatically.

## Internal access (Livia team to production)

### Standing access
- **None for production data.** No engineer has standing read/write access to production tenant data.
- Engineers have read access to anonymised staging data + their own test tenants.
- Ops engineers have logging + observability access (sanitised — PII redacted at logger).

### Break-glass
- For production debugging requiring tenant-data access:
  - Founder + on-call engineer co-approve.
  - Time-bounded session (default 60 min; max 4 hours).
  - Audit-logged per ADR 0015 with `actor=livia-staff`, `purpose=<reason>`, `tenant=<id>`.
  - **Owner notified within 24h** with: who, when, what was viewed, why.

### Customer support access
- CS staff can read customer support chat history + Owner-shared screenshots without tenant impersonation.
- For deeper debugging, CS escalates to engineering break-glass.

### Impersonation
- Per `impersonation-audit.md`. Owner-of-tenant can impersonate their own staff (audit-logged + staff-disclosed in weekly digest).
- Livia staff can NOT impersonate tenant users without break-glass.

## Service-to-service access

- Each artifact has its own DB role (`api_server_app`, `dashboard_read_only`, etc.).
- Roles have minimum-necessary GRANTs.
- Service-to-service auth via mTLS or signed JWTs; no shared secrets in headers.
- Rotation: quarterly for service tokens; immediate for any suspected compromise.

## Cloud / infrastructure access

| Resource | Standing access | Break-glass access |
|---|---|---|
| Production DB | None | Founder + head of eng (co-approve); session-bounded; audit-logged |
| Production object storage | None | Same as above |
| Production logging | Engineers + ops | N/A |
| Production observability | Engineers + ops | N/A |
| Cloud console | Founder + head of eng (admin); ops engineer (read) | N/A |
| Stripe production | Founder + head of CS | Counsel for legal-required disclosure |
| Clerk production tenant | Founder + head of eng | Same |
| DNS | Founder + head of eng | N/A |

## Secret rotation

| Secret class | Rotation cadence | Trigger |
|---|---|---|
| Service tokens | Quarterly | Auto |
| API keys (Stripe, Twilio, Resend, Anthropic) | Annually | Auto + on-suspected-compromise |
| Database passwords | Annually | On any access change |
| Encryption keys (DB at-rest) | Provider-managed | Provider cadence |
| Customer-tenant BYOK keys (v3) | Customer-managed | Customer policy |

## Onboarding + offboarding

### Onboarding
- IP assignment + confidentiality signed (per `governance/ip-and-contribution.md`).
- Day 1 access: company SSO, Slack, GitHub, Linear, doc tree, eval dashboard. NO production data access.
- Day 30+ access: scoped per role; standing prod-data access remains zero.

### Offboarding
- Same-day revocation of all credentials + SSH keys + service tokens.
- Same-day audit log entry.
- 24h post-departure: full credential rotation for any system the departing person had elevated access to.
- 30 days: review of any code commits / decisions in the trailing 30 days for hand-off.

## Annual review

Reviewed annually + on substantive change. Last review: 2026-05-07. Next: 2027-05.

## Open questions

- Should we adopt mandatory hardware MFA (YubiKey) for OWN-role on customer side? (Currently strong-MFA via authenticator app; revisit at enterprise tier.)
- Break-glass session length 60 min — too long? (Revisit per actual usage data after 6 months.)

## EU/IRE residency

All access logs, all audit log entries, all rotation records — EU-resident.
