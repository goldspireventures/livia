# A07 — No-show

**Initiator.** Liv (auto-detected: scheduled-time + grace-window passed; customer didn't arrive; no cancellation received).
**Participants.** Customer · stylist whose slot · REC (if any) · ADM (for above-cap refund of forfeit).
**Configurations needed in.** Universal.

## Detection

- Slot scheduled for `T`.
- Grace window per salon setting (default 10 min).
- At `T + grace`, no check-in event AND no cancellation event AND no `customer.arrived` flag.
- Liv flags `booking.status = no-show` after grace; does not act yet.

## Happy path

1. **Detect.** At `T + grace`, mark booking no-show.
2. **Soft-touch the customer first.** Liv messages within 5 min: *"Hi Mary — we have you down for 2pm with Lara. Is everything OK?"* (Two outcomes: (a) customer responds with reason → reschedule path; (b) silence.)
3. **If silence after 30 min:** Liv applies salon's no-show policy (deposit forfeit / no-show fee / strike count). Customer notified in standard tone.
4. **Recover the slot.** Liv composes a waitlist message draft. If salon has one waitlist customer matching service + window, Liv sends the offer.
5. **Surface to staff.** Stylist (Lara) notified: "Mary no-show; slot offered to Aoife on waitlist."
6. **Audit + future-cycle action.** Audit log entry; CT4 Refund-prone classifier increment if 2nd in window; next-booking deposit pre-flag for that customer (configurable).

## Sequence

```mermaid
sequenceDiagram
    participant L as Liv
    participant C as Customer
    participant S as Stylist
    participant W as Waitlist customer
    L->>L: T + grace; no arrival
    L->>L: mark no-show
    L->>C: soft-touch ("everything OK?")
    Note over L: wait 30 min
    alt silence
        L->>L: apply policy (forfeit / fee)
        L->>C: notification of policy
        L->>W: waitlist offer
        W-->>L: accept
        L->>S: rebooked notification
    else customer responds
        L->>C: reschedule path
        L->>L: cancel forfeit; rebook
    end
```

## Liv's posture per step

| Step | Posture |
|---|---|
| Detect | Autonomous |
| Soft-touch | Autonomous (Liv's voice) |
| Wait window | Autonomous |
| Apply policy | Autonomous within published policy |
| Recover slot from waitlist | Autonomous |
| Surface to staff | Autonomous |
| CT4 reclassification | Autonomous (does not surface to customer) |

## Liv's refusals

- Never accuse the customer of no-show on first touch (always the soft-touch first).
- Never apply policy outside the published rules without OWN's approval.
- Never expose CT4 status to the customer.
- Never message the customer about the same no-show more than twice in 24h.

## Failure modes

- **Customer responds 35 min after grace** ("sorry, traffic — be there in 10") → Liv negotiates with stylist (push: "Mary delayed 10 min — keep slot?"); if stylist accepts, no policy applied; if not, standard reschedule.
- **No waitlist match** → slot remains empty; stylist sees the gap; Liv may surface walk-in opportunity or a "drift list" reach-out.
- **Multiple no-shows on the same day** (e.g. weather event) → Liv detects pattern, escalates to OWN/ADM with proposed mass-action ("12 no-shows today; storm warning; suggest waiving forfeits and offering reschedules — approve?").

## Rollback / undo

- Within same day: ADM can override `no-show` flag manually if customer arrives late / proves miscommunication.
- Forfeit refund: standard refund workflow (A06).

## Nested sub-workflows

- A13 Waitlist
- A06 Refund (if forfeit later refunded)
- F06 Liv-detected anomaly (if mass no-show pattern)

## Audit entries

- `booking.no-show.flagged`
- `notification.customer.soft-touch.sent`
- `notification.customer.policy.{sent|skipped}`
- `payment.deposit.forfeited` (if applicable)
- `waitlist.offer.{sent|accepted|declined|expired}`
- `customer.classifier.CT4.incremented` (if applicable)

## Configurations

- **Solo:** Owner gets the notifications; no separate REC/ADM.
- **Chain:** per-shop policy; Founder sees aggregate in weekly digest.
- **Chair-rental:** Renter's no-show, Renter handles; Host sees aggregate slot-occupancy only.

## Ambition rung

- R1: Liv flags; staff acts on each step.
- R2: Liv soft-touches autonomously, surfaces to staff for policy decision.
- R3: Liv runs the full sequence including waitlist recovery; surfaces to stylist; staff overrides only if needed.
- R5 (P2b solo barbershop): same as R3 plus weekly summary in voice/SMS to Owner.

The no-show workflow is the canonical "Liv-saves-30-minutes-of-ad-hoc" workflow. Web research (§1) puts deposit-protected bookings at -55-70% no-show reduction; the soft-touch + waitlist recovery is what closes the rest.
