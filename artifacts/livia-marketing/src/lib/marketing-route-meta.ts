/** Document titles + descriptions for marketing routes (a11y + SEO). */
export const MARKETING_ROUTE_META: Record<
  string,
  { title: string; description?: string }
> = {
  "/": {
    title: "Livia — one platform built for how you work",
    description: "Software for appointment businesses. Liv handles messages and bookings after hours.",
  },
  "/de": {
    title: "Livia — ein OS für jedes People-Business",
  },
  "/pricing": {
    title: "Pricing — Livia",
    description: "Clear EUR pricing. Closed beta is free.",
  },
  "/book-demo": {
    title: "Get started — Livia",
    description: "Create your account and set up your shop on Livia.",
  },
  "/get-started": {
    title: "Get started — Livia",
    description: "Create your account and set up your shop on Livia.",
  },
  "/demo": {
    title: "Live demo — Livia",
    description: "Invited guests — pick your trade and walk through a ready-made demo business.",
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
