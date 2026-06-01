# Tenant authority & ownership succession

**Status:** canonical (2026-06-02)  
**Policy:** `lib/policy/src/ownership-succession.ts`  
**API:** `POST /api/businesses/:id/transfer-ownership` · `GET …/ownership-candidates`  
**UI:** Settings → **Ownership** · `/lifecycle` (G8 nudge)

---

## Why this exists (business + legal)

Livia’s **tenant** is one `business` row — one salon/studio on the contract, one Stripe customer, one data controller for that shop’s customer data ([`tenancy-and-billing.md`](../policy/tenancy-and-billing.md)).

**Ownership** is who holds that relationship:

| Layer | What it is | Product surface |
|-------|------------|-----------------|
| **Legal / contract** | Entity paying for Livia; DPA signatory for that shop | `businesses.owner_id` + OWNER membership |
| **Billing** | Stripe customer email, plan, payment method | Owner-only Settings → Plan |
| **Operational** | Calendar, inbox, Liv mandate, day-to-day | Owner + Admin + Staff memberships |
| **Roster** | Names on the chair chart (may never log in) | Team / Staff profiles |

Confusing **roster** with **sign-in** is the #1 support trap: “I have three staff — why can’t I transfer?”

**Answer:** Calendar staff ≠ Livia login. Succession requires a **real member** (`business_memberships` tied to a Clerk user) who has accepted an invite.

---

## G8 — Ownership succession (configuration graduation)

Trigger: sale, retirement, partner buy-out, promoting manager to legal owner **at the same tenant**.

**Data:** Same `businessId`. `owner_id` changes. Audit event `tenant.ownership_transferred`.

**Not:**

- Inviting someone to work the floor (G1 — use Team invite).
- Opening a second location (G3 — new `business`).
- Sharing one login (forbidden — each human gets their own Clerk account).

**Outgoing owner** chooses: stay as ADMIN, stay as STAFF, or REVOKE (leave studio).

**Incoming owner** must already be ADMIN or STAFF with accepted invite.

**Customers / Liv:** No automatic announcement to clients or staff; human decides comms.

**Billing:** Subscription stays on tenant; Stripe customer contact updates to new owner when connected.

**Irreversibility:** v1 — no self-serve undo; support + audit for mistakes (30-day misclick policy in graduation doc is **target**, not fully automated yet).

---

## Platform-wide rules (keep in sync)

| Concern | Rule | Where enforced |
|---------|------|----------------|
| Tenant scope | All mutations scoped by `businessId` | API middleware |
| Owner-only succession | `requireRole("OWNER")` on transfer + candidates | `lifecycle.ts` |
| Owner-only billing | Settings Plan tab | `settings-persona.ts` |
| Invite ≠ ownership | Team invite (`/invitations`) vs succession invite (`/ownership-invitations`, OWNER only) | `invitations.service.ts` · `lifecycle.ts` |
| Transfer needs membership | `INCOMING_NOT_MEMBER` if no row | `ownership-transfer.service.ts` |
| Roster optional login | `staff.user_id` nullable | DB schema |
| Multi-shop founder | Transfer is **per business** | `ownership-transfer.service.ts` |
| Account delete vs shop | Deleting Clerk user ≠ deleting business | `tenancy-and-billing.md` |

---

## Copy / UX principles

1. Say **“pass the keys”** or **“ownership”** — not vague **“Transfer”** alone.
2. Always show **two lists** when relevant: ready (signed-in members) vs roster-only (invite first).
3. **Succession invite** on Ownership tab — not Team → Invite (team invite is day-to-day only).
4. Settings **Account** tab = **your** Clerk login; **Ownership** tab = **studio** authority.

---

## Related surfaces to align

| Surface | Should say |
|---------|------------|
| Team / Staff | “Calendar profile” vs “Invite to sign in” |
| Settings → Ownership | This doc |
| Settings → Account delete | Hand over studio first (Ownership) |
| Lifecycle G8 nudge | Link to Ownership tab |
| Demo “3 staff Solo” nudge | Staff count ≠ sign-in count; G8 only when `eligibleSuccessorCount ≥ 1` (policy) |
| Team invite roles | Admin + Staff only; both eligible for succession after accept |

---

## Deferred (post-v1)

- Pending Clerk invite visible on Ownership tab (invite sent, not accepted).
- Self-serve rollback window (30 days).
- Transfer to email not yet on team (invite + transfer in one flow).
- Chain-level holding company / org billing rollup.
