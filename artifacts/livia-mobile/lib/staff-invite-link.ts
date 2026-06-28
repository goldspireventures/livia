import * as Linking from "expo-linking";

function ticketFromUrl(url: string | null): string | null {
  if (!url) return null;
  const parsed = Linking.parse(url);
  const ticket =
    (typeof parsed.queryParams?.__clerk_ticket === "string" && parsed.queryParams.__clerk_ticket) ||
    (typeof parsed.queryParams?.ticket === "string" && parsed.queryParams.ticket) ||
    null;
  return ticket || null;
}

/** Clerk invitation ticket from deep link (`__clerk_ticket` or `ticket` query param). */
export async function parseStaffInviteTicket(routeTicket?: string | null): Promise<string | null> {
  if (routeTicket?.trim()) return routeTicket.trim();
  const initial = ticketFromUrl(await Linking.getInitialURL());
  if (initial) return initial;
  return ticketFromUrl(Linking.getLinkingURL());
}
