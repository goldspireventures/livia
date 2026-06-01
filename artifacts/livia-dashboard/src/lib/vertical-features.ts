import type { BusinessVertical } from "@workspace/policy";
import { getVerticalPlaybook, resolveVerticalKey } from "@workspace/policy";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  CalendarDays,
  Heart,
  Palette,
  PawPrint,
  Sparkles,
  Stethoscope,
  Users,
} from "lucide-react";

export type VerticalHomeModule = {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  testId?: string;
};

const MODULES: Record<string, Omit<VerticalHomeModule, "id">> = {
  "design-proofs": {
    title: "Design proofs",
    description: "Approve art in thread before the session.",
    href: "/design-proofs",
    icon: Palette,
    testId: "home-module-design-proofs",
  },
  "day-packages": {
    title: "Day packages",
    description: "Spa days and bundled treatments.",
    href: "/day-packages",
    icon: CalendarDays,
    testId: "home-module-day-packages",
  },
  "care-programmes": {
    title: "Care programmes",
    description: "Multi-visit plans and clinical pathways.",
    href: "/customers",
    icon: Stethoscope,
    testId: "home-module-care",
  },
  pets: {
    title: "Pet clients",
    description: "Profiles, breeds, and rebook cadence.",
    href: "/customers",
    icon: PawPrint,
    testId: "home-module-pets",
  },
  clinical: {
    title: "Clinical queue",
    description: "Consent-led bookings and treatment plans.",
    href: "/bookings",
    icon: Activity,
    testId: "home-module-clinical",
  },
  team: {
    title: "Team & invite",
    description: "Grow by email invite — not a job board.",
    href: "/staff",
    icon: Users,
    testId: "home-module-team",
  },
  liv: {
    title: "Tune Liv",
    description: "Tone, tools, and what Liv may book automatically.",
    href: "/settings?tab=liv",
    icon: Sparkles,
    testId: "home-module-liv",
  },
};

const PLAYBOOK_MODULE_ALIAS: Record<string, string> = {
  timeline: "liv",
  proposals: "liv",
  "running-late": "liv",
  packages: "day-packages",
  classes: "team",
  "medspa-hub": "clinical",
  inbox: "liv",
  pets: "pets",
};

/** Ordered home shortcuts — driven by `vertical-playbooks` in policy. */
export function verticalHomeModules(
  vertical?: string | null,
  category?: string | null,
): VerticalHomeModule[] {
  const key = resolveVerticalKey(vertical, category);
  const playbook = getVerticalPlaybook(key);
  const ids = [
    ...new Set([
      ...playbook.homeModules
        .map((id) => PLAYBOOK_MODULE_ALIAS[id] ?? id)
        .filter((id) => MODULES[id]),
      "team",
      "liv",
    ]),
  ];
  return ids.map((id) => ({
    id,
    ...MODULES[id],
  }));
}

/** Tool ids recommended per vertical (Settings → Liv catalog). */
export const VERTICAL_LIV_TOOL_HINTS: Record<BusinessVertical, string[]> = {
  hair: ["find_slots", "create_booking", "send_message", "morning_briefing"],
  beauty: ["find_slots", "create_booking", "send_message", "morning_briefing"],
  "body-art": [
    "find_slots",
    "create_booking",
    "send_message",
    "list_stuck_continuity",
    "list_drift_candidates",
    "draft_drift_recovery",
  ],
  wellness: ["find_slots", "create_booking", "send_message", "morning_briefing"],
  fitness: ["find_slots", "create_booking", "send_message", "morning_briefing"],
  medspa: ["find_slots", "create_booking", "confirm_booking", "send_message"],
  "allied-health": ["find_slots", "create_booking", "reschedule_booking", "lookup_customer"],
  "pet-grooming": ["find_slots", "create_booking", "send_message", "lookup_customer"],
  "automotive-detailing": ["find_slots", "create_booking", "send_message"],
};

export function livToolHintsForVertical(
  vertical?: string | null,
  category?: string | null,
): string[] {
  const key = resolveVerticalKey(vertical, category);
  return VERTICAL_LIV_TOOL_HINTS[key];
}
