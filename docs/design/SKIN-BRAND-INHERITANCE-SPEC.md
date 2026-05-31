# Skin, brand, and inheritance — full specification

**Status:** canonical (2026-05-31)  
**Audience:** founder, product, design, engineering  
**Purpose:** End confusion between **platform skins (W1–W3)**, **tenant presentation (W4)**, and **public guest `/b` (W5)** — including **what owners may customize** vs **what must inherit**.

**Supersedes:** scattered paragraphs in PUBLIC-B, VISUAL-INHERITANCE, PRESENTATION-PRESETS when they conflict on `/b` editability.

**Reads with:** [`VISUAL-INHERITANCE-AND-BRAND-LOCKS.md`](./VISUAL-INHERITANCE-AND-BRAND-LOCKS.md) · [`EXPERIENCE-ARCHITECTURE.md`](./EXPERIENCE-ARCHITECTURE.md) · [`../product/PUBLIC-B-SURFACE-SPEC.md`](../product/PUBLIC-B-SURFACE-SPEC.md) · [`../product/TENANT-EXPERIENCE-CONTRACT.md`](../product/TENANT-EXPERIENCE-CONTRACT.md)

---

## 1. The problem (gaps we had)

| Confusion | Symptom in product today |
|-----------|-------------------------|
| Platform skin vs tenant preset | Dashboard feels like one generic app; `/b` sometimes doesn’t match tenant preset preview |
| `/b` customization | Owners edit brand fields but unclear if preset changes affect public page live |
| Inheritance direction | Docs said “`/b` inherits business skin” while also “owners customize `/b`” — both true, never reconciled |
| Mobile entry for P7 | `/b` is responsive web only; no documented PWA, wallet, or guest-native path |
| W6 guest hub | Future `my.livia-hq.com` skin undefined vs W5 |

This spec resolves inheritance **direction**, **editable fields**, and **preview parity**.

---

## 2. Worlds (never merge)

| World | ID | Skin source | User |
|-------|-----|-------------|------|
| Marketing | W1 | Aurora editorial (fixed) | Prospects |
| Gateway / demo | W2 | Aurora gateway (fixed) | Sign-in, demo |
| Internal ops | W3 | Ops amber (fixed) | Livia Inc staff |
| Tenant app | W4 | **Preset × brand** per business | Owner, staff |
| Public guest | W5 | **Same tenant record as W4** × vertical template | P7 customers |
| Guest hub | W6 | Liv Guest chrome (platform) × person vault | P7 cross-shop (R2) |

**Hard rule:** W1–W3 never use tenant presets. W4–W5 never use internal amber. W5 never uses Livia wordmark as hero (business logo forward).

---

## 3. Resolution formula (single source of truth)

Every pixel on W4 and W5 resolves through **the same five layers** (see [`EXPERIENCE-ARCHITECTURE.md`](./EXPERIENCE-ARCHITECTURE.md)):

```text
1 Capability (vertical pack)     → routes, gates, vocabulary, hero workflow
2 Presentation (preset id)       → density, shell, typography, layout primitive hint
3 Brand (tenant assets)          → logo, cover, optional accent override
4 Persona ritual (W4 only)       → home route, nav membership, copy tone
5 Surface morph (device)         → phone / tablet / desktop breakpoints
```

**W5 adds one modifier:**

```text
publicExperience = verticalGuestTemplate(capability) × preset(2) × brand(3) × surfaceMorph(5)
```

Persona layer (4) does **not** apply to P7 — guest flows use **customer typology** (CT1–CT6) instead.

---

## 4. What `/b` inherits vs what owners edit

### 4.1 Inherits automatically (owner cannot break)

| Layer | Inherits from | Owner override |
|-------|---------------|----------------|
| Vertical flow steps | `@workspace/policy` vertical pack | **No** — consult/consent/proof gates are compliance |
| Service catalog structure | Business services API | Indirect (via services admin on W4) |
| Jurisdiction copy | Locale pack | **No** — cancel/deposit footer |
| Preset morph | `presentation_preset_id` on business row | **Yes** — preset picker (W4 Settings) |
| Layout primitive hint | Preset definition | **No** — cards vs pipeline vs list is preset-owned |
| Token routes | `guest-surfaces` registry | **No** |
| Liv disclosure | AI policy | **No** |

### 4.2 Owner-editable (brand shell)

| Field | W4 effect | W5 `/b` effect | Constraints |
|-------|-----------|----------------|---------------|
| `logoUrl` | Nav, emails | Header hero | Min size, aspect ratio guide |
| `coverImageUrl` | Optional dashboard | Storefront hero | Crop safe zone documented |
| `brandAccentHex` | Accent override | Buttons, links | Contrast check WCAG AA |
| `presentation_preset_id` | Full tenant chrome | **Same preset morph on public** | Must preview `/b` frame in picker |
| Business display name | Everywhere | Header | — |
| Public slug | Link copy | URL `/b/{slug}` | Immutable after publish (admin migration) |
| Primary CTA label | Where policy allows | Book vs Request consult | Vertical vocabulary only |

