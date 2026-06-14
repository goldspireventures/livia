/**
 * Quick-add treatment templates for beauty onboarding and /services.
 */
import type { BeautyServiceKind } from "./beauty-booking-rules";

export type BeautyServiceTemplate = {
  name: string;
  category: string;
  durationMinutes: number;
  priceMinor: number;
  description?: string;
  serviceKind?: BeautyServiceKind;
  rebookIntervalDays?: number;
  requiresPatchTest?: boolean;
};

export const BEAUTY_SERVICE_CATEGORIES = [
  "Lashes",
  "Nails",
  "Brows",
  "Wax",
  "Facial",
  "Other",
] as const;

export const BEAUTY_SERVICE_TEMPLATES: BeautyServiceTemplate[] = [
  {
    name: "Lash fill",
    category: "Lashes",
    durationMinutes: 60,
    priceMinor: 5500,
    description: "Maintenance fill — 2–3 week cycle.",
    serviceKind: "fill",
    rebookIntervalDays: 14,
    requiresPatchTest: true,
  },
  {
    name: "Classic lash full set",
    category: "Lashes",
    durationMinutes: 120,
    priceMinor: 8500,
    description: "New set — allow time for consultation.",
    serviceKind: "full_set",
    rebookIntervalDays: 21,
    requiresPatchTest: true,
  },
  {
    name: "Gel manicure",
    category: "Nails",
    durationMinutes: 45,
    priceMinor: 3500,
    serviceKind: "maintenance",
    rebookIntervalDays: 21,
  },
  {
    name: "Classic manicure",
    category: "Nails",
    durationMinutes: 45,
    priceMinor: 3000,
    serviceKind: "other",
  },
  {
    name: "Gel mani + pedi combo",
    category: "Nails",
    durationMinutes: 120,
    priceMinor: 6500,
    description: "One appointment — gel manicure and pedicure together.",
    serviceKind: "maintenance",
    rebookIntervalDays: 21,
  },
  {
    name: "Brow shape & tint",
    category: "Brows",
    durationMinutes: 30,
    priceMinor: 2500,
    serviceKind: "maintenance",
    rebookIntervalDays: 28,
    requiresPatchTest: true,
  },
  {
    name: "Brow lamination",
    category: "Brows",
    durationMinutes: 60,
    priceMinor: 4500,
    serviceKind: "full_set",
    requiresPatchTest: true,
  },
  {
    name: "Patch test",
    category: "Lashes",
    durationMinutes: 15,
    priceMinor: 0,
    description: "Required 24–48h before first lash or tint service.",
    serviceKind: "patch_test",
    requiresPatchTest: false,
  },
];

/** Studio setup checklist steps for onboarding hub. */
export const BEAUTY_STUDIO_SETUP_STEPS = [
  { id: "menu", label: "Build your menu", href: "/services", minServices: 3 },
  { id: "store", label: "Set up mini store", href: "/store" },
  { id: "patch", label: "Patch-test policy", href: "/studio-setup#patch-test" },
  { id: "appearance", label: "Brand your book page", href: "/settings?tab=appearance" },
  { id: "liv", label: "Connect Liv channels", href: "/settings?tab=liv" },
  { id: "test-book", label: "Send yourself a test book link", href: "/settings?tab=appearance" },
] as const;
