# Milestone A — Owner Day‑Runner (demo checklist)

Goal: an owner can **set up and run the day** from the `/b/*` workspace.

## Prereqs

- Set env (see `.env.example`):
  - `DATABASE_URL`
  - Clerk keys (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`)
- Run:
  - `npm ci`
  - `npm run prisma:generate`
  - `npm run prisma:migrate`

## Demo flow (happy path)

1. **Sign in**
   - Visit `/sign-in`

2. **Create business**
   - Go to `/b`
   - Create a business (optional timezone)

3. **Create staff + service**
   - Open `/b/[businessId]/staff` → create staff
   - Open `/b/[businessId]/services` → create a service
   - Assign staff ↔ service via `/b/[businessId]/staff/[staffId]/services`

4. **Set weekly availability + time off**
   - Open `/b/[businessId]/availability`
   - Pick a staff member
   - Add a weekly rule
   - (Optional) add time off

5. **Preview bookable slots**
   - Open `/b/[businessId]/availability/slots`
   - Default view is **per-staff**
   - Switch to **per-service** to see all assigned staff

6. **Create a booking from the owner workspace**
   - Open `/b/[businessId]/bookings` → **New booking**
   - Pick customer + service (+ optional staff) + start time

7. **Run the lifecycle**
   - Open the booking detail (`/b/[businessId]/bookings/[bookingId]`)
   - Change status: `PENDING → CONFIRMED → COMPLETED` (or `CANCELLED` / `NO_SHOW`)

8. **Notifications + audit visibility**
   - On booking detail, see:
     - **Alerts** (in-app)
     - **Outbound attempts** (NotificationLog filtered by `payload.bookingId`)
   - Or open `/b/[businessId]/notifications` for the full inbox + outbound log.

## Expected outcomes

- Booking create/status changes generate:
  - In‑app rows for business admins
  - Best-effort web push attempts (logged to `NotificationLog` as SENT/FAILED/SKIPPED when audited)

