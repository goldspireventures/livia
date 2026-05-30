# Public `/b` surface — full specification (W5 guest)

**Status:** canonical (2026-05-30)  
**Artifact:** `artifacts/livia-dashboard` — `/b/{slug}/*` (public, no Clerk)  
**Visual anchors:** [`northstar/public-book-mobile.png`](../design/assets/livia-evolution/northstar/public-book-mobile.png) · [`northstar/guest-proof-mobile.png`](../design/assets/livia-evolution/northstar/guest-proof-mobile.png)  
**Reads with:** [`GUEST-CUSTOMER-IDENTITY.md`](./GUEST-CUSTOMER-IDENTITY.md) · [`LIVIA-PLATFORM-FLOWS.md`](./LIVIA-PLATFORM-FLOWS.md) · [`LIVIA-PLATFORM-LIFECYCLE.md`](./LIVIA-PLATFORM-LIFECYCLE.md) · [`TENANT-EXPERIENCE-CONTRACT.md`](./TENANT-EXPERIENCE-CONTRACT.md) · [`PRESENTATION-PRESETS-AND-ROLLOUT.md`](../design/PRESENTATION-PRESETS-AND-ROLLOUT.md) · [`CHANNEL-UX-CONTRACT.md`](../design/CHANNEL-UX-CONTRACT.md)

---

## 0. Executive summary

`/b/{slug}` is **not** “just a booking widget.” It is each business’s **public operating front on Livia** — where end customers (P7) do rich work **without accounts**, while the business showcases offerings and runs vertical-specific guest workflows.

**Livia’s edge:** Thick guest surfaces on Livia (book, visit, proof, consent, pay) + **opaque tokens** + **vertical packs** + **brand × preset skins** — so it feels personal and logged-in-adjacent without login chaos.

**Design stance:** Mobile-first clarity for P7; brand-forward for the business; **no noise** — every element earns its place. Channels (SMS/WhatsApp) **link here**; they do not host collaboration.

---

## 1. Purpose — two audiences

### 1.1 For the business (owner’s job)

| Job | How `/b` helps |
|-----|-----------------|
| **Showcase** | Services, cover, logo, tone — better than a link-in-bio |
| **Convert** | Book, consult, waitlist — fewer steps than phone tag |
| **Collaborate** | Proof approval, consent, deposits — without email tennis |
| **Trust** | Professional, vertical-appropriate, EU-honest |
| **Control** | Brand + preset choice — still “their shop,” not generic Livia |

### 1.2 For the client (P7 job)

| Job | How `/b` helps |
|-----|-----------------|
| **Act quickly** | Book/reschedule/approve from phone |
| **No account friction** | Token links — no password, no app install required |
| **Feel seen** | Business name, brand, vertical language (not “Customer Profile”) |
| **Complete tasks** | Approve tattoo proof, sign consent, pay deposit — one place |
| **Continuity** | Same thread from SMS link back to rich page |

---

## 2. Why businesses still build their own websites

| Reason owners leave platforms | Livia `/b` response |
|------------------------------|-------------------|
| **Brand identity** | `logoUrl`, `coverImageUrl`, `brandAccentHex`, presentation presets |
| **SEO / discoverability** | Custom domain (future) + rich `/b` + optional embed; marketing not replaced |
| **Content** | Gallery, team, story sections (north star — R3) |
| **Flexibility** | Vertical modules + preset morph — not one generic form |
| **Proof of professionalism** | Aurora-quality guest UX vs competitor iframes |
| **They already paid for Squarespace** | `/b` must be **better enough** to become primary link-in-bio |

**Strategy:** `/b` becomes the **canonical customer URL** the owner puts in Instagram bio, Google Business, and SMS — because guest workflows impossible on static sites happen **here**.

---

## 3. What incumbents offer today (baseline)

