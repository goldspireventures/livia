/** Resolve Liv moment / web href targets to mobile deep links. */

export function mobileRouteFromLivHref(href: string | null): string | null {
  if (!href) return null;

  const bookingMatch = href.match(/\/bookings\/([a-f0-9-]+)/i);
  if (bookingMatch?.[1]) return `/booking/${bookingMatch[1]}`;

  const convMatch = href.match(/conversationId=([a-f0-9-]+)/i);
  if (convMatch?.[1]) return `/conversation/${convMatch[1]}`;

  if (href.includes("inbox") || href.includes("conversations")) {
    const idMatch = href.match(/\/conversations\/([a-f0-9-]+)/i);
    if (idMatch?.[1]) return `/conversation/${idMatch[1]}`;
    return "/(tabs)/inbox";
  }

  if (href.includes("approvals") || href.includes("pending")) return "/(tabs)/approvals";
  if (href.includes("chain") || href.includes("glance")) return "/(tabs)/shops";
  if (href.includes("my-day")) return "/(tabs)/my-day";

  return null;
}
