# Sub-processors

**Status:** v1.1 (2026-05-24). Always-current. Subprocessor changes notified to customers 30 days in advance per DPA § 5.

This list mirrors the operational subprocessor map in `docs/policy/data-residency.md`. The two are kept in sync.

**Production data plane:** Postgres and file storage on **Supabase (EU region)**. Application compute and static frontends on **EU-hosted** providers selected at deploy time (see `docs/product/LIVIA-PRODUCTION-READY.md`).

## Active sub-processors

| Sub-processor | Purpose | Personal data processed | Region | Sign-up date | DPA / SCCs |
|---|---|---|---|---|---|
| **Supabase** | Postgres (tenant database) + Storage (logos, customer photos) | All tenant relational data; uploaded media | EU (project region pinned at provisioning) | 2026-05 | Supabase DPA + EU SCCs |
| **Application hosting (EU)** | API + dashboard + marketing runtime | Tenant data in memory at request time; no long-term store beyond Supabase | EU | 2026-05 | Provider DPA (per chosen host) |
| **Clerk** | Authentication, sessions, invitations | Email, name, avatar, OAuth tokens, `publicMetadata.livia` | EU production tenant | 2025-12 | Clerk DPA + EU SCCs |
| **Resend** | Transactional email | Recipient email, message body, attachment metadata | EU | 2026-01 | Resend DPA |
| **Twilio** | SMS + voice (per-shop numbers) | Phone numbers, message bodies, A2P registration | Twilio EU | 2026-02 | Twilio DPA |
| **Anthropic** | LLM inference for Liv + training generation | Conversation context (prompts), system prompts, tool-call payloads | Anthropic default region; zero-retention API tier | 2026-02 | Anthropic Commercial Terms |
| **Inngest** | Durable workflows (reminders, continuity, digests) | Event payloads (booking ids, business ids — no full PII dumps in events) | EU/US per Inngest cloud region config | 2026-05 | Inngest DPA |
| **Sentry** | Error monitoring | Stack traces, sanitised request metadata, user id | EU | 2026-03 | Sentry DPA |
| **Plausible** | First-party analytics on `livia.io` + dashboard | Anonymised visit counts (no PII; no cookies) | EU | 2026-04 | Plausible DPA |
| **Stripe** | Subscription billing + Stripe Connect | Salon legal entity data, billing metadata, deposit/tip transactions | Stripe Ireland Ltd | 2026-04 | Stripe DPA + Ireland-based |
| **Better Stack (or equivalent)** | Public status page | Service health metrics; no tenant data | EU | TBD (Gate 3) | Provider DPA |

## Pending sub-processors (planned for v1.5+)

| Sub-processor | Planned purpose | When | Notes |
|---|---|---|---|
| **WhatsApp Business API (Meta or BSP)** | WhatsApp messaging | v1 ship (in flight) | EU-based BSP preferred; Meta direct as alternative |
| **EAS / Expo Application Services** | Mobile build + OTA | Already in use for build pipeline; no PII | N/A (no customer data) |
| **APNs (Apple Push)** | iOS push notifications | v1 (per `mobile-roadmap.md` Phase B) | Notification payload only (no PII beyond first-name initial) |
| **FCM (Google Push)** | Android push notifications | v1 | Same as APNs |
| **Vanta / Drata / Secureframe** | SOC 2 evidence | v1 (Type 1 at Gate 3) | EU-based; metadata only |
| **HackerOne / YesWeHack** | Bug bounty platform | v1.5 | YesWeHack EU-preferred |
| **Stripe Tax** | EU VAT / OSS reporting | v1 | Already part of Stripe |

## Categorically-excluded sub-processors

We do NOT use, and will not use without explicit Owner consent + DPA addendum:

- **Marketing automation** (Mailchimp, Klaviyo, etc.) — we don't blast customer lists.
- **CRM / sales tooling** with customer data ingestion (HubSpot, Salesforce in customer-data role).
- **Data warehouses** with customer PII (Snowflake, BigQuery in customer-data role).
- **Behaviour analytics** with PII (Mixpanel, Amplitude with PII).
- **Heatmap / session-replay** tools (Hotjar, FullStory) — privacy violation by design.
- **AI vendors with training-on-customer-data** policy.
- **Any vendor without an EU-residency option.**

## Subprocessor change notification

When a new sub-processor is added or an existing one's role substantively changes:
1. This file updated.
2. Email notification to all active customers via the email on file (CC'd to dashboard banner).
3. 30-day notice window.
4. Customers may object during window; if no resolution, may terminate without penalty.
5. RSS feed: `livia.io/legal/sub-processors.rss` (v1.5).

## Annual review

Reviewed at every quarterly foundation audit. Major review at year-end. Last updated: 2026-05-24.

## How to read this list

- **DPA / SCCs column:** every sub-processor has a signed DPA. Where the sub-processor is outside the EU/EEA, EU Standard Contractual Clauses or equivalent safeguards apply.
- **Region column:** where the sub-processor processes data. We require EU-residency option for all sub-processors handling tenant data; the Anthropic exception is documented + customer-disclosed.
- **Personal data processed column:** what categories of data the sub-processor sees. Not what they do with it.

## Customer-facing publication

Published at `livia.io/legal/sub-processors`. Updates pushed within 24h of this file changing.
