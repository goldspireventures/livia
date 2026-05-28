import type { Feather } from "@expo/vector-icons";
import type { PersonaKind } from "@/hooks/usePersona";

export interface MenuItem {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  route: string;
  section?: "primary" | "operations" | "trust" | "demo";
}

/** Persona-first menu order — highest ritual items first. */
export function menuItemsForPersona(args: {
  persona: PersonaKind;
  vertical?: string | null;
  tier?: string | null;
  businessCount?: number;
  showPremises: boolean;
  showDayPackages: boolean;
  isDemo: boolean;
}): MenuItem[] {
  const { persona, vertical, tier, businessCount = 1, showPremises, showDayPackages, isDemo } = args;
  const items: MenuItem[] = [];

  if (isDemo) {
    items.push({ icon: "map", label: "Demo guide", route: "/demo-guide", section: "demo" });
  }

  if (persona === "org_admin" || persona === "owner") {
    items.push({ icon: "grid", label: "Glance · all shops", route: "/(tabs)/shops", section: "primary" });
  }

  if (persona === "org_admin" || persona === "owner" || persona === "manager") {
    items.push({ icon: "clock", label: "Who's working", route: "/rota", section: "operations" });
  }

  if (persona === "manager") {
    items.push({ icon: "sun", label: "My chair preview", route: "/(tabs)/my-day", section: "operations" });
  }

  if (persona === "staff" || persona === "manager") {
    items.push({ icon: "calendar", label: "Request leave", route: "/time-off", section: "operations" });
  }

  if (vertical === "medspa" && persona !== "staff" && persona !== "receptionist") {
    items.push({ icon: "activity", label: "Clinical hub", route: "/clinical-hub", section: "operations" });
    items.push({ icon: "check-circle", label: "Booking approvals", route: "/(tabs)/approvals", section: "operations" });
  }

  if (vertical === "body-art" && (persona === "org_admin" || persona === "owner" || persona === "manager")) {
    items.push({ icon: "image", label: "Design proofs", route: "/design-proofs", section: "operations" });
  }

  if (vertical === "pet-grooming" && (persona === "org_admin" || persona === "owner" || persona === "manager")) {
    items.push({ icon: "heart", label: "Pet clients", route: "/(tabs)/customers", section: "operations" });
  }

  if (tier === "chair-host" && (persona === "org_admin" || persona === "owner")) {
    items.push({ icon: "home", label: "Host floor", route: "/host", section: "operations" });
  }

  if (tier === "franchise" && (persona === "org_admin" || persona === "owner")) {
    items.push({ icon: "layers", label: "Franchise network", route: "/franchise", section: "operations" });
  }

  if (persona === "org_admin" || persona === "owner") {
    items.push({ icon: "file-text", label: "Accountant preview", route: "/accountant-preview", section: "trust" });
  }

  if ((tier === "white-label" || tier === "chain") && (persona === "org_admin" || persona === "owner")) {
    items.push({ icon: "layers", label: "Brand portfolio", route: "/brands", section: "operations" });
  }

  if (showPremises) {
    items.push({ icon: "map-pin", label: "Shared premises", route: "/premises", section: "operations" });
  }

  if (showDayPackages) {
    items.push({ icon: "sun", label: "Day packages", route: "/day-packages", section: "operations" });
  }

  items.push(
    { icon: "bell", label: "Notifications", route: "/notifications", section: "primary" },
    { icon: "settings", label: "Settings", route: "/settings", section: "primary" },
    { icon: "users", label: "Staff", route: "/staff/", section: "primary" },
    { icon: "briefcase", label: "Services", route: "/services/", section: "primary" },
  );

  if (persona === "org_admin" || persona === "owner" || persona === "manager") {
    items.push({ icon: "cpu", label: "Liv Mandate", route: "/liv-mandate", section: "trust" });
  }

  if (persona === "org_admin" || persona === "owner") {
    items.push({ icon: "book-open", label: "Lifecycle", route: "/lifecycle", section: "trust" });
  }

  return items;
}
