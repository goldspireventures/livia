# F03 — "Liv was wrong" rollback

**Initiator.** Any human who detects an error in something Liv did or said. Or Liv herself, post-hoc, via the eval-failure detection (F05).
**Participants.** Reporter · affected parties (customer, staff) · OWN (always notified of any rollback) · audit log.
**Configurations needed in.** Universal.

## Why this is a first-class workflow

Liv will be wrong. Not often, but inevitably. The category-shaping bet is: **Liv recovers from being wrong better than any human operator could.** That requires the rollback to be a designed surface, not an apology screen.

Two classes:
- **Auto-rollback class.** Errors where the rollback is mechanical and can happen without human ratification (typo in a customer message that Liv detects; double-booking caused by Liv's race condition).
- **Human-approved-rollback class.** Errors where the rollback affects a customer's perception or a staff member's autonomy. Requires the relevant human's tap.

## Happy path (auto-rollback)

1. Liv (or eval) detects: *"I just sent Mary a confirmation for 9am Tuesday with Lara, but Lara is actually off Tuesday — my booking was wrong."*
2. Liv pauses any further action on that booking.
3. Liv sends a corrective message in the same channel: *"Mary — apologies, I made a mistake. Lara is off Tuesday. Same time on Wednesday with Lara, or Tuesday with Sarah?"*
4. Liv flags OWN in real-time: "I made an error: confirmed Mary 9am Tue with Lara, who's off. Sent corrective; awaiting Mary's reply. Audit entry: [link]."
5. Audit log entry created with full context.
6. Eval gets a "wrong" data point with full trace (input + reasoning + outcome) for post-hoc analysis.

## Happy path (human-approved-rollback)

1. Reporter (e.g. Lara): *"Liv just took my Tuesday lunch slot for a booking — I block lunch every Tuesday."*
2. Liv pauses any further action on the booking.
3. Liv reads back the situation: *"Booking #1842, Sarah Walsh, 12:45pm Tuesday. To roll back I'll cancel the booking and offer Sarah a different slot. OK?"*
4. Lara taps "OK."
5. Liv cancels the booking, sends apology + alternative to Sarah, restores Lara's lunch block, and flags that Lara's "Tuesday lunch sacred" preference should be hard-locked.
6. OWN notified.
7. Audit + eval data point.

## Sequence

```mermaid
sequenceDiagram
    participant R as Reporter (human or Liv-eval)
    participant L as Liv
    participant A as Affected party (customer/staff)
    participant O as OWN
    R->>L: report (via UI / chat / eval)
    L->>L: pause action; classify (auto vs human-approved)
    alt auto-rollback
        L->>A: corrective + apology
        L->>O: real-time flag
    else human-approved
        L->>R: read-back of intended rollback
        R-->>L: approve
        L->>A: corrective + apology + alternative
        L->>O: real-time flag
    end
    L->>L: audit entry + eval data point
```

## Liv's posture

- **Always pauses on report.** Even if the report is wrong, the pause is a no-cost safety act.
- **Reads back before acting** in human-approved class. Never assumes the reporter's intent.
- **Always notifies OWN.** Not in a panic-tone — informationally. OWN can ignore most; pattern-spots when many.
- **Always logs.** Every rollback feeds eval.

## Liv's refusals

- **Never** roll back an action by another *human* (only Liv's own actions). If a human's action is mistaken, that's a different workflow (e.g. ADM revokes an STA action).
- **Never** rollback in a way that materially harms a customer (e.g. "rollback" by un-doing a refund the customer received).
- **Never** rollback silently — apology is mandatory.
- **Never** blame staff or customer for Liv's error.

## Failure modes

- **Rollback action itself fails** (e.g. payment provider can't reverse a deposit refund) → Liv escalates to OWN immediately; manual handling; the failed-rollback is its own audit entry.
- **Reporter is wrong** (Liv didn't actually make the error claimed) → Liv reads back what she actually did with evidence; ask reporter to confirm what they think happened.
- **Multiple "Liv was wrong" reports for the same action** → Liv consolidates; treats as one.

## Rollback's rollback

If the rollback was itself wrong, OWN can request a "restore" — restore the original Liv-action. Audit traces both directions.

## Nested sub-workflows

- F02 Trust-rung demotion (after pattern of rollbacks)
- F04 Liv asks for help (when she's uncertain whether her action was wrong)
- F05 Liv eval-failure detection (the upstream trigger for auto-detected cases)

## Audit entries

- `liv.action.flagged_wrong` (reporter, original_action_id, classification)
- `liv.action.paused`
- `liv.rollback.{auto|human-approved}.proposed` (with read-back text)
- `liv.rollback.approved` (human-approved class only)
- `liv.rollback.{executed|failed}` (with details)
- `notification.affected.sent` (corrective + apology)
- `notification.owner.flagged` (real-time)
- `eval.data_point.created` (with full trace)

## Ambition rung

- R1: every rollback is human-approved class; auto-rollback only for trivial typos.
- R2: auto-rollback expanded to clearly-bounded mechanical errors.
- R3: most operational errors auto-rollback; ambiguous cases human-approved.
- R4-R5: same; the *rate* of needing rollback drops as eval matures.

The "Liv was wrong" rollback is **the most credibility-determining workflow in Livia.** A product that cannot recover from its own errors gracefully cannot earn Rung 3+. Phorest et al. don't have this surface because they don't autonomously act in the first place.
