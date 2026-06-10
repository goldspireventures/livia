import type { PresentationLayoutMorph } from "@workspace/policy";

export function layoutMorphLabel(morph: PresentationLayoutMorph): string {
  switch (morph) {
    case "atrium":
      return "Room swimlanes";
    case "timeline-rail":
      return "Session timeline";
    case "ledger":
      return "Voucher ledger";
    case "constellation":
      return "Constellation";
    case "split-inbox":
      return "Split inbox";
    case "menu-card":
      return "Treatment menu";
    case "cockpit":
      return "Floor cockpit";
    default:
      return "Standard";
  }
}
