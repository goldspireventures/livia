# Bliq Mobile and Web UX Rules

## Purpose

Bliq is both:
- a web app
- an iOS app
- an Android app

The shared codebase must serve all three, but mobile is likely the primary experience.

Cursor must treat mobile-first UX as a product requirement, not a styling preference.

---

## 1. Product UX Principle

Bliq should feel:
- fast
- modern
- clean
- premium
- obvious
- calm
- practical

Avoid:
- clutter
- cramped admin panels
- desktop-first tables
- excessive forms
- unnecessary steps
- enterprise bloat
- barber-only language

---

## 2. Mobile-First Rules

Design every user-facing surface assuming a phone screen first.

Rules:
- primary actions must be easy to tap
- avoid hover-only interactions
- avoid tiny clickable text
- avoid dense table-first layouts
- use card/list layouts for mobile
- support loading, empty, and error states
- keep forms short and segmented
- use clear step progression for booking flows
- avoid sidebars as the only navigation on mobile

Minimum touch target:
- aim for at least 44px height for primary controls

---

## 3. Web Compatibility

Desktop/web should remain polished.

Responsive behavior:
- mobile: stacked cards, bottom nav or compact nav
- tablet: two-column where useful
- desktop: wider dashboards, optional tables with cards still available

Do not build mobile-only hacks that break desktop.

---

## 4. Public Booking Flow UX

The public booking flow must be excellent because it is the customer’s first experience.

Flow:
1. Business intro
2. Choose service
3. Choose staff/provider if needed
4. Choose date
5. Choose available time
6. Enter customer details
7. Review/confirm
8. Success

Rules:
- do not ask for too much too early
- show clear selected choices
- make it easy to go back/change selection
- show no-availability states clearly
- if booking fails because slot disappeared, explain clearly and ask user to choose another slot
- never show scary technical errors

Copy should be generic:
- service
- appointment
- provider/staff
- business

Avoid niche words:
- haircut-only language
- barber-only assumptions

---

## 5. Dashboard UX

Dashboard users need speed.

Home should answer:
- what’s happening today?
- what’s next?
- what needs action?
- how do I quickly manage my business?

Mobile dashboard should use:
- stat cards
- booking cards
- quick actions
- compact filters
- bottom navigation or mobile-friendly nav

Avoid:
- giant data grids as primary mobile UI
- buried actions
- multi-level menus too early

---

## 6. Staff and Services UX

Staff screens:
- list staff as cards
- active/inactive badges
- quick edit/deactivate
- service assignment visible

Service screens:
- list service cards
- show duration and price
- active/inactive badges
- quick edit/deactivate

Create/edit forms:
- clear required fields
- duration input easy
- price in user-friendly currency, backend stores minor units
- clear validation messages

---

## 7. Availability UX

Availability is complex. Make it simple.

Recommended mobile pattern:
- select staff
- show weekdays
- each day has availability windows
- add/edit/delete window
- separate time-off section

Rules:
- avoid making user type times manually if possible
- show timezone clearly if relevant
- explain closed/no availability state
- avoid ambiguous time formats

---

## 8. Booking Management UX

Booking card should show:
- customer name
- service
- staff
- date/time
- status
- channel if available
- payment status later

Actions:
- mark completed
- mark no-show
- cancel
- view customer

Destructive actions:
- confirmation required
- cancellation reason where useful

---

## 9. Customer UX

Customer list:
- search
- recent activity
- phone/email if available
- booking count if available

Customer detail:
- contact info
- booking history
- notes
- channel identities later
- insights later

Treat it as lightweight CRM.

---

## 10. Storefront UX

Storefronts must feel like real business pages.

Must include:
- hero
- business info
- services
- staff
- contact
- booking CTA

Rules:
- mobile-first
- fast load
- clear CTA
- not a generic profile page
- no complex drag/drop builder in v1

---

## 11. Payments UX

Payment screens must be trust-building.

Show:
- service
- date/time
- business
- deposit/full amount
- remaining balance if deposit
- cancellation/refund policy
- secure payment CTA

Do not surprise users with charges.

---

## 12. Empty, Loading, Error States

Every major UI must have:
- loading state
- empty state
- error state

Examples:
- no staff yet -> “Add your first staff member”
- no services yet -> “Create your first service”
- no bookings yet -> “Share your booking link”
- no availability -> “Set availability before accepting bookings”
- no slots -> “No times available on this day”

---

## 13. Mobile App Wrapper Readiness

Because Capacitor will wrap the web app:

Avoid:
- reliance on browser extensions
- desktop-only file interactions
- hover-only menus
- layouts broken by safe areas
- keyboard-hidden inputs

Consider:
- safe-area padding later
- persistent login
- deep links
- push notification entry points
- offline/degraded messaging

---

## 14. UX Checklist Before Completion

For every UI phase:
- works on mobile width
- primary action visible
- loading state exists
- empty state exists
- error state exists
- no desktop-only interactions
- copy is generic
- no barber-only assumptions
- API errors shown as friendly messages
- build passes