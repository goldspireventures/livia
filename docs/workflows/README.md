# Workflows — F4 inventory

**Status:** F4 (2026-05-07). Index + representative depth on 7 workflows spanning the 11 categories. Remaining ~70 workflows are enumerated below for incremental fill — each follows the same documentation template.

## Documentation template (every workflow)

- **Who initiates** (persona × configuration).
- **Who participates** (call chain).
- **Happy path** (numbered sequence).
- **Sequence diagram** (mermaid; for non-trivial flows).
- **Liv's involvement at each step** (autonomous / suggests / asks / refuses).
- **Liv's refusals** (the boundary).
- **Failure modes + Liv's response.**
- **Rollback / undo.**
- **Nested sub-workflows.**
- **Audit-log entries.**
- **Configurations needed in.**
- **Ambition rung this assumes.**

## Categories + workflow inventory

### A — Customer-facing
- A01 Book ✅ *(detail file: `book.md`)*
- A02 Rebook
- A03 Cancel
- A04 Request-change
- A05 Pay deposit
- A06 Refund-request ✅ *(detail file: `refund-request.md`)*
- A07 No-show ✅ *(detail file: `no-show.md`)*
- A08 Walk-in
- A09 Complaint
- A10 Review-collection
- A11 Gift-card-redemption
- A12 Loyalty-redemption
- A13 Waitlist
- A14 Pre-visit-prep
- A15 Post-visit-followup

### B — Staff
- B01 Clock-in / Clock-out / Break
- B02 Time-off-request ✅ *(detail file: `time-off-request.md`)*
- B03 Shift-swap
- B04 Coverage-request
- B05 Training-completion
- B06 1-on-1-prep
- B07 Tip-collection
- B08 Commission-statement
- B09 Personal-rebook (the senior booking her own client without intervention)

### C — Manager
- C01 Rota-build / Rota-publish
- C02 Approve-time-off
- C03 Approve-shift-swap
- C04 Approve-refund-under-threshold
- C05 Walk-in-assignment
- C06 No-show-recovery
- C07 Daily-cashout
- C08 Team-1on1
- C09 Hire-flow / Fire-flow / Promote-flow / Suspend-staff / Disciplinary-record

### D — Owner / Founder
- D01 Weekly digest ✅ *(detail file: `weekly-digest.md`)*
- D02 Monthly P&L
- D03 AI training review
- D04 Refund-approval-over-threshold
- D05 Hire-approval / Fire-approval / Promotion-approval
- D06 Brand-update
- D07 Marketing-campaign-launch
- D08 Multi-shop performance review
- D09 Financial close
- D10 Supplier payment / Lease-rent payment / Tax export

### E — Cross-level
- E01 Refund-ladder escalation ✅ *(see `refund-request.md` — full ladder)*
- E02 Customer escalation up the chain
- E03 Owner-on-holiday handoff ✅ *(detail file: `owner-on-holiday.md`)*
- E04 Manager-on-holiday handoff
- E05 Emergency closure
- E06 Payment-failure handling
- E07 Staff-emergency-cover
- E08 Fire-drill (literal — missed booking cascades)

### F — Liv-specific
- F01 Trust-rung promotion
- F02 Trust-rung demotion
- F03 "Liv was wrong" rollback ✅ *(detail file: `liv-was-wrong.md`)*
- F04 Liv asks for help
- F05 Liv eval-failure detection
- F06 Liv-detected-anomaly escalation

### G — Admin & lifecycle
- G01 Invite member / Revoke seat / Change role
- G02 Audit export
- G03 GDPR data request / GDPR deletion
- G04 Billing update
- G05 Business-onboarding / Business-offboarding
- G06 Business-merge (acquisition) / Business-split

### H — Multi-shop (chain configurations)
- H01 Cross-shop rota balancing
- H02 Cross-shop customer recognition
- H03 Cross-shop staff borrow
- H04 Cross-shop financial rollup
- H05 Cross-shop brand consistency check

### I — Configuration-specific
- I01 Chair-rental rent collection + chair-availability + tenant-stylist micro-CRM
- I02 Franchise royalty calc + franchise compliance audit
- I03 Partnership profit distribution + partner vote
- I04 Multi-brand brand-isolation + brand-spanning customer-recognition (with privacy gates)

### J — Vertical-specific
- J01 Medspa: informed consent flow, contraindication check, post-procedure aftercare comms, before/after photo handling
- J02 Tattoo: design proof + sign-off, deposit-binds-design, consent + age verification, healing aftercare
- J03 Physio: progress notes, treatment-plan adherence, GP referral handoff
- J04 Fitness: class booking (capacity-bound, recurring), waitlist promotion, package/membership consumption
- J05 Wellness: gift-voucher redemption, group-booking (couples massage), spa-day multi-service orchestration
- J06 Pet grooming: pet record, vaccination check, reactive-cancellation if pet unwell

### K — Crisis-mode playbooks
- K01 COVID-style closure (mass-reschedule, deposit-refund-or-credit, comms cascade)
- K02 Staff-walks-out (rota emergency rebalance, customer notification, recovery comms)
- K03 Payment-processor-down (offline mode, manual capture, reconciliation)
- K04 Social-media crisis (DM triage escalation, owner-hold-on-public-replies)
- K05 Lease-lost (relocation comms, rebooking-at-new-address)
- K06 Data-breach (GDPR 72-hour notification, customer comms, audit-trail freeze)
- K07 Power-cut / connectivity-loss (degraded-mode booking)

### L — No-app workflows (first-class class)
- L01 Customer-facing SMS-only booking
- L02 Customer-facing voice-only booking
- L03 Owner WhatsApp-only refund approval
- L04 Junior STAFF SMS-only day-list
- L05 Receptionist tablet kiosk (no-install)

### M — Accessibility
- M01 Visually-impaired Owner: voice-first navigation, screen-reader-clean surfaces, audio briefing
- M02 Older Customer without smartphone: SMS-only booking and reminder, voice booking via Liv
- M03 Deaf Customer: SMS-only fallback, no voice prompts
- M04 Staff with reading difficulties: icon-led density mode, audio prompts

---

## Total: ~80 workflows

7 fully detailed in this F4 pass; the remaining 73 enumerated above for incremental fill in design + engineering work. Each follows the documentation template above.
