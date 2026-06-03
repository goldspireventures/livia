/** Document titles + descriptions for marketing routes (a11y + SEO). */
export const MARKETING_ROUTE_META: Record<
  string,
  { title: string; description?: string }
> = {
  "/": {
    title: "Livia — one OS for every people-business",
    description: "Same physics. Different floor. Liv runs the gap.",
  },
  "/de": {
    title: "Livia — ein OS für jedes People-Business",
  },
  "/pricing": {
    title: "Pricing — Livia",
    description: "Honest EUR tiers from the entitlements catalogue. Closed beta is free.",
  },
  "/book-demo": {
    title: "Book a demo — Livia",
    description: "Request a guided walkthrough of the live demo world for your vertical.",
  },
  "/demo": {
    title: "Live demo — Livia",
    description: "Invited guests — pick a vertical and walk a seeded business.",
  },
  "/how-it-works": { title: "How it works — Livia" },
  "/verticals": { title: "Verticals — Livia" },
  "/europe": { title: "Europe — Livia" },
  "/eu-ai": { title: "EU AI Act — Livia" },
  "/for/chair-rental": { title: "Chair rental hosts — Livia" },
  "/contact": { title: "Contact — Livia" },
  "/changelog": { title: "Changelog — Livia" },
  "/status": { title: "System status — Livia" },
};

export function metaForPath(pathname: string) {
  const path = pathname.split("#")[0]?.split("?")[0] ?? "/";
  if (MARKETING_ROUTE_META[path]) return MARKETING_ROUTE_META[path];
  if (path.startsWith("/verticals/")) {
    const slug = path.slice("/verticals/".length);
    const label = slug.replace(/-/g, " ");
    return { title: `${label} — Livia vertical` };
  }
  if (path.startsWith("/legal/")) return { title: "Legal — Livia" };
  return { title: "Livia" };
}
