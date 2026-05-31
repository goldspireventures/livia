# Documentation audit registry

**Status:** in progress (2026-05-31) — Tier 1 reviewed; 418-file pass ongoing  
**Purpose:** Track **line-by-line** review of every `docs/**/*.md` file.  
**Verdicts:** `keep` · `merge` · `archive` · `delete` · `fix-domain` · `expand`

Automated pass flags: `archive` banner in header, `livia.io` count, thin (<20 lines).

**Tier 1 (2026-05-31):** All [`DOC-CANONICAL-INDEX.md`](../DOC-CANONICAL-INDEX.md) Tier 1 docs → **keep** except `LIVIA-DOCUMENTATION-READINESS` → **archive**. Sprint net-new list at file end.

| Review | Lines | livia.io | File | Verdict | Notes |
|--------|-------|----------|------|---------|-------|
| auto-archive | 154 | 1 | `DOC-CANONICAL-INDEX.md` | keep | Tier 1 — index SSOT |
| reviewed | 164 | 0 | `LIVIA-ALIGNMENT.md` | keep | Tier 1 |
| pending | 185 | 1 | `LOCAL_DEV.md` | | |
| reviewed | 120 | 4 | `PLATFORM-TERMINOLOGY.md` | keep fix-domain | Tier 1 — livia-hq.com canonical |
| pending | 38 | 0 | `README.md` | | |
| reviewed | 52 | 0 | `START-HERE.md` | keep | Tier 1 — build pause entry |
| pending | 28 | 0 | `adr/0001-codename-bliq-renamed-to-livia.md` | | |
| pending | 29 | 0 | `adr/0002-multi-tenant-via-business-id-scoping.md` | | |
| pending | 30 | 0 | `adr/0003-clerk-for-auth.md` | | |
| pending | 36 | 3 | `adr/0004-marketing-site-as-brand-bible.md` | | |
| pending | 40 | 0 | `adr/0005-openapi-as-contract-source.md` | | |
| pending | 31 | 0 | `adr/0006-monorepo-via-pnpm-workspaces.md` | | |
| pending | 45 | 0 | `adr/0007-aurora-tokens-and-gradient-discipline.md` | | |
| pending | 126 | 3 | `adr/0008-mobile-motion-and-materiality.md` | | |
| pending | 135 | 0 | `adr/0009-roles-and-personas.md` | | |
| pending | 123 | 0 | `adr/0010-multi-tenant-and-persona-model.md` | | |
| pending | 135 | 0 | `adr/0011-mobile-flagship.md` | | |
| pending | 36 | 0 | `adr/0012-agent-runtime-per-tenant.md` | | |
| pending | 36 | 0 | `adr/0013-workflow-engine-inngest.md` | | |
| pending | 31 | 0 | `adr/0014-multi-tenant-isolation-hybrid.md` | | |
| pending | 32 | 0 | `adr/0015-audit-log-append-only-hash-chained.md` | | |
| pending | 35 | 0 | `adr/0016-ai-eval-three-layers.md` | | |
| pending | 35 | 1 | `adr/0017-observability-otel-grafana-cloud.md` | | |
| pending | 63 | 0 | `adr/0018-composable-monetisation-architecture.md` | | |
| pending | 37 | 0 | `adr/0019-multi-surface-architecture.md` | | |
| pending | 33 | 2 | `adr/0020-v2-engineering-close-boundary.md` | | |
| auto-archive | 66 | 0 | `archive/README.md` | | |
| pending | 132 | 2 | `audits/PLATFORM-PRODUCTION-READINESS-AUDIT.md` | | |
| reviewed | 82 | 0 | `audits/marketing-vs-reality.md` | keep | Phase 10 audit 2026-05-31 |
| pending | 82 | 0 | `audits/v1-scope-drift-audit.md` | | |
| pending | 56 | 0 | `brand/README.md` | | |
| pending | 23 | 0 | `brand/assets/README.md` | | |
| pending | 227 | 0 | `brand/messaging-by-persona.md` | | |
| pending | 182 | 0 | `brand/voice.md` | | |
| pending | 191 | 0 | `business/MARKET-COUNTRY-PLAYBOOKS.md` | | |
| pending | 90 | 0 | `business/OPERATOR-READY-PACK.md` | | |
| pending | 61 | 0 | `business/README.md` | | |
| pending | 79 | 0 | `business/battlecard-livia-vs-incumbent-ai.md` | | |
| pending | 24 | 0 | `business/booksy-import-runbook.md` | | |
| pending | 123 | 0 | `business/competitive-response-wargame.md` | | |
| auto-thin | 19 | 0 | `business/data-room-index.md` | | |
| pending | 69 | 0 | `business/design-partner-interview-template.md` | | |
| pending | 79 | 0 | `business/design-partner-programme.md` | | |
| pending | 21 | 1 | `business/design-partner-sla-paragraph.md` | | |
| pending | 26 | 0 | `business/design-partner-tracker-template.md` | | |
| pending | 46 | 0 | `business/design-partner-week0-2-playbook.md` | | |
| pending | 73 | 0 | `business/geographic-expansion.md` | | |
| pending | 41 | 1 | `business/partner-update-memo-template.md` | | |
| reviewed | 100 | 0 | `business/pricing-and-packaging.md` | keep | People-business alignment |
| reviewed | 89 | 0 | `business/sales-motion.md` | keep | People-business pitch |
| pending | 27 | 0 | `business/scale-motion-playbook.md` | | |
| pending | 30 | 0 | `business/templates/ai-disclosure-for-customers.md` | | |
| pending | 33 | 0 | `business/templates/customer-booking-policy.md` | | |
| pending | 34 | 0 | `business/templates/leave-and-rota.md` | | |
| pending | 26 | 0 | `business/templates/post-visit-feedback.md` | | |
| pending | 26 | 0 | `business/templates/running-late-procedure.md` | | |
| pending | 36 | 0 | `business/templates/team-on-livia.md` | | |
| auto-thin | 18 | 0 | `business/wedge-metrics-tracker-template.md` | | |
| pending | 78 | 3 | `changelog.md` | | |
| pending | 84 | 0 | `company/EXECUTION-PHASE-PROGRESS.md` | | |
| pending | 426 | 5 | `company/EXECUTIVE-ACTION-PLAN.md` | | |
| pending | 981 | 5 | `company/EXECUTIVE-MULTI-HAT-REVIEW.md` | | |
| pending | 87 | 3 | `company/FOUNDER-BACKLOG.md` | | |
| pending | 123 | 1 | `company/NORTH-STAR-DASHBOARD.md` | | |
| reviewed | 143 | 0 | `company/brand-of-livia-and-liv.md` | keep | LIV-TONE matrix linked |
| pending | 97 | 0 | `company/exit-and-acquirer-thesis.md` | | |
| pending | 66 | 0 | `company/founding-story.md` | | |
| pending | 110 | 0 | `company/hiring-plan.md` | | |
| auto-archive | 153 | 2 | `company/livia-internal-portal-spec.md` | | |
| pending | 90 | 0 | `company/operating-principles.md` | | |
| pending | 109 | 0 | `competitive-landscape.md` | | |
| pending | 27 | 0 | `compliance/soc2-control-mapping.md` | | |
| pending | 66 | 0 | `compliance/soc2-type1-kickoff-checklist.md` | | |
| pending | 201 | 0 | `configurations.md` | | |
| pending | 150 | 0 | `customer-typologies.md` | | |
| pending | 116 | 0 | `customer-typology-skeleton.md` | | |
| pending | 109 | 11 | `demo-gateway.md` | | |
| pending | 155 | 2 | `demo-script.md` | | |
| pending | 77 | 0 | `design/BRAND-LOGO-CONCEPTS.md` | | |
| reviewed | 197 | 0 | `design/CHANNEL-UX-CONTRACT.md` | keep | Part 10 vertical examples |
| reviewed | 145 | 0 | `design/GATEWAY-SURFACE-PROGRAM.md` | keep | §9 build audit |
| reviewed | 110 | 0 | `design/MARKETING-SURFACE-PROGRAM.md` | keep | §9 build audit |
| reviewed | 479 | 4 | `design/EXPERIENCE-ARCHITECTURE.md` | keep | Experience layers SSOT |
| reviewed | 65 | 0 | `design/LIVIA-EVOLUTION-SCREENS.md` | keep | northstar/now/v3 tiers |
| reviewed | 109 | 0 | `design/MOBILE-UX-PRINCIPLES.md` | keep | P7 primary updated |
| reviewed | 158 | 0 | `design/PERSONA-VERTICAL-SURFACE-MATRIX.md` | keep | All verticals filled |
| reviewed | 86 | 0 | `design/VISUAL-INHERITANCE-AND-BRAND-LOCKS.md` | keep | Founder locks |
| reviewed | 804 | 1 | `design/PRESENTATION-PRESETS-AND-ROLLOUT.md` | keep | Track D |
| reviewed | 246 | 0 | `design/SURFACE-AND-BREAKPOINTS.md` | keep | Breakpoint morph |
| reviewed | 23 | 0 | `design/motion-tokens.md` | keep | Premium layer linked |
| auto-archive | 661 | 1 | `design/PLATFORM-SURFACES-UX-REDESIGN.md` | | |
| reviewed | 340 | 0 | `design/PLATFORM-SURFACES-BUILD-SPEC.md` | keep | Surface build locks |
| reviewed | 229 | 0 | `design/PLATFORM-SURFACES-CONCEPTS-DEEP.md` | keep | Concept depth |
| reviewed | 119 | 0 | `design/PLATFORM-SURFACES-FINAL-CATALOG.md` | keep | PNG catalog |
| reviewed | 51 | 0 | `design/ux-layout-contract.md` | keep | Layout contract |
| auto-thin | 14 | 0 | `design/assets/livia-evolution/README.md` | keep | Asset index |
| pending | 68 | 0 | `design/PRODUCT-UX-SYSTEM.md` | merge | Fold into UI-UX-MASTER |
| auto-thin | 9 | 0 | `design/assets/platform-surfaces/README.md` | keep | Asset index |
| reviewed | 304 | 0 | `engineering/COMPOSABLE-EVOLUTION.md` | keep | Hub evolution model |
| reviewed | 36 | 0 | `engineering/PLATFORM-KERNEL.md` | keep | Kernel doc |
| reviewed | 41 | 1 | `engineering/REPO-LAYOUT.md` | keep fix-domain | Monorepo map |
| reviewed | 131 | 0 | `engineering/api-conventions.md` | keep | API style |
| pending | 87 | 0 | `engineering/audit-log-physical-design.md` | | |
| pending | 132 | 2 | `engineering/browser-and-device-support.md` | | |
| pending | 81 | 1 | `engineering/code-organization.md` | | |
| pending | 242 | 0 | `engineering/composable-monetisation-architecture.md` | | |
| pending | 115 | 0 | `engineering/contributing.md` | | |
| pending | 192 | 0 | `engineering/data-model.md` | | |
| pending | 112 | 0 | `engineering/design-system.md` | | |
| pending | 53 | 0 | `engineering/event-bus-and-workflows.md` | | |
| pending | 47 | 0 | `engineering/events-vs-analytics.md` | | |
| auto-thin | 8 | 0 | `engineering/incident-replay-engine.md` | | |
| pending | 105 | 2 | `engineering/incident-response.md` | | |
| pending | 29 | 0 | `engineering/inngest-prod-runbook.md` | | |
| pending | 89 | 0 | `engineering/integrations-platform.md` | | |
| pending | 65 | 0 | `engineering/multi-tenant-isolation.md` | | |
| pending | 82 | 2 | `engineering/observability-and-on-call.md` | | |
| pending | 37 | 0 | `engineering/partner-api-v1.md` | | |
| pending | 53 | 0 | `engineering/principles.md` | | |
| pending | 140 | 0 | `engineering/release-pipeline.md` | | |
| pending | 146 | 0 | `engineering/security.md` | | |
| pending | 45 | 0 | `engineering/workflows-dev.md` | | |
| pending | 67 | 0 | `experience-matrix.md` | | |
| pending | 163 | 2 | `features/README.md` | | |
| pending | 58 | 0 | `features/audit-log-search.md` | | |
| pending | 49 | 0 | `features/cross-tenant-intelligence.md` | | |
| pending | 52 | 0 | `features/mobile-today-view.md` | | |
| pending | 65 | 0 | `features/voice-receptionist.md` | | |
| pending | 61 | 0 | `features/whatsapp-booking-flow.md` | | |
| pending | 215 | 0 | `foundation/README.md` | | |
| pending | 71 | 0 | `foundation/cross-cutting-commitments.md` | | |
| pending | 122 | 0 | `foundation/glossary.md` | | |
| pending | 38 | 0 | `governance/README.md` | | |
| pending | 79 | 6 | `governance/code-of-conduct.md` | | |
| pending | 89 | 0 | `governance/decision-rights.md` | | |
| pending | 91 | 1 | `governance/ip-and-contribution.md` | | |
| pending | 124 | 0 | `governance/rfc-process.md` | | |
| pending | 64 | 1 | `gtm/VIDEO-ONBOARDING-TOOLS.md` | | |
| pending | 119 | 0 | `gtm/loom-onboarding-1.md` | | |
| pending | 107 | 0 | `gtm/outreach-scripts.md` | | |
| pending | 314 | 0 | `hierarchy-and-delegation.md` | | |
| pending | 79 | 0 | `incidents/README.md` | | |
| auto-thin | 16 | 0 | `integrations/v15-brokers.md` | | |
| auto-thin | 14 | 0 | `integrations/v2-brokers.md` | | |
| pending | 42 | 0 | `journeys/README.md` | | |
| pending | 112 | 0 | `journeys/configuration-graduation.md` | | |
| pending | 87 | 0 | `journeys/lifecycle-moments.md` | | |
| pending | 108 | 0 | `journeys/onboarding-paths.md` | | |
| pending | 63 | 1 | `journeys/p1-multi-shop-chain.md` | | |
| pending | 57 | 0 | `journeys/p2a-single-shop.md` | | |
| pending | 69 | 1 | `journeys/p2b-chair-rental-host.md` | | |
| pending | 86 | 1 | `journeys/p2b-solo-barbershop.md` | | |
| pending | 59 | 0 | `journeys/p3-manager.md` | | |
| pending | 72 | 0 | `journeys/p7-customer-regular.md` | | |
| pending | 86 | 0 | `journeys/seasonal-and-stage.md` | | |
| pending | 197 | 20 | `launch-plan.md` | | |
| pending | 60 | 10 | `legal/README.md` | | |
| pending | 86 | 9 | `legal/cookie-policy.md` | | |
| pending | 23 | 0 | `legal/counsel-product-truth-packet.md` | | |
| pending | 117 | 4 | `legal/customer-data-rights.md` | | |
| pending | 160 | 1 | `legal/dpa-template.md` | | |
| pending | 183 | 9 | `legal/privacy-policy.md` | | |
| pending | 71 | 3 | `legal/sub-processors.md` | | |
| pending | 159 | 12 | `legal/terms-of-service.md` | | |
| pending | 239 | 0 | `livia-as-service.md` | | |
| pending | 408 | 1 | `livia-bets.md` | | |
| pending | 83 | 2 | `livia-manifesto.md` | | |
| pending | 195 | 1 | `livia-positioning.md` | | |
| pending | 135 | 0 | `mobile-roadmap.md` | | |
| pending | 145 | 1 | `modality-and-locale-overview.md` | | |
| pending | 139 | 1 | `modality-and-locale.md` | | |
| pending | 126 | 1 | `onboarding-engineer.md` | | |
| pending | 46 | 0 | `operating-cadence.md` | | |
| pending | 70 | 0 | `operations/APP-STORE-PRODUCTION-CHECKLIST.md` | | |
| pending | 73 | 0 | `operations/APP-STORE-READINESS.md` | | |
| pending | 226 | 2 | `operations/CUSTOMER-SUPPORT-OPERATING-MODEL.md` | | |
| pending | 219 | 0 | `operations/ENV-VARIABLES.md` | | |
| pending | 36 | 0 | `operations/EVAL-REPORT-TEMPLATE.md` | | |
| pending | 52 | 1 | `operations/EXEC-COMMAND-CENTER.md` | | |
| pending | 74 | 0 | `operations/FOUNDER-RELEASE-RUNBOOK.md` | | |
| pending | 34 | 0 | `operations/GATE-2-EVIDENCE-PACK.md` | | |
| pending | 95 | 0 | `operations/INTERNAL-MONITORING.md` | | |
| pending | 81 | 1 | `operations/INTERNAL-SUPPORT-LIFECYCLE.md` | | |
| pending | 94 | 0 | `operations/INTERNAL-SUPPORT-SYSTEM-DESIGN.md` | | |
| pending | 54 | 0 | `operations/ONBOARDING-PORTAL-TEST.md` | | |
| pending | 282 | 1 | `operations/PLATFORM-BACKLOG.md` | | |
| pending | 102 | 0 | `operations/PRODUCTION-CERTIFICATION.md` | | |
| pending | 67 | 0 | `operations/README.md` | | |
| pending | 158 | 0 | `operations/STAGING-MANUAL-CHECKLIST.md` | | |
| pending | 171 | 0 | `operations/STAGING-SETUP.md` | | |
| pending | 403 | 0 | `operations/SUPPORT-POINTS-AND-INVESTIGATION.md` | | |
| pending | 130 | 0 | `operations/VERCEL-PRODUCTION-SETUP.md` | | |
| pending | 96 | 2 | `operations/WORKFORCE-ONBOARDING.md` | | |
| pending | 86 | 0 | `operations/disaster-recovery.md` | | |
| pending | 40 | 0 | `operations/feature-triage-sop.md` | | |
| pending | 64 | 0 | `operations/internal-onboarding.md` | | |
| pending | 79 | 0 | `operations/logging-and-correlation.md` | | |
| pending | 47 | 0 | `operations/openobserve-stream-template.md` | | |
| pending | 23 | 1 | `operations/prod-secrets-inventory.md` | | |
| auto-thin | 16 | 0 | `operations/staging-environment.md` | | |
| pending | 44 | 0 | `operations/staging-prep-livia-hq.md` | | |
| pending | 64 | 0 | `operations/support-runbook.md` | | |
| pending | 74 | 0 | `ops/GO-LIVE-CHECKLIST.md` | | |
| pending | 201 | 0 | `persona-economics-and-switching.md` | | |
| pending | 166 | 0 | `persona-vertical-configuration-matrix.md` | | |
| pending | 378 | 0 | `personas.md` | | |
| auto-thin | 14 | 0 | `policy/DATA-SUBJECT-MAP.md` | | |
| pending | 49 | 0 | `policy/README.md` | | |
| pending | 100 | 0 | `policy/acceptable-use.md` | | |
| pending | 117 | 0 | `policy/access-control.md` | | |
| pending | 105 | 0 | `policy/cross-tenant-intelligence.md` | | |
| pending | 72 | 2 | `policy/data-residency.md` | | |
| pending | 99 | 0 | `policy/data-retention.md` | | |
| pending | 143 | 0 | `policy/dpia-template.md` | | |
| pending | 79 | 0 | `policy/impersonation-audit.md` | | |
| pending | 83 | 1 | `policy/security-policy.md` | | |
| pending | 75 | 0 | `policy/staff-multi-employment.md` | | |
| pending | 72 | 1 | `policy/tenancy-and-billing.md` | | |
| pending | 105 | 8 | `policy/vulnerability-disclosure.md` | | |
| pending | 101 | 0 | `postmortems/README.md` | | |
| auto-thin | 16 | 0 | `postmortems/partner-onboarding-failure-rfc-template.md` | | |
| reviewed | 47 | 0 | `product/APPOINTMENT-BUSINESS-PLATFORM.md` | keep | Cross-linked manifesto |
| reviewed | 195 | 0 | `product/GUEST-CUSTOMER-IDENTITY.md` | keep | P7 identity |
| reviewed | 284 | 0 | `product/INTERNAL-SUPPORT-PLATFORM-SPEC.md` | keep | Thread + Context spec |
| reviewed | 421 | 0 | `product/LIV-OPERATING-SYSTEM.md` | keep | Liv OS north-star |
| archive | 283 | 2 | `product/LIVIA-DETAILED-BUILD-PLAN.md` | archive | Superseded by BUILD-PLAN-V2 |
| archive | 177 | 4 | `product/LIVIA-FINAL-EXECUTION-PLAN.md` | archive | Superseded by FINAL-BUILD-PLAN |
| reviewed | 615 | 1 | `product/LIVIA-MASTER-BUILD-PLAN.md` | keep | Historical; v2 for execution |
| archive | 447 | 2 | `product/LIVIA-MASTER-PLAN.md` | archive | Superseded by wide + v2 plans |
| pending | 159 | 3 | `product/BETA-ONBOARDING-FLOW.md` | | |
| pending | 132 | 0 | `product/BETA-SHOWCASE-PROGRAM.md` | | |
| auto-archive | 71 | 0 | `product/BUILD-BACKLOG.md` | | |
| pending | 107 | 0 | `product/BUSINESS-RULES-REGISTRY.md` | | |
| pending | 136 | 0 | `product/CHANNELS-EU-MESSAGING.md` | | |
| pending | 71 | 1 | `product/ENGINEERING-HANDOFF.md` | | |
| reviewed | 70 | 1 | `product/FOUNDER-SHIP-LANE.md` | keep fix-domain | Tier 1 |
| reviewed | 279 | 0 | `product/INTERNAL-EXEC-COCKPIT-SPEC.md` | keep | Track H ledger shipped |
| pending | 108 | 5 | `product/LAUNCH-PATH.md` | | |
| pending | 45 | 0 | `product/LIV-CAPABILITY-MATRIX.md` | | |
| pending | 118 | 0 | `product/LIV-EXECUTION-PLAN.md` | | |
| pending | 99 | 0 | `product/LIV-OS-ALPHABET.md` | | |
| pending | 643 | 7 | `product/LIVIA-COMPLETE-SYSTEM-SPEC.md` | | |
| reviewed | 207 | 0 | `product/LIVIA-DOCUMENTATION-READINESS.md` | archive | Superseded by DOCUMENTATION-PROGRAM |
| pending | 603 | 2 | `product/LIVIA-EXPERIENCE-DESIGN-BIBLE.md` | | |
| pending | 78 | 3 | `product/LIVIA-FULL-SURFACE-MAP.md` | | |
| reviewed | 635 | 1 | `product/LIVIA-GLOBAL-PRODUCT-SYSTEM.md` | keep | Tier 1 |
| reviewed | 642 | 3 | `product/LIVIA-IDEA-TO-REALITY.md` | keep | Tier 1 |
| pending | 135 | 0 | `product/LIVIA-NORTH-STAR.md` | | |
| pending | 270 | 0 | `product/LIVIA-OS-MASTER-PLAN.md` | | |
| pending | 91 | 0 | `product/LIVIA-OS-MONETIZATION.md` | | |
| reviewed | 244 | 0 | `product/LIVIA-PLATFORM-FLOWS.md` | keep | Tier 1 |
| reviewed | 398 | 0 | `product/LIVIA-PLATFORM-LIFECYCLE.md` | keep | Tier 1 |
| pending | 163 | 4 | `product/LIVIA-PRODUCTION-READY.md` | | |
| pending | 359 | 2 | `product/LIVIA-RESILIENCE-OPS-AND-TRUST.md` | | |
| pending | 204 | 1 | `product/LIVIA_MASTER_DESIGN.md` | | |
| reviewed | 302 | 0 | `product/MULTI-HAT-GAP-REVIEW.md` | keep | Post-sprint addendum 2026-05-31 |
| pending | 54 | 0 | `product/MULTI-STRUCTURE-SCENARIOS.md` | | |
| reviewed | 104 | 0 | `product/NOTIFICATIONS.md` | keep | Links CUSTOMER-NOTIFICATIONS-SPEC |
| pending | 67 | 1 | `product/ONBOARDING-PRODUCTION.md` | | |
| pending | 39 | 0 | `product/OPEN-ITEMS-DEFERRED.md` | | |
| reviewed | 301 | 0 | `product/OPERATION-SOLIDIFY.md` | keep | Tier 1 |
| reviewed | 18 | 0 | `product/PER-VERTICAL-DEMO-SEED.md` | expand | Linked DEMO-WORLD-LIVE — not thin |
| pending | 50 | 0 | `product/PERSONA-UX.md` | | |
| pending | 153 | 0 | `product/PLATFORM-BUILT-RIGHT.md` | | |
| reviewed | 868 | 0 | `product/PLATFORM-EVOLUTION-AND-OPS-PROGRAM.md` | keep | Tier 1 |
| reviewed | 125 | 0 | `product/PLATFORM-RELEASE-PROGRAM.md` | keep | Tier 1 |
| reviewed | 272 | 0 | `product/PUBLIC-B-SURFACE-SPEC.md` | keep | W5 + skin cross-links |
| reviewed | 127 | 0 | `product/PUBLIC-BOOKING-INTAKE-E2E.md` | keep | W5 E2E reference |
| pending | 55 | 0 | `product/README.md` | | |
| reviewed | 38 | 0 | `product/SCOPE-MORATORIUM.md` | keep | GTM wedge ≠ ceiling |
| reviewed | 75 | 0 | `product/TENANT-EXPERIENCE-CONTRACT.md` | keep | Track D contract |
| pending | 85 | 0 | `product/SCREEN-INVENTORY.md` | | |
| pending | 23 | 0 | `product/STARTUP-KILLERS-AND-MITIGATIONS.md` | | |
| pending | 32 | 0 | `product/SURFACE-COMPLETION-MATRIX.md` | | |
| auto-archive | 175 | 0 | `product/SYSTEM-REALIGNMENT-PROGRAM.md` | | |
| reviewed | 58 | 0 | `product/TARGET-STATE-VS-SHIP-SCOPE.md` | keep | Scope honesty |
| auto-archive | 74 | 0 | `product/UX-AUDIT-2026-05-21.md` | | |
| pending | 154 | 0 | `product/UX-CONTEXTUAL-REVIEW.md` | | |
| pending | 49 | 0 | `product/UX-NAVIGATION.md` | | |
| auto-archive | 128 | 0 | `product/V1.5-EXECUTION-PROGRAM.md` | | |
| pending | 68 | 0 | `product/V1.5-SURFACE-MATRIX.md` | | |
| pending | 160 | 4 | `product/V2-ENGINEERING-CLOSED.md` | | |
| auto-archive | 220 | 2 | `product/V2-EXECUTION-PROGRAM.md` | | |
| pending | 138 | 0 | `product/V2-EXPANDED-SCOPE.md` | | |
| pending | 56 | 1 | `product/V2-GTM-WOW-LAYER.md` | | |
| pending | 61 | 2 | `product/V2-SURFACE-MATRIX.md` | | |
| pending | 32 | 0 | `product/V3-BATCH-PHILOSOPHY.md` | | |
| pending | 52 | 0 | `product/V3-ENGINEERING-CLOSED.md` | | |
| pending | 281 | 5 | `product/V3-EXECUTION-PROGRAM.md` | | |
| pending | 204 | 4 | `product/V3-EXPERIENCE-SPEC.md` | | |
| pending | 303 | 0 | `product/V3-REAL-WORLD-SCENARIOS.md` | | |
| pending | 105 | 2 | `product/V3-SURFACE-MATRIX.md` | | |
| pending | 118 | 0 | `product/WEB-MOBILE-PARITY.md` | | |
| pending | 65 | 0 | `product/lifecycle-map.md` | | |
| pending | 27 | 0 | `rfcs/0010-multi-shop-billing-and-rollup.md` | | |
| pending | 24 | 0 | `rfcs/0011-staff-scheduling-rota.md` | | |
| pending | 20 | 0 | `rfcs/0012-hours-to-payroll-export.md` | | |
| pending | 39 | 0 | `roadmap/README.md` | | |
| pending | 86 | 0 | `roadmap/feature-flags-and-rollout.md` | | |
| pending | 79 | 0 | `roadmap/release-calendar.md` | | |
| pending | 134 | 0 | `roadmap/v1-scope.md` | | |
| pending | 99 | 0 | `roadmap/v1.5-scope.md` | | |
| pending | 112 | 0 | `roadmap/v2-scope.md` | | |
| pending | 124 | 0 | `roadmap/v3-scope.md` | | |
| pending | 148 | 19 | `testing/DEMO-EXPLORATION.md` | | |
| pending | 56 | 1 | `testing/DEMO-FULL-SHOWCASE.md` | | |
| pending | 87 | 41 | `testing/DEMO-LOGINS.md` | | |
| pending | 410 | 6 | `testing/E2E-RUNBOOK.md` | | |
| pending | 426 | 0 | `testing/E2E-TESTING-GUIDE.md` | | |
| pending | 54 | 0 | `testing/E2E-VISUAL-REPORT-2026-05-25.md` | | |
| pending | 100 | 0 | `testing/EU-ONBOARDING-READY.md` | | |
| pending | 232 | 8 | `testing/FINAL-TESTING-INSTRUCTIONS.md` | | |
| pending | 262 | 7 | `testing/FIRST-DEMO-WALKTHROUGH.md` | | |
| pending | 37 | 1 | `testing/FIT-FOR-PURPOSE-UX-CHECKLIST.md` | | |
| pending | 261 | 3 | `testing/FOUNDER-FIRST-LOGIN.md` | | |
| pending | 92 | 8 | `testing/FOUNDER-RETEST.md` | | |
| pending | 171 | 10 | `testing/FULL-LIVIA-EXPERIENCE.md` | | |
| pending | 266 | 12 | `testing/FULL-STACK-LOCAL-RUNBOOK.md` | | |
| pending | 243 | 16 | `testing/FULL-TESTING-INSTRUCTIONS.md` | | |
| pending | 81 | 1 | `testing/FULL-VISUAL-AUDIT-WEB-MOBILE.md` | | |
| pending | 241 | 10 | `testing/MANUAL-WALKTHROUGH-BETA.md` | | |
| pending | 59 | 2 | `testing/MANUAL-WALKTHROUGH-DEMO.md` | | |
| pending | 54 | 0 | `testing/PUBLIC-BOOKING-AUDIT.md` | | |
| pending | 153 | 7 | `testing/QUICKSTART.md` | | |
| pending | 102 | 4 | `testing/READY-FOR-FULL-TEST.md` | | |
| auto-archive | 243 | 3 | `testing/REAL-WORLD-E2E-GUIDE.md` | | |
| pending | 64 | 4 | `testing/TEST-EVERY-BUSINESS.md` | | |
| pending | 137 | 5 | `testing/UAT-CERTIFICATION.md` | | |
| pending | 107 | 0 | `testing/UX-FULL-PLATFORM-AUDIT-2026-05-24.md` | | |
| pending | 91 | 1 | `testing/UX-PUNCH-LIST.md` | | |
| pending | 123 | 2 | `testing/V2-FULL-E2E-INSTRUCTIONS.md` | | |
| pending | 122 | 0 | `testing/V3-PREFLIGHT-WALKTHROUGH.md` | | |
| pending | 35 | 0 | `testing/VERTICAL-PRODUCT-MODEL.md` | | |
| pending | 86 | 2 | `testing/VISUAL-AUDIT-LOG.md` | | |
| pending | 60 | 0 | `verticals.md` | | |
| pending | 75 | 0 | `workflows-features-cross-index.md` | | |
| pending | 147 | 0 | `workflows/README.md` | | |
| pending | 109 | 0 | `workflows/book.md` | | |
| auto-thin | 15 | 0 | `workflows/customer-running-late.md` | | |
| pending | 105 | 0 | `workflows/liv-was-wrong.md` | | |
| pending | 106 | 0 | `workflows/no-show.md` | | |
| pending | 106 | 0 | `workflows/owner-on-holiday.md` | | |
| pending | 21 | 0 | `workflows/post-visit-feedback.md` | | |
| pending | 117 | 0 | `workflows/refund-request.md` | | |
| pending | 61 | 0 | `workflows/running-late.md` | | |
| pending | 112 | 0 | `workflows/time-off-request.md` | | |
| pending | 112 | 0 | `workflows/weekly-digest.md` | | |

