# Data subject map (EU tenants)

**Status:** v1.0 scaffold — **counsel review before G3 publish**  
**Reads with:** [`customer-data-rights.md`](../legal/customer-data-rights.md), [`data-retention.md`](./data-retention.md)

| Data subject | Examples stored | Lawful basis (indicative) | Export | Delete |
|--------------|-----------------|---------------------------|--------|--------|
| **Shop owner** | Clerk id, email, membership | Contract | Dashboard + DSR runbook | Account closure flow |
| **Staff** | Membership, display name | Contract | Admin export | Deactivate membership |
| **End customer** | Name, phone, email, bookings | Legitimate interest / contract | Per-business export API (G3) | Anonymise on request |
| **Conversation** | Messages, channel metadata | Contract | Ticket + logs with consent | Retention per `data-retention.md` |

**Processors:** Clerk, Supabase, Stripe, Twilio, Resend, Anthropic, Sentry — see `legal/sub-processors.md`.
