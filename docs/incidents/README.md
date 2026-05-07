# Incidents — active log

**Status:** Living. Per `docs/engineering/incident-response.md`.

## What lives here

Active and recently-closed incidents (the operational record). Closed incidents that pass the post-mortem bar (SEV1/SEV2/SEV-SEC) graduate to `docs/postmortems/` for the durable lesson record.

## Naming

`YYYY-MM-DD-<short-slug>.md` — e.g., `2026-09-14-voice-degradation-ie.md`.

## Active incident template

Copy the block below into a new file when an incident opens.

```markdown
# Incident: <one-line title>

**Opened:** YYYY-MM-DD HH:MM CET
**Severity:** SEV1 | SEV2 | SEV3 | SEV-SEC
**Status:** Investigating | Identified | Mitigating | Resolved | Closed

**IC:** <name>
**Comms lead:** <name>
**Scribe:** <name>

## Symptoms

- ...

## Affected surfaces

- ...

## Affected tenants (best-known)

- ~N tenants; specific tenant IDs in `#incident-active` Slack thread (PII discipline).

## Timeline (live; updated as we go)

| HH:MM | <who> | <what> |
|---|---|---|

## Status page

- Last update: HH:MM
- Next update due: HH:MM (every 30 min while active)

## Mitigations attempted

- ...

## Mitigations applied

- ...

## Resolution

(Filled at resolution time.)

## Post-mortem

- Required: yes (SEV1/SEV2/SEV-SEC) | no (SEV3).
- Author: <name>.
- Due: <date> (5 business days from resolution).
- File: `docs/postmortems/YYYY-MM-DD-<slug>.md`.
```

## Index

(Empty until first incident.)

## Notes

- Per PII discipline, **specific tenant IDs are not committed to git in this file.** They live in the `#incident-active` Slack thread and the (private, not git-tracked) ops notes. The git-tracked incident file references "~N tenants affected" but not which.
- Active incidents may have multiple updates per hour during SEV1; that volume is fine.
- Closed SEV3s may stay here indefinitely as institutional memory; closed SEV1/SEV2/SEV-SEC graduate to `postmortems/` and the original incident file is deleted (not duplicated).
