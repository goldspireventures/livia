# Bliq

This repository is the **Bliq** app: Next.js + Prisma + tenant-scoped APIs.

**Foundational doc (read first):** **`docs/BLIQ_BUILD_PLAN.md`** — product vision, non‑negotiable architecture, philosophies (booking, payments, messaging, storefront, AI, UX), and phased roadmap.

Supporting references: **`docs/ROADMAP.md`**, **`docs/MASTER_SPINE.md`**, **`docs/elite/README.md`** (API/security/event/UX/release/testing standards), **`docs/REPO_DELTA.md`**, **`.cursor/rules/bliq.mdc`**, **`docs/CURSOR_RULES.md`**, **`prisma/schema.prisma`**.

Open **`PORTFOLIO/GLOBAL/Bliq`** (this folder) as the Cursor workspace root for a dedicated Bliq session. Shared parent workspaces (e.g. all of Lazarus) also work but pull in unrelated context.

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