---

## Doc sprint net-new (2026-05-31) — all **keep**

| File | Notes |
|------|-------|
| `product/PEOPLE-BUSINESS-CATEGORY-MANIFESTO.md` | Category SSOT |
| `product/LIVIA-BUILD-PLAN-V2.md` | Post-gate build |
| `product/LIVIA-DOCUMENTATION-PROGRAM.md` | Active program |
| `product/DEMO-WORLD-LIVE-SPEC.md` | Demo depth |
| `product/SYSTEMS-COMPLETENESS-AUDIT.md` | Systems grid |
| `product/GLOBAL-SEARCH-SPEC.md` | P7 search |
| `product/CUSTOMER-NOTIFICATIONS-SPEC.md` | P7 notifications |
| `product/IMPORT-MIGRATION-SPEC.md` | Migration |
| `product/FEATURE-FLAGS-SPEC.md` | Flags |
| `product/PERFORMANCE-BUDGETS.md` | Perf |
| `product/RESOURCE-INVENTORY-SPEC.md` | Resources R2 |
| `product/VOUCHER-PACKAGE-SPEC.md` | Packages R2 |
| `product/LIV-TOOL-REGISTRY-MATRIX.md` | Liv tools |
| `product/OWNER-BRIEFING-SPEC.md` | Today ritual |
| `design/PREMIUM-MOTION-LAYER.md` | Pulse/glow UX |
| `design/LIV-TONE-PER-SURFACE-MATRIX.md` | Liv vs Livia voice |
| `design/EMPTY-ERROR-LOADING-CATALOG.md` | P0 states |
| `design/FIGMA-SCREEN-MANIFEST.md` | Figma map |
| `design/W6-GUEST-HUB-SCREENS.md` | W6 R2 stub |
| `engineering/CODE-CLARITY-STANDARDS.md` | Naming/modularity |
| `engineering/ATLAS-INTEGRATION-GUIDE.md` | Atlas wiring |
| `engineering/GUEST-SURFACES-AUDIT.md` | Guest routes audit |
| `product/public-flows/` | Per-vertical `/b` L3 |
| `product/vertical-playbooks/` (9) | Vertical L2 |
| `design/screen-cards/` (73 yaml) | L3 screen cards |
