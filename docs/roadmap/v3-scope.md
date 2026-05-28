# v3 scope — DACH + medspa + allied health + enterprise

**Status:** Lock-soft (2026-05-07), **expanded 2026-05-22** (experience + booking continuity). **Active delivery:** [`../product/V3-EXECUTION-PROGRAM.md`](../product/V3-EXECUTION-PROGRAM.md). Calendar 2028–2029 is a **target**, not a deferral. Acceptance: v2 → v3 graduation in `v2-scope.md` + the additions below.

## v3 promise (one sentence)

Livia is the operator-as-a-service for **European appointment-based service businesses** with depth into **Medspa** and **Allied health** verticals, presence across **DACH**, **France**, **Iberia**, and an **enterprise tier** with SOC2 Type 2, BYOK, and white-label brand-shells.

## What's added in v3

### Verticals added
- **Medspa** — informed-consent workflows; medical-grade documentation; regulated treatment compliance per market.
- **Allied health adjacency** — dental hygienist, physiotherapy, mental-health-adjacent (talk therapy, coaching, nutritionist). Each with appropriate consent/intake/regulatory layer.
- **Pet grooming** — `pet-grooming` pack; pet profiles (`pets` + `booking_pets`); breed/temperament continuity templates.
- **Automotive detailing** — `automotive-detailing` pack; vehicle-detail intake via booking continuity thread.

We are explicit: **we do not enter regulated medical/mental health primary practice.** We adjacency the support roles. The line is "appointment-based service business with health adjacency" not "primary clinical care."

### Configurations deepened
- **C9 Large multi-shop (10+ shops)** — enterprise chain support; SOC2-grade isolation (per ADR 0014 schema-per-tenant for chains ≥10 shops).
- **C11 Franchise** at deep R5 — full franchise operations stack.

### Locales added
- **German** (DE + AT + CH-DE, with Hochdeutsch primary; Schwyzerdütsch surface for CH-DE customers).
- **French** (FR + Wallonia + CH-FR + LU + parts of Canada deferred).
- **Spanish** (ES Castilian; LATAM deferred).
- **Portuguese** (PT; BR deferred).
- **Italian** (IT).
- **Dutch** (NL + Flanders).

Per-locale character lead, eval set, brand-of-Liv localisation. Significant investment — each locale ~€60k+ to do at quality.

### Experience & continuity (v3 expansion — 2026-05-22)

- **Alive product standard** — motion tokens, emotional beats, reduced-motion/sound gates on all seven surfaces ([`V3-EXPERIENCE-SPEC.md`](../product/V3-EXPERIENCE-SPEC.md)).
- **`booking-continuity-bridge`** — after any booking, one canonical thread (SMS/WA/email primary; IG deep-link optional); no orphan “DM the stylist” step.
- **`unified-conversation-thread`** — inbox shows channel badges, attachments, booking linkage; ops trace is one story.
- **`style-intake-on-confirm`** — post-book prompt for reference images in-thread (hair, tattoo; counsel-gated for medspa).
- **`stuck-booking-queue`** — web booked, no continuity reply within SLA → owner/manager queue.
- **Real-world scenario catalog** — 20+ pains → blocks ([`V3-REAL-WORLD-SCENARIOS.md`](../product/V3-REAL-WORLD-SCENARIOS.md)).

### Workflows added
- `booking-continuity-bridge` — see above (P0).
- `medspa-informed-consent` — per-procedure consent flow with statutory-compliance per market.
- `medical-intake-comprehensive` — medication list, allergies, conditions, prior procedures.
- `regulatory-export` — per-market regulatory reporting (e.g., DE BMG-related obligations for medspa).
- `franchise-onboarding-wizard` — full franchisee provisioning flow.
- `enterprise-sso-provisioning` — SAML / OIDC; bulk staff onboarding.
- `byok-key-rotation` — tenant-managed encryption key lifecycle.

### Features added
- **`continuity-templates`** — per-vertical/locale outbound copy after book (DE formal tone, hair style prompt, medspa calm).
- **`booking-media-gallery`** — attachments from threads on booking + customer profile.
- **`brand-shell-white-label`** — partner can co-brand Liv as their character within their portal (regulated; brand-of-Liv stewards approve each).
- **`enterprise-audit-export`** — per-period regulatory export for enterprise customers (SOC2/ISO27001 evidence packs).
- **`byok-encryption-control-panel`** — tenant-managed key visibility + rotation.
- **`per-locale-cross-tenant-intelligence`** — peer-sets respecting locale + vertical; per-market insights.
- **`regulatory-disclosure-overlay`** — auto-injected per-market regulatory text on customer-facing surfaces (e.g., DE Impressum, FR cookie regime).

