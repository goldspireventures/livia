# Global search — platform specification

**Status:** canonical draft (2026-05-31)  
**Audience:** product, engineering, design  
**Purpose:** Cross-entity search for **tenant users** — find customers, bookings, inbox threads, and (role-gated) audit entries without hunting sidebars.

**Gap:** Identified in [`SYSTEMS-COMPLETENESS-AUDIT.md`](./SYSTEMS-COMPLETENESS-AUDIT.md) — no prior spec.

---

## 1. Principles

1. **Persona-scoped** — staff never see other stylists' customers unless policy allows.
2. **Actionable results** — tap → correct detail screen with `surfaceId` for support.
3. **Fast** — debounced 300ms; results <500ms p95 on typical tenant size.
4. **Vertical copy** — result subtitles use `businessVocabulary()`.
5. **No P7 global search** — guests use `/b` and token links only; W6 hub has separate "my bookings" list.

---

## 2. Scope by persona

| Persona | Searchable entities |
|---------|---------------------|
| Owner / Manager | Customers, bookings, inbox, services, staff |
| Staff | **Own** customers + bookings + assigned inbox |
| Receptionist | All floor customers, bookings, inbox |
| Founder | Per-shop scoped when switched; chain search **deferred R3** |

---

## 3. UI placement

| Surface | Pattern |
|---------|---------|
| **Web dashboard** | Cmd/Ctrl+K command palette + header search icon |
| **Mobile** | Search tab or pull-down on Today (P4: customers + own bookings only) |
| **Internal ops** | Separate — tenant slug / ticket id (not this spec) |

Empty query: recent customers + today's bookings (persona-scoped).

---

## 4. API (target)

```
GET /api/me/search?q={text}&types=customer,booking,inbox&limit=20
```

Response rows:

```typescript
type SearchHit = {
  type: "customer" | "booking" | "inbox" | "service" | "staff";
  id: string;
  title: string;
  subtitle: string;
  href: string;
  mobileHref?: string;
  surfaceId: string;
};
```

Implementation: Postgres `ILIKE` + trigram index v1; OpenSearch optional R3.

---

## 5. UX

- Skeleton list matching result row layout.
- Highlight matched substring.
- "No results" → suggest add customer or check spelling.
- Reduced motion: instant list replace, no stagger on search.

---

## 6. Release

| Release | Deliverable |
|---------|-------------|
| R1 | Customer + booking search, web palette |
| R2 | Inbox + mobile |
| R3 | Founder cross-shop (with privacy rules) |

---

## 7. Changelog

| Date | Change |
|------|--------|
| 2026-05-31 | Initial spec |
