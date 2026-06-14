/**
 * Guest retail fulfillment — how take-home orders reach the client.
 * Policy hub for /b bag checkout + combined booking+retail flows.
 */
import type { BusinessVertical } from "./types";
import { resolveVerticalKey } from "./vocabulary";

export type GuestRetailFulfillmentMode =
  | "collect_in_store"
  | "at_appointment"
  | "ship";

export type GuestRetailFulfillmentOption = {
  mode: GuestRetailFulfillmentMode;
  label: string;
  description: string;
  requiresAddress: boolean;
};

const COLLECT: GuestRetailFulfillmentOption = {
  mode: "collect_in_store",
  label: "Collect in store",
  description: "Pick up during opening hours — we'll hold your bag.",
  requiresAddress: false,
};

const AT_VISIT: GuestRetailFulfillmentOption = {
  mode: "at_appointment",
  label: "Bring to my visit",
  description: "We'll have your items ready when you arrive for your appointment.",
  requiresAddress: false,
};

const SHIP: GuestRetailFulfillmentOption = {
  mode: "ship",
  label: "Ship to me",
  description: "We'll post your order — add your delivery address at checkout.",
  requiresAddress: true,
};

/** Verticals where clients typically book visits before retail attach. */
const VISIT_VERTICALS = new Set<BusinessVertical>([
  "hair",
  "beauty",
  "wellness",
  "medspa",
  "body-art",
  "pet-grooming",
  "fitness",
  "allied-health",
]);

export function guestRetailFulfillmentOptions(args: {
  vertical?: string | null;
  category?: string | null;
  /** Guest has a booking in this session or linked booking id on the order. */
  hasLinkedBooking?: boolean;
}): readonly GuestRetailFulfillmentOption[] {
  const key = resolveVerticalKey(args.vertical, args.category);
  const visitVertical = VISIT_VERTICALS.has(key);
  const opts: GuestRetailFulfillmentOption[] = [COLLECT];

  if (visitVertical && args.hasLinkedBooking) {
    opts.push(AT_VISIT);
  }

  opts.push(SHIP);
  return opts;
}

export function guestRetailFulfillmentLabel(mode: GuestRetailFulfillmentMode): string {
  switch (mode) {
    case "collect_in_store":
      return COLLECT.label;
    case "at_appointment":
      return AT_VISIT.label;
    case "ship":
      return SHIP.label;
  }
}

export function normalizeGuestRetailFulfillmentMode(
  raw: unknown,
  allowed: readonly GuestRetailFulfillmentOption[],
): GuestRetailFulfillmentMode {
  const modes = new Set(allowed.map((o) => o.mode));
  const mode = String(raw ?? "").trim() as GuestRetailFulfillmentMode;
  if (modes.has(mode)) return mode;
  return allowed[0]?.mode ?? "collect_in_store";
}

export function guestRetailFulfillmentDetailHint(mode: GuestRetailFulfillmentMode): string {
  switch (mode) {
    case "ship":
      return "Full name, street, city, postcode";
    case "at_appointment":
      return "Optional note for the team (e.g. leave at reception)";
    case "collect_in_store":
      return "Optional note (e.g. preferred pickup day)";
  }
}
