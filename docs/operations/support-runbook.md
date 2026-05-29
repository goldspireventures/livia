# Livia Inc — support runbook (internal)

**Portal:** `pnpm dev:internal` → http://localhost:5175  
**Operating model (SLAs, escalation, macros):** [`CUSTOMER-SUPPORT-OPERATING-MODEL.md`](./CUSTOMER-SUPPORT-OPERATING-MODEL.md)  
**Lifecycle:** [`INTERNAL-SUPPORT-LIFECYCLE.md`](./INTERNAL-SUPPORT-LIFECYCLE.md)  
**Investigation (surfaceId, registry):** [`SUPPORT-POINTS-AND-INVESTIGATION.md`](./SUPPORT-POINTS-AND-INVESTIGATION.md)  
**Spec:** [`../company/livia-internal-portal-spec.md`](../company/livia-internal-portal-spec.md)  
**Tenant report issue:** Dashboard → **Report issue** → `POST /support/tickets`

---

## Ticket intake (from businesses)

| Field | Use |
|-------|-----|
| Category | bug · liv_error · billing · feature · other |
| Severity | blocking · annoying · nice_to_have |
| Context | route, `requestId` (server), bookingId, conversationId (when applicable); **`surfaceId`** (target — auto from route map) |

**First response SLA (target):** blocking 4h business hours; annoying 2 business days.

---

## Triage checklist

1. Identify **tenant** (slug, business id) in internal portal.  
2. Copy **`requestId`** from ticket context → logs (`request_id=`) / Sentry.  
3. Read **`surfaceId`** when present → [`SUPPORT-POINTS-AND-INVESTIGATION.md`](./SUPPORT-POINTS-AND-INVESTIGATION.md) §5 registry (or §4.2 catalog until registry ships).  
4. Open **health card** — last booking, SMS, subscription.  
5. Reproduce on **demo tenant** same vertical if possible (`/demo` → Open as owner).  
6. Check **audit log** (tenant) for booking/policy changes.  
7. **Liv errors** — review conversation id + prompt pack in Settings → Liv.  
8. **Do not** use removed **Hiring** APIs — team issues = invitations / Clerk.  
9. Code fix in the correct **ring** — policy/API/UI — see [`COMPOSABLE-EVOLUTION.md`](../engineering/COMPOSABLE-EVOLUTION.md).

---

## Common issues (2026 OS)

| Symptom | Likely cause | Action |
|---------|--------------|--------|
| "Hiring" missing | Removed by design | Point to Team → Invite |
| Operations in toolkit | Removed | Liv command + sidebar rituals |
| Running late not sent | No Twilio / no phone | Settings → Comms; customer phone |
| Leave not blocking calendar | Not approved | Rota approvals |
| Wrong vertical copy | Wrong vertical on business | Settings; re-seed not automatic |
| Double scroll | Fixed Phase A | If returns, capture browser |

---

## Automation (Phase F)

- Classify ticket category from description.  
- Attach last 20 audit events + booking context.  
- Suggest doc section from [`../business/OPERATOR-READY-PACK.md`](../business/OPERATOR-READY-PACK.md).

---

## Escalation

- **Kill switch Liv** — founder / on-call only.  
- **Data export (DSR)** — legal checklist.  
- **Security incident** — [`../engineering/incident-response.md`](../engineering/incident-response.md).
