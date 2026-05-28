# Disaster recovery & backups (Livia Inc)

**Status:** v1.0 scaffold (2026-05-21) — **fill RPO/RTO from Supabase contract**  
**Owner:** founder + head of eng  
**Reads with:** [`../product/LIVIA-RESILIENCE-OPS-AND-TRUST.md`](../product/LIVIA-RESILIENCE-OPS-AND-TRUST.md) · [`../policy/data-retention.md`](../policy/data-retention.md)

---

## 1. Scope

| In scope | Out of scope |
|----------|--------------|
| Postgres tenant data (Supabase) | Tenant-owned Xero/BrightPay |
| Audit log integrity post-restore | Anthropic model weights |
| Object storage for exports/logos | Clerk user directory (restore via Clerk) |

---

## 2. Targets (fill from provider SLA)

| Metric | Production target | Staging target | Source |
|--------|-------------------|----------------|--------|
| **RPO** (max data loss) | **≤15 min** (Pro PITR) — verify plan | 24h | Supabase PITR / daily backup |
| **RTO** (max downtime) | **4h** target (api + dashboard redeploy) | 8h | Runbook practice |
| Backup retention | 30 days rolling | 7 days | `data-retention.md` |

**Action:** After Supabase project review, replace `_TBD_` and never market stricter than provider.

---

## 3. Backup sources

| System | Backup mechanism | Restore owner |
|--------|------------------|---------------|
| **Supabase Postgres** | Automated PITR / daily snapshots (plan-dependent) | Eng + founder |
| **Supabase Storage** | Bucket replication | Eng |
| **Inngest** | Event history + replay | Eng — rebuild from domain events if needed |
| **Stripe** | Stripe-hosted | Finance |
| **Application config** | Git + env secrets in vault | Eng |

---

## 4. Annual drill (required)

1. Pick a **staging** project (never prod first).  
2. Restore latest backup to an isolated DB.  
3. Run audit chain tip verification (`audit-chain.test.ts` against restored DB).  
4. Run erasure re-purge script if test data includes deleted subjects.  
5. Document actual elapsed RTO in this file’s changelog.  
6. File post-mortem if drill fails.

**Next drill due:** _schedule after first Supabase prod pin (launch #57)_

---

## 5. Failover decision tree

```text
Customer impact?
  ├─ No → SEV3, fix forward
  └─ Yes → SEV1/2
        ├─ Last deploy < 2h? → Rollback deploy first
        ├─ DB connectivity? → Supabase status + failover
        ├─ Vendor (Twilio/Stripe)? → Status + comms; no code rollback
        └─ Data corruption? → Stop writes → restore staging proof → prod restore
```

---

## 6. Post-restore checklist

- [ ] All migrations applied in order  
- [ ] Webhook endpoints re-registered (Stripe, Twilio)  
- [ ] Inngest functions connected  
- [ ] Smoke: healthz, public book, one authenticated booking  
- [ ] Audit sample: 10 random tenants chain valid  
- [ ] Status page “resolved” + tenant comms if needed  

---

## Changelog

| Date | Change |
|------|--------|
| 2026-05-21 | Initial scaffold (R1) |
