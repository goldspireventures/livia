# Feature flags — per-tenant beta specification

**Status:** canonical (2026-05-31)  
**Audience:** engineering, ops  
**Purpose:** Roll out guest hub, presets, vertical betas without env-only toggles.

---

## 1. Model

```typescript
type TenantFlag = {
  businessId: string;
  flagKey: string; // e.g. guest_hub_beta, preset_morph_v2
  enabled: boolean;
  enabledAt: string;
  enabledBy: string; // ops operator email
};
```

Storage: `business_feature_flags` table or JSON on business row for R1 lite.

---

## 2. Surfaces

| Consumer | Behaviour |
|----------|-----------|
| **API** | `GET /me/tenant-experience` includes `flags: string[]` |
| **Dashboard** | Hide nav routes when flag off |
| **Internal** | `/flags` view exists — wire to API |
| **Support** | Context pane shows active flags |

---

## 3. Standard flags (initial)

| Key | Meaning |
|-----|---------|
| `guest_hub_beta` | W6 `/my` routes |
| `public_pwa` | `/b` manifest |
| `liv_voice_prod` | Voice beyond demo |
| `vertical_{code}` | Partner vertical preview |

---

## 4. Changelog

| Date | Change |
|------|--------|
| 2026-05-31 | Initial feature flags spec |
