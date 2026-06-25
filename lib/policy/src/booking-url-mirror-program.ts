/**
 * Public booking-page mirror — which hosts we can parse for service menu hints.
 * Honest: most platforms block full client export from public pages.
 */

export type BookingMirrorPlatform =
  | "livia"
  | "fresha"
  | "booksy"
  | "square"
  | "generic";

export type BookingMirrorCapability = {
  platform: BookingMirrorPlatform;
  /** Service names from public page */
  services: boolean;
  /** Client PII from public page — always false for ethics/API reality */
  clients: boolean;
  appointments: boolean;
  honestLimit: string;
};

const GENERIC_LIMIT =
  "We can only read a public booking page. Clients and appointments need an export or connect.";

export function resolveBookingMirrorCapability(url: string): BookingMirrorCapability {
  let host = "";
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return {
      platform: "generic",
      services: false,
      clients: false,
      appointments: false,
      honestLimit: "Invalid URL.",
    };
  }

  if (host.includes("livia") || host.includes("localhost") || host.includes("127.0.0.1")) {
    return {
      platform: "livia",
      services: true,
      clients: false,
      appointments: false,
      honestLimit: "Livia book pages expose the live service menu only.",
    };
  }

  if (host.includes("fresha.com")) {
    return {
      platform: "fresha",
      services: true,
      clients: false,
      appointments: false,
      honestLimit:
        "Fresha public pages may expose service names. Clients need partner connect or CSV.",
    };
  }

  if (host.includes("booksy.com") || host.includes("booksy.net")) {
    return {
      platform: "booksy",
      services: true,
      clients: false,
      appointments: false,
      honestLimit:
        "Booksy public menu can be mirrored. Client list requires support CSV — no connect API.",
    };
  }

  if (host.includes("square.site") || host.includes("squareup.com")) {
    return {
      platform: "square",
      services: true,
      clients: false,
      appointments: false,
      honestLimit: "Use Square connect for full data. Public page gives menu hints only.",
    };
  }

  return {
    platform: "generic",
    services: true,
    clients: false,
    appointments: false,
    honestLimit: GENERIC_LIMIT,
  };
}

/** Extract Livia slug from /book/{slug} or /b/{slug} paths */
export function liviaSlugFromBookingUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean);
    const bookIdx = parts.indexOf("book");
    if (bookIdx >= 0 && parts[bookIdx + 1]) return parts[bookIdx + 1]!;
    const bIdx = parts.indexOf("b");
    if (bIdx >= 0 && parts[bIdx + 1]) return parts[bIdx + 1]!;
    return null;
  } catch {
    return null;
  }
}