### Pricing changes
- New **Enterprise tier** (SOC2 Type 2 evidence, BYOK, schema-per-tenant, dedicated CS, 4-hour SEV1 SLA): negotiated per-customer; floor ~€2,000/mo.
- Per-vertical add-ons:
  - Medspa: +€80/mo (informed-consent + comprehensive intake + regulatory).
  - Allied health: +€40/mo.
- Cross-tenant intelligence remains €49/mo; locale-pricing flat (no premium).

### Markets opened
- Germany (Berlin → Munich → Hamburg → nationwide).
- Austria (Vienna).
- Switzerland (Zurich).
- France (Paris → Lyon → Marseille).
- Spain (Madrid → Barcelona).
- Portugal (Lisbon).
- Italy (Milan first).
- Netherlands (Amsterdam).

Sequencing per `docs/business/geographic-expansion.md`.

### Migration tooling added
- ✅ Brokers for any DACH/FR/ES/IT/NL incumbent we encounter ≥3 design-partner requests for.
- ✅ Bulk migration tooling for chain customers leaving Phorest enterprise / Mindbody enterprise.

### Integrations added
- ✅ SEPA Direct Debit primary for DACH/FR.
- ✅ EU-specific consent/audit tooling per market (e.g., DE-BMG-aligned medspa).
- ✅ Public API GA (rate-limited; documented; OAuth2; sandbox; partner programme).
- ✅ Webhook system GA.

## Beyond v3 — explicit nots (the durable "no" list)

These remain off the roadmap regardless of scale. From F7 narrowing and F9/F10:

- **No US expansion.** EU-anchored is brand.
- **No emerging-market expansion** (LATAM, MENA, APAC, India). Focus.
- **No marketplace booking.** Per Bet 5 — we don't insert ourselves between salon and customer.
- **No restaurant/hospitality vertical.** Toast owns; we don't compete.
- **No retail-only vertical.** We're appointment-based.
- **No primary clinical-care vertical** (GP, oncology, surgical specialty). Allied health adjacency only.
- **No on-prem deployment.** Cloud-only; managed runtime.
- **No B2C white-label** (consumer-rebranded Liv). Partner-portal is partners + their professional customers, not consumers.
- **No display advertising / data-resale model.** Per Bet 5 + privacy posture.

## Acceptance criteria for v3 ship

1. v2 acceptance continues to hold.
1b. **Booking continuity:** design partner completes web book → thread reply → stylist sees attachments on booking without manual IG hunt (Scenario 01).
1c. **Experience:** hair vs medspa demo shows distinct motion/copy on same codebase; `/b` confirm includes Next steps panel.
2. ≥1 paying enterprise tier customer operational for 60 days.
3. SOC2 Type 2 audit complete (Type 1 from launch-plan; Type 2 from sustained operation).
4. Each new locale has ≥10 paying tenants AND eval-pass rate ≥97% per persona × cell × locale.
5. Medspa informed-consent validated by counsel per market opened.
6. BYOK rotation tested with at least one enterprise customer through full cycle.
7. White-label brand-shell programme has ≥1 active partner (with brand-of-Liv stewards' approval per partner).

## Beyond v3 — the 5-year mark and the 20-year horizon

`docs/company/founding-story.md` describes the 5-year and 20-year vision. v3 puts us at the 5-year horizon. Beyond v3, the question becomes whether the operator-as-a-service architecture generalises beyond appointment-based services (legal, accounting, dental, veterinary; field-service; education; hospitality hierarchies) — a question the v3-and-beyond foundation audit will answer with evidence rather than speculation.

## Open questions

- Enterprise tier — should it be a separate product or a tier within Livia? (Currently leaning tier; switch to product if go-to-market motion materially diverges.)
- Allied health vertical — which specific specialties first? (Pending design-partner signal at v2.)
- White-label partners — what's the IP / legal framework? (Brand stewards + counsel TBD.)
