# Beauty ambient tiers

## Frozen baseline (founder-approved 2026-06-02)

Snapshot files (do not edit):

- `beauty-presentation.snapshot-2026-06-02.css` (repo)
- `docs/design/snapshots/beauty-presentation-2026-06-02-baseline.css` (copy)

## Revert to exact baseline

**Instant (browser, no deploy):**

```js
localStorage.setItem("livia.beautyAmbient", "baseline");
location.reload();
```

**Restore signal tier:**

```js
localStorage.setItem("livia.beautyAmbient", "signal");
location.reload();
```

**File-level restore (overwrites live CSS with snapshot):**

```bash
pnpm beauty:ambient:baseline
```

Then hard refresh. Re-enable signal tier via localStorage or rebuild after re-adding `beauty-ambient-signal.css` import.

## Signal tier (default)

`beauty-ambient-signal.css` applies when `html[data-beauty-ambient="signal"]`:

- Ceiling wash breathes on main only; sidebar bloom stays the accent
- Briefing glow only when pending / inbox / Liv act
- Nav left-edge when route has badge count
- KPI left-edge on actionable chips
- Stagger capped to 4 blocks on Today
- Time-of-day tweaks (morning / afternoon / evening)

Set `VITE_BEAUTY_AMBIENT=baseline` in `.env` to force baseline without localStorage.
