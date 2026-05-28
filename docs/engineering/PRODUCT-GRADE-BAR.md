# Product-grade bar (PR checklist)

Every PR touching tenant product must consider:

## Copy

- [ ] No “salon” unless `vertical === hair` and user-facing pack label requires it
- [ ] Uses `businessVocabulary()` or persona ritual strings
- [ ] AI disclosure unchanged or improved ([`lib/ai-disclosure`](../../lib/ai-disclosure/))
- [ ] Readable by non-technical owner (no internal jargon)

## Code

- [ ] `pnpm typecheck` passes
- [ ] OpenAPI updated + `pnpm codegen` if API changed
- [ ] No hand-edits in generated packages
- [ ] Tenant-scoped queries (`businessId`)
- [ ] Human mutations → audit where applicable

## UX

- [ ] Loading / empty / error states
- [ ] Mobile considered or explicitly web-only with doc note
- [ ] `data-testid` on primary actions (E2E)

## Security

- [ ] `requireAuth` + `requireRole` on new routes
- [ ] No secrets in repo

## Docs

- [ ] If behavior changes: update `LIVIA-PRODUCTION-READY` or surface matrix row

## Release (v3+ — whole product)

Per [`release-pipeline.md`](../engineering/release-pipeline.md) § Whole-product release rule:

- [ ] PR lists **surface sweep**: api · dashboard · mobile · marketing · public `/b` · internal · policy (each: changed or N/A)
- [ ] `docs/changelog.md` updated if this change ships to customers
- [ ] No new marketing claim without `marketing-vs-reality.md` row
