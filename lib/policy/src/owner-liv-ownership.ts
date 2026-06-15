/**
 * Owner vs Liv vs platform — who configures what on the nano-OS.
 * Hub authority for guest care, retail attach, and post-session follow-up.
 */
import type { AftercareMode } from "./guest-care-automation";

export type OwnershipZone = "owner_facts" | "owner_gates" | "liv_judgement" | "platform_knowledge";

export type OwnershipRule = {
  zone: OwnershipZone;
  ownerLabel: string;
  livLabel: string;
};

/** Product law — cite in settings copy and agent prompts. */
export const OWNER_LIV_OWNERSHIP_MATRIX: Record<string, OwnershipRule> = {
  "catalog.treatments": {
    zone: "owner_facts",
    ownerLabel: "Treatment menu — name, duration, price, category",
    livLabel: "Liv uses category for aftercare and rebook cadence",
  },
  "catalog.retail": {
    zone: "owner_facts",
    ownerLabel: "Mini-store SKUs, stock, optional link to a treatment",
    livLabel: "Liv matches SKUs to the visit — never invents products",
  },
  "gate.aftercareEnabled": {
    zone: "owner_gates",
    ownerLabel: "Turn post-session follow-up on or off",
    livLabel: "Liv prepares the message when the gate is on",
  },
  "gate.aftercareMode": {
    zone: "owner_gates",
    ownerLabel: "Auto-send vs draft in inbox vs manual only",
    livLabel: "Liv writes; staff sends only when you chose draft or manual",
  },
  "gate.retailAftercare": {
    zone: "owner_gates",
    ownerLabel: "Allow a quiet product mention in aftercare",
    livLabel: "Liv picks at most one relevant SKU — skips if already bought",
  },
  "gate.retailPostSession": {
    zone: "owner_gates",
    ownerLabel: "Staff pay-link attach on booking detail",
    livLabel: "Liv can include pay links when retail gate + Stripe allow",
  },
  "knowledge.aftercareTips": {
    zone: "platform_knowledge",
    ownerLabel: "Optional per-treatment instructions override",
    livLabel: "Vertical defaults (lash / wax / nail) when no override",
  },
  "judgement.wording": {
    zone: "liv_judgement",
    ownerLabel: "Liv tone preset only",
    livLabel: "Subtle wording, timing, channel, memory-aware nudge",
  },
};

export const AFTERCARE_MODE_OWNER_COPY: Record<
  AftercareMode,
  { label: string; description: string; livRole: string }
> = {
  auto: {
    label: "Liv sends automatically",
    description: "After the delay you set, Liv sends on the guest's preferred channel.",
    livRole: "Liv sends without staff opening inbox.",
  },
  liv_draft: {
    label: "Liv drafts — staff sends",
    description: "Liv writes a treatment-aware draft on the guest thread; your team taps send.",
    livRole: "Recommended for retail mentions and brand-sensitive studios.",
  },
  manual_only: {
    label: "Manual only",
    description: "No automatic message. Staff can still copy pay links from booking detail.",
    livRole: "Liv does not prepare aftercare unless staff asks in inbox.",
  },
};

export const OWNER_LIV_TAGLINE =
  "You run the menu and the shelf. Liv handles what to say, when, and to whom — you control the gates.";
