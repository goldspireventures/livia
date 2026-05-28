# SOC 2 control mapping (draft)

**Status:** v0.1 (2026-05-26) — Type 1 prep  
**Companion:** [`soc2-type1-kickoff-checklist.md`](./soc2-type1-kickoff-checklist.md)

| TSC criterion | Control intent | Livia implementation | Evidence location |
|---------------|----------------|----------------------|-------------------|
| CC6.1 | Logical access | Clerk auth, RBAC `requireRole`, internal ops secret | `artifacts/api-server/src/lib/auth.ts` |
| CC6.2 | Registration / removal | Clerk user lifecycle, membership revoke | `staff.service.ts`, invitations |
| CC6.3 | Role separation | OWNER / ADMIN / STAFF, persona rituals | `lib/policy`, dashboard nav |
| CC7.2 | System monitoring | Sentry (web/api), structured logs | `lib/sentry.ts`, pino |
| CC7.3 | Incident response | Runbook + `liv_error` workflow | `docs/engineering/incident-response.md` |
| CC8.1 | Change management | GitHub PR + CI | `.github/workflows/ci.yml` |
| CC9.2 | Vendor risk | Subprocessor list in DPA draft | `docs/legal/` |
| A1.2 | Processing integrity | Hash-chained audit log | `@workspace/audit-log`, `/audit` |
| C1.1 | Confidentiality | Tenant-scoped DB queries | Drizzle services |
| P1.1 | Privacy notice | Privacy policy (counsel) | Gate 3 legal pages |
| P3.2 | Data disposal | Tenant delete cascades | schema `onDelete` |
| PI1.1 | AI transparency | `lib/ai-disclosure` | chat, SMS, voice, email |

## Gaps before Type 1 observation

- [ ] MFA on all vendor consoles (founder)
- [ ] Backup/restore drill documented
- [ ] Production EU region ADR (#57)
- [ ] Access review log (quarterly)
