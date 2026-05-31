# Build hierarchy map — where we are

**Status:** canonical (2026-05-31)  
**Purpose:** One diagram of **nested plans** so every doc, screen, and build task has a known place in the stack.

---

## 1. Stack (top → bottom)

```text
┌─────────────────────────────────────────────────────────────┐
│ L0  CATEGORY — People-business OS + Liv as colleague         │
│     PEOPLE-BUSINESS-CATEGORY-MANIFESTO.md                    │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│ L1  DOC SPRINT (ACTIVE ⏸ BUILD) — G-DOC gate                 │
│     LIVIA-DOCUMENTATION-PROGRAM.md                           │
│     ├── Phase A–H (category, UX, systems, demo, surfaces…)   │
│     └── Phase I — VISUAL (screen inventory, cards, Figma)      │
│         VISUAL-DOCUMENTATION-PROGRAM.md                      │
└────────────────────────────┬────────────────────────────────┘
                             │ G-DOC passes
┌────────────────────────────▼────────────────────────────────┐
│ L2  BUILD PLAN V2 — execution phases 0–6                     │
│     LIVIA-BUILD-PLAN-V2.md                                   │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│ L3  RELEASE PROGRAM — R1 / R2 / R3 platform slices           │
│     PLATFORM-RELEASE-PROGRAM.md                              │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│ L4  LOCKS (still valid) — founder decisions                  │
│     LIVIA-FINAL-BUILD-PLAN.md §1                             │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│ L5  SURFACE PROGRAMS — W1–W6 per-world specs                 │
│     MARKETING, GATEWAY, TENANT, PUBLIC-B, GUEST-HUB, INTERNAL│
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│ L6  SCREEN CARDS (L3 design) — one YAML per screen           │
│     docs/design/screen-cards/*.yaml                          │
│     VISUAL-SCREEN-MASTER-INVENTORY.md                        │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│ L7  IMPLEMENTATION — artifacts/* (after G-DOC)               │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│ L8  VERIFICATION — visual + E2E per screen                   │
│     TESTING-VISUAL-ACCEPTANCE.md                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. You are here (2026-05-31)

| Layer | Status |
|-------|--------|
| **L0 Category** | ✅ Manifesto written |
| **L1 Doc sprint** | 🔨 **Phase I ~complete** — 24 P0 + 48 P1 cards; Figma PNG next |
| **L2 Build v2** | ⏸ Draft — blocked on G-DOC |
| **L3 Releases** | Unchanged — R1/R2/R3 still valid |
| **L4 Locks** | Valid — Aurum, G1-A, I4-A, thick/thin channels |
| **L5 Surface programs** | Exist — Phase B cross-links applied |
| **L6 Screen cards** | ✅ **72 YAML** (24 P0 rich + 48 P1) |
| **L7 Code** | ⏸ Paused — demo depth shipped |
| **L8 Tests** | ✅ `demo-live-day`, `demo-proof-token`, `public-booking-quality` |

**Next milestone:** Complete **P0 screen cards (24)** + **master inventory rows** for all routes → **G-UX-1**.

---

## 3. Which plan wins when docs conflict

| Question | Authority |
|----------|-----------|
| Product category | PEOPLE-BUSINESS-CATEGORY-MANIFESTO |
| Doc sprint scope | LIVIA-DOCUMENTATION-PROGRAM |
| Visual per screen | Screen card YAML > Experience Bible table |
| Skin inheritance | SKIN-BRAND-INHERITANCE-SPEC |
| Build order after gate | LIVIA-BUILD-PLAN-V2 |
| Founder locks | LIVIA-FINAL-BUILD-PLAN §1 |
| Index | DOC-CANONICAL-INDEX |

---

## 4. Changelog

| Date | Change |
|------|--------|
| 2026-05-31 | Initial hierarchy map — doc sprint Phase I active |
