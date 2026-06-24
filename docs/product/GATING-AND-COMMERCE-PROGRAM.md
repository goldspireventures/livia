# Gating & commerce program

**Status:** canonical (2026-06-21)  
**Policy hub:** `lib/policy/src/platform-gating-program.ts`  
**Plans:** `lib/entitlements` `PLAN_CATALOGUE` · **Add-ons:** `ADDON_CATALOGUE`  
**Unlock UI:** `lib/policy/src/commerce-entitlements-program.ts` · dashboard `FeatureUnlockGate`  
**Pricing authority:** [`../business/pricing-and-packaging.md`](../business/pricing-and-packaging.md)

---

## Business POV — what owners get

### Standard (Solo €79 / Studio €149)

Every paying shop gets the **people-business OS core**:

| Capability | Why it beats incumbents |
|------------|-------------------------|
| Bookings & calendar | One vertical-aware diary — not bolt-on scheduling |
| Clients + `/my` guest hub | Continuity across visits; guests manage without calling |
| Public booking page | Branded link or subdomain — no marketplace lock-in |
| Liv on Today / Inbox | Vertical copy and acts — not generic AI sidebar |
| CSV migration | Switch from Phorest/Fresha/Acuity without retyping |
| Stripe deposits | Pay on your page — not only in-salon terminal |

**Trial** includes core ops **without** voice receptionist or deposits until upgrade.

### Included but activated after onboarding

These are **not** separate add-on SKUs — owners turn them on when ready:

| Capability | When | Where |
|------------|------|--------|
| **Shop SMS number** | After go-live | Settings → Communications → search & provision |
| **Phone receptionist (Liv answers)** | Same number as SMS | Included on Solo/Studio; 4% outcome share on recovered bookings (capped in digest) |
| **Email sender** | Anytime | Settings → Communications |
| **Liv on booking page** | Anytime | Settings → Liv |

**Onboarding act A7 (Channels)** connects Meta/WhatsApp when available — **not blocking** for go-live. SMS/voice number provision is **post-onboarding**, not during signup.

### Premium add-ons (natural upgrade paths)

| Add-on | Price | Gates (full page) | Vertical sweet spot |
|--------|-------|-------------------|---------------------|
| **Take-Home Retail** | €29/mo | `/store`, beauty-store | Hair, beauty, wellness, medspa — aftercare revenue |
| **Event Operator** | €49/mo | `/enquiries`, `/quotes`, `/event-site` | Event vendors — quotes + milestone deposits |
| **Peer insights** | €49/mo | Settings / reports element | Studios comparing fill rate |

Event Operator **bundles** milestone deposits and event prep — no separate page gates; unlocked with the pack.

---

## How we gate (engineering)

| Pattern | Use when | Example |
|---------|----------|---------|
| **Full page gate** | Whole workflow is add-on | `FeatureUnlockGate` on `/store`, `/enquiries` |
| **Element gate** | Feature inside a page | Retail attach on booking detail |
| **Route guard** | Vertical-only surface | `/enquiries` only for `event-vendors` |
| **API entitlement** | Server truth | `voice_receptionist`, `sms_outbound`, `retail` routes |
| **Onboarding optional** | Never block go-live | A7 channels, Twilio provision |

**Rule:** Never gate the sacred metric path (register → shop → menu → **first booking**) behind paid add-ons.

---

## Voice & Twilio — FAQ for GTM

1. **Is voice an add-on?** No — `voice_receptionist` is on Solo/Studio plans. Revenue is **outcome share** on voice-recovered bookings (see pricing doc).
2. **When do they get a number?** Owner provisions in **Settings → Communications** after onboarding. Same number handles SMS + voice.
3. **Required during onboarding?** **No.** A7 is optional; blocking acts are shop profile, hours, Liv, public link.
4. **Can they sign up later?** Yes — anytime after plan is active and `sms_outbound` / `voice_receptionist` entitlements apply.
5. **Trial?** Trial plan excludes voice receptionist until upgrade to Solo/Studio.

---

## Registration paths

| Path | Flow |
|------|------|
| **Marketing → Get started** | `livia.io/get-started` → dashboard `/sign-up` → legal acceptance → onboarding wizard |
| **Marketing → Book demo** | Lead capture → demo gate → wedge (design partners) |
| **Marketing → Waitlist** | Batch invites → email on `LIVIA_BETA_INVITE_EMAILS` |
| **API / partner** | `POST /businesses` with auth — same onboarding state machine |

Beta gate: `LIVIA_BETA_SIGNUP_MODE` (`open` / `invite` / `closed`) controls **shop creation**, not Clerk account creation.

---

## Owner-facing language rules

- Say **booking page**, not `/b`
- Say **Connect your shop number**, not Twilio webhook URL
- Say **Import from spreadsheet**, not CSV/OAuth in primary UI
- Say **Unlock Take-Home Retail**, not `retail_pack` entitlement

Tone pass: owner UI must not expose env var names, entitlement keys, or internal route slugs (`/b`, `/e/`).

---

## Cascade checklist

When changing gates:

1. `lib/entitlements` plan or addon catalogue  
2. `platform-gating-program.ts` + this doc  
3. `commerce-entitlements-program.ts` unlock copy  
4. Dashboard `FeatureUnlockGate` + mobile `FeatureUnlockCard`  
5. API `entitlements-gate.ts` / route middleware  
6. Marketing `pricing-catalog.ts` parity  
