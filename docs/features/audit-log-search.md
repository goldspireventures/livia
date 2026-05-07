# Feature S2.04 — Audit log search

**What it is.** Searchable, filterable, time-bounded log of every action Liv (and every human) has taken in the tenant. The trust-amplification surface that makes Rung 3+ possible.

**Surfaces.** Web dashboard primary. Mobile read-only secondary.

**Configurations.** Universal.

**Verticals.** Universal.

**Personas.**
- OWN: full access to tenant log.
- ADM: actions where they are initiator, subject, or in routing chain.
- ADM-D: actions within their delegation scope.
- STA: own actions only.
- REC: own actions only.

**Modalities.** Visual.

**Rung.** R1+ (audit log is recorded from day one; the surface is for OWN/ADM at any rung).

**Dependencies.** Append-only audit-log table (per F8 ADR forthcoming); search index (Postgres FTS or Meilisearch); permission layer.

**Complexity.** M (well-bounded; one table; one search surface; permission-aware).

**Sub-features.**
- Filters: action category, initiator (Liv vs human user), subject (customer, staff, booking), time range, outcome.
- Free-text search across action descriptions and rationales.
- Saved searches (per user).
- Export to CSV/PDF (with permission check; download audit-logged itself).
- "Show me Liv's decisions only" toggle.
- "Show me Liv's wrong decisions" filter (rollbacks).
- Inline detail panel: full context of any action (input, reasoning, output, audit-trail of subsequent actions).

**Power-user / casual.**
- Casual: Owner-friendly summary; "what did Liv do this week?" auto-search.
- Power-user: full filter syntax; saved-search aliases; raw export.

**Accessibility.**
- Keyboard-first navigation.
- Screen-reader compatible (every row labelled).
- High-contrast mode (Aurora-Midnight at higher contrast).

**The "in its own league" angle.**
- **Phorest et al. have audit logs.** They are not designed as a trust-amplification surface — they're compliance archives.
- **Livia's audit log IS the product surface for trust escalation.** Owners read it weekly (via the digest); promote Liv based on what they see.
- The audit log is **what makes Rung 3 ethically possible.** Without it, autonomous-action would be unaccountable. With it, every Liv-action is reviewable, reversible, learnable.

## Compliance notes

- **EU residency** — audit log replicas never leave EU.
- **Retention** — 7 years for tax-adjacent (refunds, deposits, payouts); 24 months default for ops; configurable per tenant.
- **GDPR** — special-category data (health, allergies) referenced in actions is logged via reference-id only; the data itself is in encrypted-at-rest store with row-level access logging.
- **Subpoena-readiness** — export to evidence-ready format; chain-of-custody preserved.
- **Reads are themselves audited.** Reading an audit entry is also logged.

This is the kind of compliance the user sees as a feature, not a tax. F9 packaging: never an upsell — security is a foundation, not a tier.
