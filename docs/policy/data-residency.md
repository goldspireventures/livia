# Policy — Data residency

**Status:** v1.1 (2026-05-24)
**Anchors:** ADR 0002 (`businessId` scoping), ADR 0010 (multi-tenant model). Legal references: GDPR Art. 28 (processor obligations), Art. 32 (security of processing), Art. 44-50 (international transfers); EU AI Act Art. 50 (transparency obligations for AI systems interacting with humans).

## Posture

Livia is built for EU/Ireland appointment-based service businesses. Tenant data — bookings, customers, conversations, AI training material, audit logs — lives in the **EU region** of our hosting and database providers and stays there. Cross-region replication for disaster recovery, where it exists, is to other EU regions only.

This is a non-negotiable product property. It is repeated at the bottom of every policy document so it is impossible to overlook.

## Subprocessor map

Each row names a subprocessor, what data it sees, where it processes, and the legal basis we rely on.

| Subprocessor | Purpose | Data it sees | Region | Basis |
|---|---|---|---|---|
| **Supabase (Postgres + Storage)** | Tenant database and file storage (logos, customer photos). | All tenant relational data; uploaded media. | EU (project region pinned at provisioning). | Processor under Supabase DPA. |
| **Application hosting (EU)** | API, dashboard, marketing runtime. | Tenant data in memory during requests only. | EU. | Processor under host DPA. |
| **Clerk** | Authentication, sessions, invitations. | Email, name, avatar, OAuth identity tokens, `publicMetadata.livia` (businessId + role for invitations). | EU production tenant. | Processor under Clerk DPA. |
| **Resend** | Transactional email (booking confirmations, reminders, invitations). | Recipient email, message body, attachment metadata. | EU region. | Processor under Resend DPA. |
| **Twilio** | Inbound + outbound SMS via per-shop numbers. | Phone numbers (customer + shop), message bodies, A2P 10DLC registration metadata. | EU/Ireland numbers; Twilio EU processing. | Processor under Twilio DPA. |
| **Anthropic** | LLM inference for Liv replies, AI training generation. | Prompts (which include conversation context), system prompts (which include shop tone/knowledge), tool-call payloads. | Anthropic default region. **No training on customer data** — API tier is zero-retention for training. | Processor under Anthropic Commercial Terms. |
| **Inngest** | Durable workflows (reminders, continuity, digests). | Event payloads (ids + operational metadata — not bulk PII exports). | Per Inngest region configuration (EU preferred). | Processor under Inngest DPA. |
| **Sentry** | Error monitoring (web + api + mobile). | Stack traces, sanitised request metadata, user id (Clerk id, never email). PII scrubbing rules in code. | EU region. | Processor under Sentry DPA. |
| **Plausible** | First-party analytics on `livia.io` and dashboard. | Anonymised visit counts; no cross-site tracking, no cookies. | EU. | Processor; lawful basis = legitimate interest (no PII). |
| **Stripe** | Subscription billing + Stripe Connect for shop deposits/tips. | Salon legal entity data, billing metadata, deposit/tip transaction data. | Stripe Ireland Ltd; EU processing. | Processor + independent controller for Stripe's own purposes per Stripe's terms. |
| **Statuspage / Better Stack** | Public status page. | Service health metrics; no tenant data. | EU. | Processor. |

## What never crosses regions

- Tenant database tables — anchored to EU Postgres only.
- Storage buckets — EU region only.
- Customer photos, before/after images, signatures — EU-only storage prefix.
- Audit log (impersonation history) — EU-only Postgres table.
- Conversation transcripts (the long-term ones, > 90d, after the retention purge) — EU-only or deleted.

## What does cross regions (with controls)

- **LLM inference traffic to Anthropic.** Conversation context is sent to Anthropic for inference. Anthropic API tier guarantees **no training on the data**. Prompts are minimised to the conversation segment necessary for the reply; we never send the full customer history. Our system prompt names this as a constraint to the model.
- **Push notification dispatch** (when N1 ships) goes through APNs (Apple) and FCM (Google). The notification payload contains *only* the headline and a deep link, never customer PII beyond a first name initial.
- **Sender authentication for Resend** uses globally-distributed DNS — but the message body itself stays EU.

## EU AI Act Art. 50 obligations

When Liv replies to a customer, the customer must be told it's an AI. We satisfy this with three surfaces:

1. The first message in any new conversation includes "Hi — this is Liv, the AI assistant for [shop name]." (Compliance C1.)
2. Outbound SMS / email authored by Liv carries a footer disclosing AI authorship. (Compliance C2.)
3. The public booking chat widget shows a persistent "Powered by Liv (AI)" line in the header. (Compliance C1.)

These surfaces are required-on-by-default and **cannot be turned off** by the shop. This is locked at the platform level.

## Incident posture

- Sentry-detected P0 within EU subprocessor → owner-facing incident on `status.livia.io` within 15 minutes (Lane 4 L9).
- Confirmed personal-data breach → notification to affected DPOs (i.e. each affected business OWNER, who is the controller for their customers) within 72 hours per GDPR Art. 33.
- Customer-side breach communication is the controller's (the salon's) responsibility — we provide the data + template they need.

## Right to portability + erasure

- **Export** (`POST /api/me/export`) — JSON + CSV bundle of all tenant data, delivered by email, EU-only presigned URL, expires in 24h. (Compliance C3.)
- **Erasure** — soft-delete + 30-day purge job. Audit log entry retained for 1 year as proof. (Compliance C4.)

## Annual review

This document is reviewed annually by the founder + counsel. Last review: 2026-05-24. Next review: 2027-05.

## EU/IRE residency

All tenant data, every audit row, every billing record mirror, every storage prefix lives in the EU/Ireland region. This is the foundational guarantee Livia is built on.
