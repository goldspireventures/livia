# Public skin updates while a guest is booking

## Behaviour (after Store appearance change)

- **Dashboard:** Preset/accent apply only when the owner clicks **Apply to shop** — no live morph on card click.
- **Guest `/b`:** Uses the saved preset at page load. Preview mode (`?preview=1&preset=…`) is for the owner iframe only.
- **Mid-session skin change:** If an owner applies a new preset while a guest has `/b` open, the guest page does not hot-swap CSS (avoids jarring reflow and half-themed steps). They see the skin from initial load; refresh picks up the new preset.

## Rationale

| Live morph on `/b` | Deferred until refresh / new session |
|--------------------|--------------------------------------|
| WYSIWYG for owner testing | Guest sees one consistent flow start-to-finish |
| | Avoids broken state when toggling noir ↔ soft mid-checkout |
| | Simpler caching and E2E (stable `data-presentation` per visit) |

## Future (optional)

- Versioned `presentationEpoch` on public profile + gentle banner: "This page refreshed with an updated look" after apply.
- WebSocket or SSE only if product requires real-time brand campaigns.