| Incumbent pattern | Typical `/book` page | Gap |
|-------------------|---------------------|-----|
| Phorest / Fresha | Service list + slot picker | Weak collab (proof, consent loops) |
| Booksy | Mobile book + chat bolt-on | Generic skin; no vertical depth |
| Square | Minimal storefront | No Liv continuity; no guest tokens |
| Link-in-bio (Linktree) | Links only | No thick workflows |
| Custom WordPress | Full brand | No booking+ops integration |

**Livia wedge:** One platform where **book + guest collab + reminders + staff Today** share data — P7 pages are the **customer-facing half** of that thread.

---

## 4. Pain points & headaches (design targets)

### 4.1 Business pain

| Pain | `/b` design response |
|------|----------------------|
| DM → book drop-off | Liv chat entry on `/b`; inbox on W4 |
| Proof approval in WhatsApp | **Guest proof token page** — SMS sends link only |
| No-shows | Deposit + reminder → visit token day-of |
| Generic booking page embarrasses brand | Presets + brand shell |
| Vertical nuance ignored | Vertical P7 flow templates |
| Double data entry | Guest action writes to same booking/customer row |

### 4.2 Client pain

| Pain | `/b` design response |
|------|----------------------|
| Create yet another account | **No login** — phone/email + token |
| Tiny iframe on mobile | Full-bleed mobile guest UI |
| “Which shop am I talking to?” | Business brand header every page |
| Long forms | Vertical-intelligent steps only |
| Lost SMS links | Stable token URLs until expiry |

---

## 5. What `/b` is on Livia — surface types

### 5.1 W5 skin model

```text
publicExperienceSkin = vertical template × presentation preset × brand fields
```

| Input | Source |
|-------|--------|
| Vertical flow | `getVerticalPlaybook()` — consult steps, consent, deposit |
| Preset | `presentation_preset_id` (Track D) — layout morph, density |
| Brand | `logoUrl`, `coverImageUrl`, `brandAccentHex` |
| Guest surface type | `guest-surfaces.ts` (Track G) — route + token pattern |

**Rule:** Dashboard preset picker previews **must include `/b` frame** (D3).

### 5.2 Guest surface catalog

| Surface | Route | Token? | Vertical examples |
|---------|-------|--------|-------------------|
| **Storefront + book** | `/b/{slug}` | No (public slug) | All |
| **Liv chat embed** | `/b/{slug}` (panel) | Session ephemeral | All |
| **Visit / day-of** | `/b/{slug}/visit/{token}` | ✅ | All |
| **Design proof** | `/b/{slug}/proof/{token}` | ✅ | body-art |
| **Consent / intake** | book step or `/intake/{token}` | Partial | medspa, allied-health |
| **Deposit pay** | Stripe guest checkout | Link | deposit verticals |
| **Waitlist accept** | token or keyword | Partial | fitness |
| **Reschedule / cancel** | visit token | Partial | All |

**Thick rule:** Images, signatures, multi-step approval → **always** guest page, never MMS/WA media loops ([`CHANNEL-UX-CONTRACT.md`](../design/CHANNEL-UX-CONTRACT.md)).

### 5.3 Token design (P7 never logs in)

| Property | Spec |
|----------|------|
| Opaque | UUID or signed id — not guessable sequential |
| Scoped | businessId + surface type + artifact id (booking, proof) |
| TTL | Policy per surface — proof until session; visit day window |
| Revocable | Staff can invalidate from proofs desk |
| Channel handoff | SMS/WA: short message + **one URL** |

---

## 6. Page architecture — beyond “advert + book”

### 6.1 Storefront layers (north star)

| Layer | Content | Release |
|-------|---------|---------|
| **Hero** | Cover, logo, name, primary CTA | R1 |
| **Services** | Vertical-grouped offerings | R1 |
| **Social proof** | Reviews stub (honest — R3) | R3 |
| **Team** | Stylists/artists (optional) | R3 |
| **Policies** | Cancel/deposit from jurisdiction pack | R2 |
| **Liv entry** | “Message us” → chat | R1 |

### 6.2 Vertical differentiation (same platform, different experience)