### 4.3 Owner must NOT do (anti-patterns)

- Custom CSS / arbitrary HTML injection (R3+ custom domain ≠ arbitrary theme)
- Disable consent or deposit steps where vertical policy mandates
- Hide Liv AI disclosure on first message
- Apply internal/platform Aurora gradients on `/b` (business brand forward)
- Pick a preset that hides required vertical modules (validator rejects)

### 4.4 Preview parity (engineering requirement)

**When owner changes preset or brand in W4 Settings → Public appearance:**

1. Live iframe or side-by-side shows **exact** `/b/{slug}` mobile frame (9:19).
2. Same `GET /api/public/b/{slug}` bundle drives preview and production.
3. CI screenshot test: preset change updates public book page tokens.

**Doc gate:** [`UI-UX-MASTER-PROGRAM.md`](./UI-UX-MASTER-PROGRAM.md) §4.5.

---

## 5. Platform Default vs vertical-native presets

| Context | Default |
|---------|---------|
| **New tenant signup (W4)** | `platform-default` — Aurora Livia chrome ([`LIVIA-PLATFORM-LIFECYCLE.md`](../product/LIVIA-PLATFORM-LIFECYCLE.md) lock) |
| **Invalid preset id** | Vertical-native default preset — **not** Platform Default |
| **`/b` public** | Always uses tenant’s stored preset + brand — never raw Platform Default unless tenant chose it |

Four presets per vertical (Track D): identical routes/entitlements; different density and morph only.

---

## 6. P7 mobile entry (resolved)

**Decision:** P7 primary surface is **mobile web** at `/b/{slug}` — not a separate App Store guest app in R1–R2.

| Entry | Mechanism | Release |
|-------|-----------|---------|
| **SMS / WhatsApp link** | Opens mobile browser → token or slug URL | R1 |
| **Responsive `/b`** | Mobile-first layout; 320px minimum; `dvh` safe areas | R1 |
| **Add to Home Screen (PWA)** | Optional manifest per slug — business icon from `logoUrl` | R2 |
| **Apple/Google Wallet pass** | Visit day pass from booking confirm | R2 |
| **Guest hub app** | `my.livia-hq.com` — person vault, not per-shop app | R2 |
| **Native P7 app** | **Defer** — web + wallet + hub sufficient until data proves need | R3+ |

**Why not guest native app now:** P7 friction is **account creation**, not app install. Token links + thick mobile web beats another icon.

**Marketing/demo:** Always test `/b` on phone viewport first; desktop is secondary for P7.

---

## 7. W6 guest hub skin (R2 preview)

| Element | Source |
|---------|--------|
| Chrome | Platform Liv Guest — soft, person-first (not tenant preset) |
| Shop cards | Each linked business logo + name from vault consent |
| Book again | Deep link to that shop’s `/b/{slug}` — inherits W5 per shop |

W6 does **not** reuse W4 preset — it is **person-owned**, not business-owned UI.

---

## 8. Inheritance matrix (quick reference)

| From → To | Marketing | Gateway | Internal | Tenant W4 | Public `/b` | Guest hub |
|-----------|-----------|---------|----------|-----------|-------------|-----------|
| Platform aurora tokens | ✅ | ✅ | ❌ | via preset only | ❌ | partial |
| Tenant preset | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| Tenant brand fields | ❌ | ❌ | ❌ | ✅ | ✅ | logo only |
| Vertical pack | ❌ | wedge copy | ❌ | ✅ | ✅ | orchestration |
| Persona ritual | ❌ | ❌ | role-based | ✅ | ❌ | ❌ |

---

## 9. Implementation checklist (doc → build)

- [ ] `GET /me/tenant-experience` exposes `publicPreviewUrl` + preset id
- [ ] Settings → Public appearance with `/b` mobile frame
- [ ] Policy validator: preset cannot drop mandatory vertical gates on `/b`
- [ ] E2E: change accent → public button color updates
- [ ] Document PWA manifest scope in [`PUBLIC-B-SURFACE-SPEC.md`](../product/PUBLIC-B-SURFACE-SPEC.md) §15 (when added)
- [ ] Guest hub visual spec (R2) in [`GUEST-CONTINUITY-HUB-SPEC.md`](../product/GUEST-CONTINUITY-HUB-SPEC.md)

---

## 10. Changelog

| Date | Change |
|------|--------|
| 2026-05-31 | Full inheritance spec; `/b` editability tiers; P7 mobile entry decision |
