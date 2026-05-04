# Repository delta (master spec vs this repo)

Living checklist. Update when schema or APIs change.

| Area | Target (master / product spec) | Current repo | Next step |
|------|--------------------------------|----------------|-----------|
| Tenancy | All tenant APIs under `/api/businesses/[businessId]/...` | Yes | Keep |
| Service layout | Clear `src/services/*` modules | `business/`, `staff/`, `catalog/`, `customer/`, `booking/`, `availability/`, `payments/`, `featureFlags/` | [FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md) |
| Auth | Supabase Auth or Clerk, sessions | Temporary `userId` / `actorUserId` (TODO) | Tranche T1 |
| Public booking | Slug-based page + slot API | Not built | Tranche T2 |
| Slot engine | Generate valid slots from rules + time off + buffers | Overlap check only; no slot list | Tranche T2 — `src/services/booking/` or `availability/` |
| Service buffers | `bufferBefore` / `after` | Not in schema | Migration + catalog |
| Booking channel | `channelType` on booking | Not on `Booking` model | Optional migration |
| Channel enums | WHATSAPP, INSTAGRAM, … | `ChannelType` smaller set | Extend enum + migration |
| AI / ops models | AIInteraction, AIObservation, Incident, … | Not in Prisma | Tranche T5 |
| Notifications | NotificationLog, providers | Not present | Tranche T4 |
| Messaging | MessageLog, webhooks | Not present | Tranche T6 |
| Mobile | Capacitor, deep links | Not in repo | Post–T3 |
| Seed / demo | `prisma/seed.ts` | Implemented (`npm run db:seed`) | Maintain demo data |
| CI | Lint + build on PR | GitHub Actions workflow | Keep green |
| Stripe create + webhooks | PaymentIntent on create; webhook updates + `Payment` | Phase 7 (`stripeAdapter`, `stripeWebhookService`, `/api/webhooks/stripe`) | Configure keys + Dashboard webhook URL |
| Stripe Connect / `PaymentAccount` UI | Onboarding flows | Schema exists; no Connect routes yet | Future phase / tranche |
| README / env | Onboarding + `.env.example` | Implemented | Keep updated |
