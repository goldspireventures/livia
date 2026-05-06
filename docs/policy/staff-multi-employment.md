# Policy — Staff working at multiple businesses

**Status:** v1 (2026-05-06)
**Anchors:** ADR 0009 (roles), ADR 0010 (tenant axis × role axis).

## The reality we're modelling

In the EU appointment-based services market — particularly chair-renting in salons, sessional therapists in clinics, and freelance lash artists — the same human routinely works at two or three businesses. Lara cuts at Aurora Studio Tuesday-Friday and rents a chair at Stoneybatter Barber on Saturdays. The product must support this without forcing her to maintain two phones, two emails, or two passwords.

## The decision

Yes, supported. **One Clerk user can hold N STAFF memberships across N businesses.**

Mechanics:

1. The bridge is the Clerk user (= one row in our `users` table).
2. Each business that employs her has its own `staff` row pointing at her `userId` and the `businessId`. The two `staff` rows are otherwise unrelated — separate bio, separate services list, separate availability rules, separate tip/commission record.
3. She has one `business_memberships` row per business, each carrying the role she holds there.
4. In the mobile app she sees a **business switcher** in the More tab and as a sticky chip in the header (per ADR 0010). Switching tenants reloads My Day for that shop.
5. The persona switcher does not apply to her (STAFF cannot impersonate).

## Invitation flow when the user already exists

1. Aurora Studio invites `lara@example.com` with role STAFF (existing flow per ADR 0009 — `POST /businesses/:bid/invitations` → Clerk `createInvitation`).
2. Clerk recognises the existing Clerk user; the invitation lands as a notification in her account.
3. On her next sign-in to the dashboard or mobile app, `POST /me/accept-invitations` materialises the new `business_memberships` row.
4. Aurora Studio's owner can now create a `staff` row for her (with her bio, services, hours).
5. The next time she opens the app, Aurora Studio appears in her switcher.

## What is **not** shared across her two memberships

- Her bio, photo, services list, commission rate, working hours — all per-business.
- Her customer roster — a customer at Aurora Studio is *not* a customer at Stoneybatter Barber, even if it's the same human. (See "Two customers, one human" below.)
- Her bookings — each booking is owned by exactly one business.
- Her payouts / tips — each shop pays her separately through that shop's Stripe Connect account.
- Push notifications — scoped to the active business; switching tenants switches the notification context.

## What **is** shared across her two memberships

- Her Clerk identity (email, password, MFA, biometric enrollment).
- Her device push token (we map it per-business at notification dispatch time so messages don't leak across).
- Her language and accessibility settings on the device.

## "Two customers, one human"

Mary M. books at Aurora Studio every six weeks and at Stoneybatter Barber for occasional men's-grooming sessions. We deliberately do **not** unify her into a single platform-level customer record. Reasons:

1. Each business is a separate GDPR data controller with its own consent + retention rules.
2. Cross-business customer linking would create a platform-level identity graph we are not willing to operate.
3. UX confusion: a salon owner expects "her client" to mean a row in her business, not a global record she shares.

Consequence: when Lara sees Mary in My Day at Aurora Studio, the history reflects only Aurora Studio visits. If Lara also serves Mary at Stoneybatter Barber, that's a different row in a different tenant.

We accept this UX cost. A future "professional profile" feature (post-Gate-3) could let a STAFF *view* her own history across all her shops in a personal-profile page, but never expose this graph to any business owner.

## Edge cases

| Scenario | Behaviour |
|---|---|
| Lara is fired from Aurora Studio | OWNER deletes her `business_memberships` row. She loses access to that tenant immediately; her `staff` row at Aurora Studio is soft-deleted (so historical bookings still show "Lara"). Stoneybatter Barber unaffected. |
| Lara wants to delete her Clerk account | Standard GDPR-erasure flow. Both businesses are notified that "the human account behind staff member Lara is being deleted; her historical bookings keep her name as a string for invoice integrity but no longer link to a user." |
| Lara forgets which business she's looking at | The header chip + the AppLayout sidebar pill (web) always show the current business name. The chip is non-dismissible by design. |
| Lara tries to use the same email under two Clerk accounts | Clerk prevents this. We rely on Clerk's deduplication. |
| Lara's two businesses have conflicting AI personalities | Irrelevant to her — each shop's AI is a per-business setting. She experiences them as different inboxes. |

## Implementation status

Schema-level: shipped (per Task #48 — `business_memberships` is N:N).
UX-level: invitation flow shipped; switcher UX gap is closed by the follow-on web business-switcher build task and the mobile sticky-chip task proposed at the end of #59.
Policy-level: this document.

## EU/IRE residency

Lara's account, both `staff` rows, both `business_memberships`, and the audit logs of every action she takes live in the EU/Ireland region. Push tokens registered per-business stay in EU.
