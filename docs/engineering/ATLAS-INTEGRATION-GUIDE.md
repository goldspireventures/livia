# Atlas integration guide — company knowledge layer

**Status:** canonical draft (2026-05-31)  
**Audience:** engineering, ops, future internal dev  
**Purpose:** How **Atlas** (internal `/knowledge` — docs, runbooks, investigation) connects to **code, support, and exec cockpit** so knowledge stays findable as Livia scales.

**Surface:** `artifacts/livia-internal` → `/knowledge` (nav: “Atlas (docs)”)

---

## 1. What Atlas is

| Layer | Role |
|-------|------|
| **Canonical docs** | `docs/` tree — [`DOC-CANONICAL-INDEX.md`](../DOC-CANONICAL-INDEX.md) wins conflicts |
| **Atlas UI** | Internal browser for runbooks, ADRs, investigation — not tenant-facing |
| **Exec cockpit** | Hats + Ship Lane link to Atlas for “how do we ship / support this?” |
| **Support Thread** | Context pane pulls tenant facts; Atlas holds **platform** truth |

Atlas is **not** a second product database — it indexes and presents what already lives in repo docs + ops APIs.

---

## 2. Integration points (today + R2)

| Consumer | Integration | SSOT |
|----------|-------------|------|
| **Internal nav** | `/knowledge` route | Markdown in repo (or embedded viewer) |
| **Cockpit CTO hat** | “Atlas runbooks” action | `founder-cockpit-hats.service.ts` |
| **Support tickets** | `surfaceId` → registry doc | [`support-points.ts`](../../lib/policy/src/support-points.ts) |
| **Liv internal assist** | Tool context from policy + ticket | `internal-liv.service` |
| **Exec work ledger** | `links[]` on hat events | `pnpm exec:hat-work --link "Doc|path"` |

---

## 3. Naming alignment (critical for Atlas search)

When adding features, use **the same names** in:

1. Policy catalog (if applicable)
2. `surfaceId` / screen card `id`
3. Doc title or H1
4. Atlas tag or folder path

Example chain:

```text
guest-surfaces.ts  type: "proof"
  → surfaceId w5.proof
  → screen card w5.public.proof.mobile.yaml
  → GUEST-SURFACES-AUDIT.md row
  → support playbook snippet in docs/operations/
```

---

## 4. R2+ roadmap

| Item | Description |
|------|-------------|
| **Deep link from ticket** | Context pane → Atlas article for `surfaceId` |
| **Search** | Full-text over `docs/` + ADRs |
| **Runbook status** | Link exec Ship Lane rows to verification scripts |
| **Agent bridge** | Cursor sessions log to exec hat with Atlas doc links |

---

## 5. Rules for contributors

- New **ops-facing** surface → add row to support registry + one Atlas-friendly doc section.
- Do not duplicate vertical lists in Atlas-only markdown — link to policy.
- Prefer [`CODE-CLARITY-STANDARDS.md`](./CODE-CLARITY-STANDARDS.md) paths in runbooks (copy-pasteable).

---

## 6. Related

- [`INTERNAL-EXEC-COCKPIT-SPEC.md`](../product/INTERNAL-EXEC-COCKPIT-SPEC.md)
- [`SUPPORT-POINTS-AND-INVESTIGATION.md`](../operations/SUPPORT-POINTS-AND-INVESTIGATION.md)
- [`PLATFORM-SURFACES-UX-REDESIGN.md`](../design/PLATFORM-SURFACES-UX-REDESIGN.md) § I14

---

## 7. Changelog

| Date | Change |
|------|--------|
| 2026-05-31 | Initial Atlas integration guide |
