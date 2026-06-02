# W2 demo flow — G1 locked → logged in

**Anchor (locked):** `g1-wedge-web.target.png` · `g1-wedge-mobile.target.png`  
**Program:** [`GATEWAY-SURFACE-PROGRAM.md`](../../../GATEWAY-SURFACE-PROGRAM.md) G1-A

---

## Flow (prospect path)

```text
G1  /demo                    Pick your world (trade card)
      │ click unlocked card (beauty / Lash & Brow in mock)
      ▼
G2  /demo/wedge/:vertical    Trade story — four beat cards at once (policy copy + UI crops)
      │ Continue
      ▼
G3  Enter as role            Owner default; manager / desk / staff when seeded
      │ Clerk demo ticket (no full /sign-in for happy path)
      ▼
W4  /dashboard …             Tenant preset + brand — aurora dissolve veil (gateway-handoff)
```

**Shortcuts:** `?vertical=beauty` → skip G1 grid · Marketing CTA → `/demo/wedge/beauty`.

**Staging ops path** (founder): G1 may still show setup/sync on `/demo` — prospect mocks above assume provisioned world.

---

## Inheritance rules (G1 → G2 → G3)

| Element | G1 grid | G2 story | G3 enter | W4 tenant |
|---------|---------|----------|----------|-----------|
| Left gateway rail | ✅ Worlds active | ✅ same rail | ✅ same | ❌ app shell |
| Aurora / celestial wash | ✅ full bleed | ✅ dimmer, content readable | ✅ + vignette on sheet variant | preset surface |
| Gold + serif headlines | ✅ card titles | ✅ vertical name + beat titles | ✅ business name | preset typography |
| Trade photo language | ✅ card hero | ✅ beat crop frames echo card radius | optional logo thumb | real brand |
| Cyan primary CTA | Enter world → | Continue → roles | Tap role → demo | preset primary |
| Demo badge | G1 LOCKED | G2 · Story | G3 · Enter | — |

**Do not** show settings, billing, Liv prompt editor, or full product tour on G2/G3.

**Do** carry vertical label + first beat hook from the card they clicked (no bait-and-switch slug).

---

## G2 content (beauty wedge — policy)

| Beat | Headline | Crop hint |
|------|----------|-----------|
| 1 | Inquiry in Inbox | inbox |
| 2 | Book + intake note | public-book |
| 3 | Reminder SMS | sms |
| 4 | Today — stations clear | today |

Demo slug: `bloom-beauty-dublin` (must match story vertical).

---

## Locked targets (founder 2026-06-02)

| Step | File |
|------|------|
| G1 grid | `g1-wedge-web.target.png` · `g1-wedge-mobile.target.png` |
| G2 story | `g2-wedge-story.target.png` — fusion cardstage |
| G3 enter | `g3-demo-enter.target.png` — G2 card + role tiles; **tap role proceeds** (no Enter button) |

Regenerate G3 mock: `python scripts/generate-w2-demo-flow-concepts.py` then copy to `g3-demo-enter.target.png`.
