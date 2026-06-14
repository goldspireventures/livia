import type { Feather } from "@expo/vector-icons";
import type { PersonaKind } from "@/hooks/usePersona";
import { verticalSupportsRetail } from "@workspace/policy";

export interface MenuItem {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  route: string;
  section?: "primary" | "operations" | "trust" | "demo";
  /** Settings / setup attention — surfaced as row badge in More. */
  badgeKey?: "settings";
}

/** Persona-first menu order — highest ritual items first, flat list (no nesting). */
export function menuItemsForPersona(args: {
  persona: PersonaKind;
  vertical?: string | null;
  tier?: string | null;
  businessCount?: number;
  showPremises: boolean;
  showDayPackages: boolean;
  isDemo: boolean;
  /** Hide Team / rota until solo adds a second practitioner. */
  showWorkforceNav?: boolean;
}): MenuItem[] {
  const {
    persona,
    vertical,
    tier,
    businessCount = 1,
    showPremises,
    showDayPackages,
    isDemo,
    showWorkforceNav = true,
  } = args;
  const items: MenuItem[] = [];
  const isLead = persona === "org_admin" || persona === "owner";
  const isFloorLead = isLead || persona === "manager";

  if (persona === "org_admin" || persona === "owner") {
    items.push({ icon: "grid", label: "Glance · all shops", route: "/(tabs)/shops", section: "primary" });
  }

  items.push(
    { icon: "bell", label: "Notifications", route: "/notifications", section: "primary" },
    { icon: "settings", label: "Settings", route: "/settings", section: "primary", badgeKey: "settings" },
    { icon: "briefcase", label: "Services", route: "/services/", section: "primary" },
  );

  if (showWorkforceNav) {
    items.push({ icon: "users", label: "Staff", route: "/staff/", section: "primary" });
  }

  if (persona === "manager") {
    items.push({ icon: "sun", label: "My chair preview", route: "/(tabs)/my-day", section: "operations" });
  }

  if (showWorkforceNav && isFloorLead) {
    items.push({ icon: "clock", label: "Who's working", route: "/rota", section: "operations" });
  }

  if (persona === "staff" || persona === "manager") {
    items.push({ icon: "calendar", label: "Request leave", route: "/time-off", section: "operations" });
  }

  if (vertical === "medspa" && persona !== "staff" && persona !== "receptionist") {
    items.push({ icon: "activity", label: "Clinical hub", route: "/clinical-hub", section: "operations" });
    items.push({ icon: "check-circle", label: "Booking approvals", route: "/(tabs)/approvals", section: "operations" });
  }

  if (vertical === "body-art" && isFloorLead) {
    items.push({ icon: "image", label: "Design proofs", route: "/design-proofs", section: "operations" });
  }

  if (vertical === "event-vendors" && isFloorLead) {
    items.push(
      { icon: "inbox", label: "Enquiries", route: "/enquiries", section: "operations" },
      { icon: "file-text", label: "Quotes", route: "/quotes", section: "operations" },
      { icon: "globe", label: "Event website", route: "/event-site", section: "operations" },
    );
  }

  if (verticalSupportsRetail(vertical) && isFloorLead) {
    items.push({ icon: "shopping-bag", label: "Take-home shop", route: "/store", section: "operations" });
  }

  if (vertical === "pet-grooming" && isFloorLead) {
    items.push({ icon: "heart", label: "Pet clients", route: "/(tabs)/customers", section: "operations" });
  }

  if (showDayPackages) {
    items.push({ icon: "sun", label: "Day packages", route: "/day-packages", section: "operations" });
  }

  if (showPremises) {
    items.push({ icon: "map-pin", label: "Shared premises", route: "/premises", section: "operations" });
  }

  if (tier === "chair-host" && isLead) {
    items.push({ icon: "home", label: "Host floor", route: "/host", section: "operations" });
  }

  if (tier === "franchise" && isLead) {
    items.push({ icon: "layers", label: "Franchise network", route: "/franchise", section: "operations" });
  }

  if ((tier === "white-label" || tier === "chain") && isLead) {
    items.push({ icon: "layers", label: "Brand portfolio", route: "/brands", section: "operations" });
  }

  if (isFloorLead) {
    items.push({ icon: "cpu", label: "Liv Mandate", route: "/liv-mandate", section: "trust" });
  }

  if (isLead) {
    items.push(
      { icon: "book-open", label: "Lifecycle", route: "/lifecycle", section: "trust" },
      { icon: "file-text", label: "Accountant preview", route: "/accountant-preview", section: "trust" },
    );
  }

  if (isDemo) {
    items.push({ icon: "map", label: "Demo guide", route: "/demo-guide", section: "demo" });
  }

  return items;
}
