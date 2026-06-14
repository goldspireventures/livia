# Body art — design proof program

**Status:** shipped (ownership + Phase 1 skin preview)  
**Hub:** `lib/policy/src/body-art-design-proof-program.ts`  
**Parent:** [BODY-ART-VERTICAL-PROGRAM.md](./BODY-ART-VERTICAL-PROGRAM.md)

---

## 1. What a design proof is

| Asset | Owner | In Livia |
|-------|--------|----------|
| **Client references** (Pinterest, photos, mood board) | Client | Consult intake / booking notes — **not** the proof desk |
| **Design proof** (linework, digital mockup, flash sheet) | Studio / artist | `design_proof_assets` — approval workflow |
| **Healed photos** | Client + studio | Visit / continuity (future) |

**Rule:** Proofs are **studio-authored artwork** for a job. The client approves whether to tattoo it — not who drew the reference board.

**Never:** AI-generated tattoo designs (`BODY-ART-VERTICAL-PROGRAM.md` L4).  
**Allowed:** Phase 1 **skin preview** — illustrative placement of the artist’s existing art on body templates (not generative design).

---

## 2. Proof kind (`proof_kind`)

| Kind | Meaning | Default publish |
|------|---------|-----------------|
| `flash` | Repeatable shop sheet design | `flash_resell_ok` |
| `custom_commission` | One-off for a named client | `private` |
| `client_supplied` | Client brought full design; studio executes | `private` only |

---

## 3. Publish rights (`publish_right`)

| Right | Studio can… | Public `/b` gallery |
|-------|-------------|---------------------|
| `private` | Share guest link with client only | No |
| `portfolio_ok` | Show on `/b` with **client consent** (custom work) | Yes |
| `flash_resell_ok` | Repeat, walk-in, `/b` flash grid | Yes |

**Gate:** `listPublicDesignShowcase` returns only `approved` + `portfolio_ok` | `flash_resell_ok`.  
Custom commissions default **private** until artist explicitly chooses portfolio on studio sign-off.

---

## 4. Revision model

- `version` increments when artwork is **replaced** (`replaceArtwork: true`).
- Replace without “resend” → status returns to `draft`.
- Replace with `resendAfterReplace` → `pending_review` + fresh guest link dedupe.
- UI: **Replace artwork** on selected proof (proof desk sidebar).

---

## 5. Skin preview — Phase 1 (shipped)

**Surfaces:** W4 proof desk (On skin tab) · W5 guest `/proof/:token` (Design | On skin).

| Control | Options |
|---------|---------|
| Body zone | Forearm, upper arm, back, chest — **full limb/torso silhouettes** |
| Interaction | Tap preview → expand viewer with zoom, pan, tattoo angle, view tilt |
| Skin tone | Light, medium, deep, rich (template fills) |
| Look | Fresh vs healed (opacity/saturation) |

**Disclaimer:** `SKIN_PREVIEW_DISCLAIMER` in policy — illustrative only.

**Phase 2+ (not shipped):** Client photo upload + drag placement.  
**Phase 3 (not shipped):** AI realistic compositing — policy-gated, artist opt-in.

---

## 6. API

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/businesses/:id/design-proofs` | Includes kind, publish, version |
| POST | `/api/businesses/:id/design-proofs` | `proofKind`, `publishRight` optional |
| PATCH | `/api/businesses/:id/design-proofs/:proofId` | `status`, `imageUrl`, `note`, `proofKind`, `publishRight`, `replaceArtwork`, `resendAfterReplace` |
| GET | public `/b` showcase | Filtered by publish right |

**Migration:** `055-design-proof-ownership.sql`

---

## 7. Demo (`ink-anchor-galway`)

- 6 proofs with mixed kinds/statuses.
- Only **flash** approved rows (`Anchor & rope`, `Skull & roses`) appear on `/b`.
- Custom pending proofs stay off public gallery.

---

## 8. Tests

- `lib/policy/src/__tests__/body-art-design-proof-program.test.ts`
- `e2e/tests/demo-proof-token.spec.ts` (guest approve)
- `vertical-check.mjs` includes policy test

---

## Changelog

| Date | Change |
|------|--------|
| 2026-06-14 | Ownership, publish gate, revision, Phase 1 skin preview |
