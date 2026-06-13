/**
 * Capability-gated dashboard routes — Era 1 Q3 dynamic nav seed.
 * @see docs/engineering/CAPABILITY-GRAPH-SPEC.md
 */

export type CapabilityNavState = {
  id: string;
  state: "defined" | "installed" | "configured" | "active" | "suspended";
};

/** Routes that require a platform capability to be at least installed. */
export const NAV_ROUTE_CAPABILITY_REQUIREMENTS: Record<string, string> = {
  "/inbox": "messaging",
  "/day-packages": "memberships",
  "/customers": "bookings",
  "/services": "bookings",
  "/staff": "bookings",
  "/bookings": "bookings",
  "/toolkit": "messaging",
  "/my-livia": "messaging",
};

/** Consult-first verticals use different capability keys for shared hrefs. */
export const NAV_ROUTE_CAPABILITY_BY_VERTICAL: Record<
  string,
  Record<string, string>
> = {
  "event-vendors": {
    "/services": "deposits",
    "/customers": "deposits",
  },
};

/** Settings sub-areas surfaced when commerce capabilities need attention. */
export const NAV_COMMERCE_SETUP_HREFS = ["/settings", "/toolkit"] as const;

/**
 * Wellness depth routes gated on vertical capability maturity (hide until ready).
 * @see vertical-announcement.ts deferred vs ready capabilities
 */
export const WELLNESS_ROUTE_VERTICAL_CAPABILITIES: Record<string, string> = {
  "/wellness-reports": "wellness-reports",
  "/wellness-reception": "wellness-reception",
  "/wellness-guest-vault": "guest-wallet-credits",
  "/wellness-retail": "gift-public-book",
  "/wellness-audit-diary": "voucher-ledger-today",
};

export function isWellnessNavHrefAllowed(
  href: string,
  readyVerticalCapabilityIds: Set<string>,
): boolean {
  const capId = WELLNESS_ROUTE_VERTICAL_CAPABILITIES[href];
  if (!capId) return true;
  return readyVerticalCapabilityIds.has(capId);
}

export function filterWellnessNavItems<T extends { href: string }>(
  items: T[],
  readyVerticalCapabilityIds: Set<string> | null | undefined,
): T[] {
  if (!readyVerticalCapabilityIds?.size) {
    return items.filter(
      (item) => WELLNESS_ROUTE_VERTICAL_CAPABILITIES[item.href] === undefined,
    );
  }
  return items.filter((item) =>
    isWellnessNavHrefAllowed(item.href, readyVerticalCapabilityIds),
  );
}

export function isCapabilityAtLeastInstalled(
  capabilityId: string,
  capabilities: CapabilityNavState[],
): boolean {
  const cap = capabilities.find((c) => c.id === capabilityId);
  if (!cap) return false;
  return cap.state !== "defined";
}

export function resolveNavRouteCapabilityId(
  href: string,
  vertical?: string | null,
): string | undefined {
  const v = (vertical ?? "").toLowerCase();
  const verticalCap = v ? NAV_ROUTE_CAPABILITY_BY_VERTICAL[v]?.[href] : undefined;
  return verticalCap ?? NAV_ROUTE_CAPABILITY_REQUIREMENTS[href];
}

export function isNavRouteAllowedByCapabilities(
  href: string,
  capabilities: CapabilityNavState[],
  vertical?: string | null,
): boolean {
  const required = resolveNavRouteCapabilityId(href, vertical);
  if (!required) return true;
  return isCapabilityAtLeastInstalled(required, capabilities);
}

/** Mobile More menu routes → platform capability id (expo-router paths). */
export const MOBILE_MENU_ROUTE_CAPABILITY: Record<string, string> = {
  "/staff/": "bookings",
  "/services/": "bookings",
  "/day-packages": "memberships",
  "/liv-mandate": "messaging",
  "/(tabs)/customers": "bookings",
  "/rota": "bookings",
};

export function isMobileMenuRouteAllowedByCapabilities(
  route: string,
  capabilities: CapabilityNavState[],
): boolean {
  const required = MOBILE_MENU_ROUTE_CAPABILITY[route];
  if (!required) return true;
  return isCapabilityAtLeastInstalled(required, capabilities);
}

export function filterMobileMenuItems<T extends { route: string }>(
  items: T[],
  capabilities: CapabilityNavState[] | null | undefined,
): T[] {
  if (!capabilities?.length) return items;
  return items.filter((item) =>
    isMobileMenuRouteAllowedByCapabilities(item.route, capabilities),
  );
}

export function filterNavItemsByCapabilities<T extends { href: string }>(
  items: T[],
  capabilities: CapabilityNavState[] | null | undefined,
  vertical?: string | null,
): T[] {
  if (!capabilities?.length) return items;
  return items.filter((item) =>
    isNavRouteAllowedByCapabilities(item.href, capabilities, vertical),
  );
}
