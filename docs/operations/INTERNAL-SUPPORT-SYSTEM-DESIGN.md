## Internal support system — design pass (v1)

This doc defines the **workflow and information architecture** for Livia’s internal support function: from capture → triage → troubleshoot → close. It’s written to match a small, multi-hat company where the same people rotate between engineering, ops, and customer success.

### 1) Company hats (who uses this)

- **support_l1**: first response, clarifies, gathers identifiers, applies runbook fixes
- **support_l2**: deeper investigation, can impersonate, can request traces, can coordinate handoffs
- **engineer**: debugs code/infra issues, owns incident fixes, maintains runbooks and tooling
- **finance_read**: billing-only visibility, no mutations
- **founder**: sees everything; can override priority and comms

### 2) Ticket lifecycle (source of truth)

Statuses:

- **open**: user reported; not yet verified/triaged
- **triaged**: priority + tags set; owner assigned; next action decided
- **resolved**: fix applied or workaround delivered; waiting for confirmation/time
- **closed**: final; audited; included in weekly reports

Required metadata at each step:

- **open**: businessId, category, severity, description, reporter (email/userId), createdAt
- **triaged**: priority, tags, assignedTo, internal note with “hypothesis + next step”
- **resolved**: resolution summary + (optional) commit/PR/ref link + customer-facing message
- **closed**: final root cause + “prevent recurrence” note (tests, alerts, docs)

### 3) Capture flows (how tickets get created)

Capture channels:

- **in-app Help/Support** (owner/staff): structured form that auto-attaches context
- **email / SMS**: ingested into a support inbox; create a ticket with parsed fields
- **internal ops**: manual create for proactive issues (monitoring, billing anomalies)

Context auto-attach (should be automatic where possible):

- **tenant**: businessId, slug, vertical, plan, locale, last booking time
- **session**: user id, role, page route, device (mobile/desktop)
- **event identifiers**: requestId, conversationId, bookingId, workflow ids
- **recent activity**: last N relevant events/messages for that tenant

### 4) Operator UI: what must be visible first

The operator’s job is: **identify impact, reproduce/trace, decide next action**.

Therefore the detail page should be structured as:

1. **Header (“what is this?”)**: business, category, priority, status, created/updated, assignedTo
2. **Impact (“who/what breaks?”)**: affected user(s), route, booking/customer, severity, repeat rate if known
3. **Identifiers (“how do I trace it?”)**: requestId / bookingId / conversationId — copyable
4. **Timeline (“what happened?”)**: recent messages + workflow events + key DB events
5. **Suggested actions (“what do we do now?”)**: runbook links + safe automated actions
6. **Notes & audit (“what have we tried?”)**: internal notes; actions are attributed + time-stamped

### 5) Triage policy (small team practical)

Priority meaning:

- **urgent**: revenue loss, safety/compliance risk (e.g. medspa consent), production outage
- **normal**: broken workflow, high user friction, repeated errors
- **low**: paper cuts, copy edits, improvements

SLA targets (beta):

- urgent: acknowledge < 30 minutes, mitigation same day
- normal: acknowledge < 24 hours
- low: batch into weekly planning

### 6) “Fit-for-purpose” internal tooling goals

- Reduce time to first hypothesis
- Make identifiers impossible to miss
- Make next steps actionable (runbooks, links, buttons)
- Make closure auditable (root cause, prevention)

### 7) What’s next (implementation roadmap)

- **UI overhaul**: ticket detail becomes a 3-column workspace (queue / summary / timeline)
- **Timeline**: unify “messages + workflow events + audit + traces” into one chronological view
- **Runbook surfacing**: dynamic runbook suggestions per tag/category
- **Postmortem-lite**: on close, require root cause + prevention checkbox

