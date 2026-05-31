#!/usr/bin/env node
/**
 * Generates P1 screen card YAML from manifest.
 * Run: node scripts/generate-p1-screen-cards.mjs
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "../docs/design/screen-cards");

const P1 = [
  { id: "w1.marketing.how.web", world: "W1", route: "/how-it-works", artifact: "livia-marketing", persona: ["Prospect"], job: "Explain Liv + people-business OS in story beats.", visual: "M0 shell; scroll sections alternating copy + product crops; aurora editorial." },
  { id: "w1.marketing.verticals.web", world: "W1", route: "/verticals", artifact: "livia-marketing", persona: ["Prospect"], job: "Index all vertical packs honestly with tier badges.", visual: "Grid of vertical cards; icon + label + FIT/PARTNER badge." },
  { id: "w1.marketing.vertical.web", world: "W1", route: "/verticals/:slug", artifact: "livia-marketing", persona: ["Prospect"], job: "Vertical landing — wedge story + demo CTA.", visual: "Hero + 3 beats + /demo/wedge link." },
  { id: "w1.marketing.chair-rental.web", world: "W1", route: "/for/chair-rental", artifact: "livia-marketing", persona: ["Prospect"], job: "Chair-rental host org-shape story.", visual: "Split hero host vs renter; CTA demo host persona." },
  { id: "w1.marketing.contact.web", world: "W1", route: "/contact", artifact: "livia-marketing", persona: ["Prospect"], job: "Lead capture + design partner inquiry.", visual: "Form + editorial aside; POST marketing/leads." },
  { id: "w2.gateway.sign-up.web", world: "W2", route: "/sign-up", artifact: "livia-dashboard", persona: ["Owner"], job: "Clerk sign-up → legal acceptance.", visual: "Gateway aurora split; Clerk SignUp themed." },
  { id: "w2.gateway.legal-accept.web", world: "W2", route: "/legal-acceptance", artifact: "livia-dashboard", persona: ["Owner"], job: "Accept ToS/DPA before onboarding.", visual: "Centered card; scroll legal; accept CTA." },
  { id: "w2.gateway.demo.persona.web", world: "W2", route: "/demo/:persona", artifact: "livia-dashboard", persona: ["Prospect"], job: "Persona-specific demo showcase grid.", visual: "Cards per persona ritual; links to demo logins." },
  { id: "w4.ops.bookings.detail.web", world: "W4", route: "/bookings/:id", artifact: "livia-dashboard", persona: ["P2","P3","P4","P6"], job: "Run one appointment — status, notes, refund ladder.", visual: "Header status chip; timeline; actions row; customer link." },
  { id: "w4.ops.customers.list.web", world: "W4", route: "/customers", artifact: "livia-dashboard", persona: ["P2","P3","P6"], job: "Find any client — search, paginate.", visual: "Search sticky; table/card list; add client FAB." },
  { id: "w4.ops.customers.detail.web", world: "W4", route: "/customers/:id", artifact: "livia-dashboard", persona: ["P2","P3","P4"], job: "Client memory — history, book, vertical extras.", visual: "Profile header; tabs History | Notes | Pets(m); allergy banner beauty/medspa." },
  { id: "w4.ops.staff.list.web", world: "W4", route: "/staff", artifact: "livia-dashboard", persona: ["P2","P3"], job: "Roster management + invite.", visual: "Staff cards with role badge; invite CTA." },
  { id: "w4.ops.staff.detail.web", world: "W4", route: "/staff/:id", artifact: "livia-dashboard", persona: ["P2","P3"], job: "Configure staff — services, hours, color.", visual: "Tabs Profile | Services | Availability." },
  { id: "w4.ops.services.web", world: "W4", route: "/services", artifact: "livia-dashboard", persona: ["P2","P3"], job: "Service catalog CRUD.", visual: "Grouped list by category; edit drawer; duration/price." },
  { id: "w4.ops.audit.web", world: "W4", route: "/audit", artifact: "livia-dashboard", persona: ["P2"], job: "Liv diary — hash-chained audit for trust.", visual: "Dense timeline; filter by actor; export." },
  { id: "w4.ops.classes.web", world: "W4", route: "/classes", artifact: "livia-dashboard", persona: ["P2","P3"], verticals: ["fitness"], job: "Class sessions + waitlist capacity.", visual: "Week grid; capacity bar; waitlist count." },
  { id: "w4.ops.rota.web", world: "W4", route: "/rota", artifact: "livia-dashboard", persona: ["P2","P3"], job: "Staff scheduling across week.", visual: "Grid staff × days; drag shifts R2." },
  { id: "w4.ops.day-packages.web", world: "W4", route: "/day-packages", artifact: "livia-dashboard", persona: ["P2"], verticals: ["wellness"], job: "Spa day multi-service packages.", visual: "Package cards; linked services." },
  { id: "w4.ops.host.web", world: "W4", route: "/host", artifact: "livia-dashboard", persona: ["P2"], job: "Chair-rental host — renters on floor.", visual: "Renter list; micro-business KPIs." },
  { id: "w4.ops.lifecycle.web", world: "W4", route: "/lifecycle", artifact: "livia-dashboard", persona: ["P2"], job: "Org graduation checklist G1–G8.", visual: "Vertical checklist; locked items explained." },
  { id: "w4m.ops.inbox.mobile", world: "W4", route: "/(tabs)/inbox", artifact: "livia-mobile", persona: ["P3","P6"], job: "Mobile inbox parity — threads + handoff.", visual: "List → full-screen thread; takeover bar." },
  { id: "w4m.ops.bookings.mobile", world: "W4", route: "/(tabs)/bookings", artifact: "livia-mobile", persona: ["P3","P6"], job: "Floor agenda mobile.", visual: "Day list grouped by hour." },
  { id: "w4m.ops.customers.mobile", world: "W4", route: "/(tabs)/customers", artifact: "livia-mobile", persona: ["P4"], job: "Scoped client search mobile.", visual: "Search + alphabet jump optional." },
  { id: "w4m.ops.approvals.mobile", world: "W4", route: "/(tabs)/approvals", artifact: "livia-mobile", persona: ["P3"], job: "Manager approval queue mobile.", visual: "Card stack; swipe approve R2." },
  { id: "w4m.booking.detail.mobile", world: "W4", route: "/booking/[id]", artifact: "livia-mobile", persona: ["P4"], job: "Booking detail on floor.", visual: "Compact header; client; actions." },
  { id: "w4m.customer.detail.mobile", world: "W4", route: "/customer/[id]", artifact: "livia-mobile", persona: ["P4"], job: "Client memory mobile.", visual: "Notes + book again CTA." },
  { id: "w4m.settings.mobile", world: "W4", route: "/settings", artifact: "livia-mobile", persona: ["All"], job: "Shop + notification prefs mobile.", visual: "Grouped list; push toggles." },
  { id: "w4m.clinical-hub.mobile", world: "W4", route: "/clinical-hub", artifact: "livia-mobile", persona: ["P3"], verticals: ["medspa"], job: "Mobile medspa mandates queue.", visual: "Alert stack; consent rows." },
  { id: "w5.public.waitlist.mobile", world: "W5", route: "/b/:slug/waitlist/:token", artifact: "livia-dashboard", persona: ["P7"], verticals: ["fitness"], job: "Accept promoted waitlist spot.", visual: "Class summary; accept/decline; countdown TTL." },
  { id: "w3.support.investigate.web", world: "W3", route: "/support/investigate", artifact: "livia-internal", persona: ["Support L2"], job: "requestId trace lookup.", visual: "Search + Sentry link + ticket matches." },
  { id: "w3.support.board.web", world: "W3", route: "/support/board", artifact: "livia-internal", persona: ["Support"], job: "Kanban alternate I4-B.", visual: "Columns by status; drag cards." },
  { id: "w3.support.radar.web", world: "W3", route: "/support/radar", artifact: "livia-internal", persona: ["Support"], job: "Tenant health radar I4-C.", visual: "Shop cards sorted by risk score." },
  { id: "w3.internal.tenants.web", world: "W3", route: "/tenants", artifact: "livia-internal", persona: ["Ops"], job: "Tenant directory + detail.", visual: "Table; drill-down flags + billing." },
  { id: "w3.internal.flags.web", world: "W3", route: "/flags", artifact: "livia-internal", persona: ["Eng"], job: "Per-tenant feature flags.", visual: "Toggle list per business." },
  { id: "w6.guest.hub.web", world: "W6", route: "/my", artifact: "livia-dashboard", persona: ["P7"], release: "R2", job: "Guest vault — my shops, my bookings.", visual: "Liv Guest soft chrome; shop cards; OTP gate." },
  { id: "w5.public.premises.mobile", world: "W5", route: "/p/:slug", artifact: "livia-dashboard", persona: ["P7"], job: "Multi-premises public landing.", visual: "Location picker; map link; book per premise." },
  { id: "w1.marketing.europe.web", world: "W1", route: "/europe", artifact: "livia-marketing", persona: ["Prospect"], job: "EU expansion story.", visual: "Map + locale packs honest." },
  { id: "w1.marketing.eu-ai.web", world: "W1", route: "/eu-ai", artifact: "livia-marketing", persona: ["Prospect"], job: "AI Act disclosure posture.", visual: "Prose + Liv disclosure examples." },
  { id: "w4.ops.brands.web", world: "W4", route: "/brands", artifact: "livia-dashboard", persona: ["P1","P2"], job: "Multi-brand portfolio shell.", visual: "Brand cards; logo per shell." },
  { id: "w4m.staff.today.mobile", world: "W4", route: "/(tabs)/index", artifact: "livia-mobile", persona: ["P4"], job: "Staff today tab alias home.", visual: "Same ritual as my-day variant." },
  { id: "w4m.ops.more.mobile", world: "W4", route: "/(tabs)/more", artifact: "livia-mobile", persona: ["All"], job: "Overflow nav + settings links.", visual: "Grouped menu list." },
  { id: "w3.internal.knowledge.web", world: "W3", route: "/knowledge", artifact: "livia-internal", persona: ["Support"], job: "Runbooks + registry browser.", visual: "Search runbooks; surfaceId index." },
  { id: "w3.internal.platform.web", world: "W3", route: "/platform", artifact: "livia-internal", persona: ["Eng"], job: "Platform modules overview.", visual: "Module health cards." },
  { id: "w4.ops.toolkit.web", world: "W4", route: "/toolkit", artifact: "livia-dashboard", persona: ["P2"], job: "Owner tools + Liv coach entry.", visual: "Tool grid; mandate display." },
  { id: "w4.ops.launch-status.web", world: "W4", route: "/launch-status", artifact: "livia-dashboard", persona: ["P2"], job: "Go-live checklist for tenant.", visual: "Progress checklist; blockers." },
  { id: "w4m.design-proofs.mobile", world: "W4", route: "/design-proofs", artifact: "livia-mobile", persona: ["P4"], verticals: ["body-art"], job: "Mobile proof queue.", visual: "List → approve flow." },
  { id: "w4m.public.book.mobile", world: "W4", route: "/public-book/[slug]", artifact: "livia-mobile", persona: ["P7"], job: "WebView or native parity for /b.", visual: "Prefer system browser deep link; optional in-app WebView." },
  { id: "w4.ops.franchise.web", world: "W4", route: "/franchise", artifact: "livia-dashboard", persona: ["P1","P2"], job: "Franchise rollup — policies + shop network.", visual: "Network map; franchise KPI strip; drill to shop." },
];

function yaml(entry) {
  const vert = entry.verticals ? `\n  verticals: [${entry.verticals.map((v) => `"${v}"`).join(", ")}]` : "\n  verticals: all";
  const rel = entry.release ? `\n  release: ${entry.release}` : "\n  release: R1";
  return `meta:
  id: ${entry.id}
  world: ${entry.world}
  route: "${entry.route}"
  artifact: ${entry.artifact}
  persona: [${entry.persona.map((p) => (p.startsWith("P") || p === "Prospect" || p === "Owner" || p === "All" ? `"${p}"` : `"${p}"`)).join(", ")}]${vert}${rel}
  status: designed
  tier: P1

job: >
  ${entry.job}

visual:
  summary: >
    ${entry.visual}
  canvas:
    device: ${entry.id.includes(".mobile") ? "phone" : "responsive"}
  zones:
    - id: main
      content: [see VISUAL-SCREEN-MASTER-INVENTORY.md — expand in build]
  typography:
    inherit: world skin — see SKIN-BRAND-INHERITANCE-SPEC
  motion:
    inherit: motion-tokens.md

states:
  loading:
    visual: layout-matched skeleton
  empty:
    copy: persona-appropriate — see EMPTY-ERROR-LOADING-CATALOG.md
  error:
    copy: human retry message

acceptance:
  e2e:
    - see TESTING-VISUAL-ACCEPTANCE.md P1 matrix

traceability:
  figma:
    file: Livia Platform 2026
    frame: ${entry.world}/${entry.id}
    status: not_started
`;
}

mkdirSync(outDir, { recursive: true });
for (const e of P1) {
  writeFileSync(join(outDir, `${e.id}.yaml`), yaml(e), "utf8");
}
console.log(`Wrote ${P1.length} P1 screen cards to ${outDir}`);
