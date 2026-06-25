import {
  liviaSlugFromBookingUrl,
  resolveBookingMirrorCapability,
  type LiviaMigrationEntityBundle,
  LIVIA_MIGRATION_TEMPLATE_VERSION,
} from "@workspace/policy";
import { getBusinessBySlug } from "./businesses.service";
import { listServices } from "./services.service";

export type BookingUrlMirrorResult = {
  ok: boolean;
  message: string;
  capability: ReturnType<typeof resolveBookingMirrorCapability>;
  bundle: LiviaMigrationEntityBundle;
  rowCount: number;
};

/** Best-effort public page mirror — never claims client/appointment depth. */
export async function mirrorBookingUrlToBundle(
  bookingUrl: string,
): Promise<BookingUrlMirrorResult> {
  const capability = resolveBookingMirrorCapability(bookingUrl);
  const emptyBundle: LiviaMigrationEntityBundle = {
    version: LIVIA_MIGRATION_TEMPLATE_VERSION,
    exportedAt: new Date().toISOString(),
  };

  if (!capability.services) {
    return {
      ok: false,
      message: capability.honestLimit,
      capability,
      bundle: emptyBundle,
      rowCount: 0,
    };
  }

  if (capability.platform === "livia") {
    const slug = liviaSlugFromBookingUrl(bookingUrl);
    if (!slug) {
      return {
        ok: false,
        message: "Could not read Livia book slug from URL.",
        capability,
        bundle: emptyBundle,
        rowCount: 0,
      };
    }
    const biz = await getBusinessBySlug(slug);
    if (!biz) {
      return {
        ok: false,
        message: "Livia book page not found for that slug.",
        capability,
        bundle: emptyBundle,
        rowCount: 0,
      };
    }
    const menu = await listServices(biz.id);
    const services = menu
      .filter((s) => s.isActive !== false)
      .map((s) => ({
        externalId: s.id,
        name: s.name,
        durationMinutes: s.durationMinutes ?? 60,
        priceMinor: s.priceMinor ?? 0,
      }));
    const bundle: LiviaMigrationEntityBundle = {
      ...emptyBundle,
      externalBusinessId: biz.id,
      services,
    };
    return {
      ok: services.length > 0,
      message:
        services.length > 0
          ? `Mirrored ${services.length} service(s) from Livia book page.`
          : "Livia book page has no published services yet.",
      capability,
      bundle,
      rowCount: services.length,
    };
  }

  let host = "";
  try {
    host = new URL(bookingUrl).hostname;
  } catch {
    return {
      ok: false,
      message: "Invalid booking URL.",
      capability,
      bundle: emptyBundle,
      rowCount: 0,
    };
  }

  const res = await fetch(bookingUrl, {
    headers: {
      "User-Agent": "LiviaMigrationMirror/1.0",
      Accept: "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(12_000),
  });

  if (!res.ok) {
    return {
      ok: false,
      message: `Could not fetch booking page (${res.status}). ${capability.honestLimit}`,
      capability,
      bundle: emptyBundle,
      rowCount: 0,
    };
  }

  const html = await res.text();
  const names = extractServiceNamesFromHtml(html, host);
  const services = names.map((name, i) => ({
    externalId: `mirror-${i}`,
    name,
    durationMinutes: 60,
  }));

  const bundle: LiviaMigrationEntityBundle = {
    ...emptyBundle,
    services,
  };

  return {
    ok: services.length > 0,
    message:
      services.length > 0
        ? `Mirrored ${services.length} service name(s) from public page. ${capability.honestLimit}`
        : `No service names detected on page. ${capability.honestLimit}`,
    capability,
    bundle,
    rowCount: services.length,
  };
}

function extractServiceNamesFromHtml(html: string, host: string): string[] {
  const names = new Set<string>();

  const jsonLdMatches = html.matchAll(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  );
  for (const m of jsonLdMatches) {
    try {
      const data = JSON.parse(m[1]!);
      collectOfferNames(data, names);
    } catch {
      /* ignore */
    }
  }

  if (host.includes("fresha.com")) {
    for (const m of html.matchAll(/"name"\s*:\s*"([^"]{2,80})"/g)) {
      const n = m[1]!.trim();
      if (!looksLikeNoise(n)) names.add(n);
    }
  }

  if (host.includes("booksy")) {
    for (const m of html.matchAll(/data-service-name=["']([^"']+)["']/gi)) {
      names.add(m[1]!.trim());
    }
  }

  for (const m of html.matchAll(/<h[23][^>]*>([^<]{3,80})<\/h[23]>/gi)) {
    const n = decodeHtml(m[1]!.trim());
    if (!looksLikeNoise(n)) names.add(n);
  }

  return [...names].slice(0, 80);
}

function collectOfferNames(node: unknown, names: Set<string>): void {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (const item of node) collectOfferNames(item, names);
    return;
  }
  const obj = node as Record<string, unknown>;
  if (typeof obj.name === "string" && (obj["@type"] === "Service" || obj["@type"] === "Product")) {
    const n = obj.name.trim();
    if (!looksLikeNoise(n)) names.add(n);
  }
  for (const v of Object.values(obj)) collectOfferNames(v, names);
}

function looksLikeNoise(name: string): boolean {
  const lower = name.toLowerCase();
  return (
    lower.length < 3 ||
    lower.includes("cookie") ||
    lower.includes("sign in") ||
    lower.includes("log in") ||
    lower === "home"
  );
}

function decodeHtml(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"');
}