| Vertical | `/b` must feel built for them |
|----------|------------------------------|
| **hair** | Stylist selection, colour consult note |
| **body-art** | Proof link prominence, deposit |
| **medspa** | Consent step, procedure copy |
| **fitness** | Class/waitlist, pack purchases |
| **wellness** | Intake, contraindications |
| **pet grooming** | Pet profile picker |

Implementation: vertical template in policy — **not** separate apps.

### 6.3 Body-art exemplar (tattoo)

```text
Owner: proofs desk → sends guest link
SMS:     "Your design is ready — approve here: {url}"
Guest:   /b/{slug}/proof/{token} — image, comment, approve/reject
Staff:   Inbox notification → Today session
```

This is the **reference story** for why `/b` > static website — documented in gateway wedge + Track G.

---

## 7. Visual & UX principles

| Principle | Application |
|-----------|-------------|
| **Mobile-first** | P7 lives on phone; north-star PNGs are 9:19 |
| **Brand forward** | Business logo > Livia wordmark; Liv speaks, Livia Inc invisible |
| **Clarity over cramming** | One primary action per screen; hair wedge lesson applies |
| **Preset morph** | Same data, different layout density — owner choice |
| **Honest** | Don’t show proof UI if vertical doesn’t support it |
| **Accessible** | 44px targets, contrast, reduced motion |

Anchors: [`public-book-mobile`](../design/assets/livia-evolution/northstar/public-book-mobile.png), [`guest-proof-mobile`](../design/assets/livia-evolution/northstar/guest-proof-mobile.png).

---

## 8. Relationship to tenant app (W4)

| W4 (staff) | W5 (guest) |
|------------|------------|
| Proofs desk sends token | Guest approves on `/b/proof` |
| Inbox sees DM | Guest starts on `/b` chat |
| Today shows session | Guest opens visit token day-of |
| Settings → public link | Owner copies `/b/{slug}` |

**Same booking row** — programmatic invariant. UI is two skins on one API.

---

## 9. Relationship to channels

| Channel | Role |
|---------|------|
| SMS / WhatsApp | Notify + link to `/b/.../token` |
| Voice | May send follow-up link (future) |
| Email | Branded template → same URL |

Never: proof image ping-pong in WA chat as primary workflow.

---

## 10. Programmatic requirements

Before `/b` feature is “done”:

1. **Policy** — guest surface definition in `guest-surfaces.ts`
2. **API** — public routes + token validation + vertical gates
3. **Events** — proof approved → notification → Today
4. **Support** — `surfaceId` for each guest route
5. **E2E** — marketing → demo → onboard → book → proof link (R1 wedge)

---

## 11. Release alignment

| Release | `/b` deliverable |
|---------|------------------|
| **R1** | Book mobile pass; visit token polish; proof page v1 (body-art); brand header |
| **R2** | Consent/deposit surfaces; preset morph on public; policy footer |
| **R3** | Full vertical matrix; optional custom domain; storefront depth (team, gallery) |

Evolution PNGs: `now/` = R1 honesty; `v3/` = mid; `northstar/` = ceiling.

---

## 12. Anti-patterns

- Generic “Salon booking” for every vertical
- Forcing P7 to create Livia account
- MMS/WA as design approval primary surface
- Cramming proof + book + pay on one scroll without steps
- Applying internal amber UI on public pages
- `/b` that looks identical across businesses (preset + brand exist to prevent this)

---

## 13. Open questions (resolved for v1)

| Question | Decision |
|----------|----------|
| Custom domain? | R3 — `/b` slug first |
| Replace owner website entirely? | No — become primary **operations** URL; SEO site optional |
| Login for returning clients? | Optional phone recognition — never required for core flows |
| Multi-location? | Chain hosts use slug per business; host rollup stays W4 |

---

## 14. Changelog

| Date | Change |
|------|--------|
| 2026-05-30 | Full `/b` public surface spec — purpose, verticals, tokens, platform links |
