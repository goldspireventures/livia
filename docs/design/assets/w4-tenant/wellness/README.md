# wellness — W4/W5 target mocks

Default preset: `spa-calm`

Alt presets: `zen-light`, `retreat-dark`

## Regenerate (code-only)

```bash
python scripts/generate-wellness-wedge-mocks.py
```

3 surfaces per preset: `inbox-thread`, `dashboard-owner-solo` (Today), `book-mobile` (W5).

Wedge runtime crops: `artifacts/livia-dashboard/public/w2-gateway/beats/wellness/{preset}/`.

Review `.sample.png` → delete rejects → rename to `.target.png`.

**Unlock** `wellness` in `MARKETING_DEMO_WEDGE_UNLOCK_ORDER` only after founder signs off targets.

See [`../../VERTICAL-TARGET-MOCK-PROGRAM.md`](../../VERTICAL-TARGET-MOCK-PROGRAM.md).
