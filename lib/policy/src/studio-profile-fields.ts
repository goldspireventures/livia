import type { BusinessVertical } from "./types";
import { resolveVerticalKey } from "./vocabulary";

/** Settings → Studio profile inputs — vary by vertical (prod expectation). */
export type StudioProfileFieldId =
  | "name"
  | "slug"
  | "description"
  | "logoUrl"
  | "phone"
  | "instagramHandle"
  | "city"
  | "country"
  | "timezone";

export type StudioProfileFieldDef = {
  id: StudioProfileFieldId;
  label: string;
  placeholder?: string;
  hint?: string;
  required?: boolean;
  section: "primary" | "contact";
};

const FIELD: Record<StudioProfileFieldId, Omit<StudioProfileFieldDef, "id">> = {
  name: { label: "Business name", required: true, section: "primary" },
  slug: {
    label: "Booking link slug",
    hint: "Your guest book URL: {slug}.livia-hq.com (or /book/{slug} in dev)",
    required: true,
    section: "primary",
  },
  description: { label: "Short description", section: "primary" },
  logoUrl: {
    label: "Logo image URL",
    placeholder: "https://…",
    hint: "HTTPS image shown on your public booking page.",
    section: "primary",
  },
  phone: { label: "Phone", section: "contact" },
  instagramHandle: {
    label: "Instagram",
    placeholder: "@handle",
    section: "contact",
  },
  city: { label: "City", section: "contact" },
  country: { label: "Country", section: "contact" },
  timezone: { label: "Timezone", section: "contact" },
};

const VERTICAL_ORDER: Record<BusinessVertical, StudioProfileFieldId[]> = {
  hair: [
    "name",
    "slug",
    "description",
    "logoUrl",
    "phone",
    "instagramHandle",
    "city",
    "country",
    "timezone",
  ],
  beauty: [
    "name",
    "slug",
    "description",
    "logoUrl",
    "phone",
    "instagramHandle",
    "city",
    "country",
    "timezone",
  ],
  "body-art": [
    "name",
    "slug",
    "description",
    "logoUrl",
    "phone",
    "instagramHandle",
    "city",
    "country",
    "timezone",
  ],
  wellness: ["name", "slug", "description", "logoUrl", "phone", "city", "country", "timezone"],
  fitness: ["name", "slug", "description", "logoUrl", "phone", "city", "country", "timezone"],
  medspa: ["name", "slug", "description", "logoUrl", "phone", "city", "country", "timezone"],
  "allied-health": ["name", "slug", "description", "logoUrl", "phone", "city", "country", "timezone"],
  "pet-grooming": [
    "name",
    "slug",
    "description",
    "logoUrl",
    "phone",
    "instagramHandle",
    "city",
    "country",
    "timezone",
  ],
  "automotive-detailing": [
    "name",
    "slug",
    "description",
    "logoUrl",
    "phone",
    "city",
    "country",
    "timezone",
  ],
  "event-vendors": [
    "name",
    "slug",
    "description",
    "logoUrl",
    "phone",
    "instagramHandle",
    "city",
    "country",
    "timezone",
  ],
};

const VERTICAL_OVERRIDES: Partial<
  Record<BusinessVertical, Partial<Record<StudioProfileFieldId, Partial<StudioProfileFieldDef>>>>
> = {
  hair: {
    description: {
      label: "Tagline",
      placeholder: "e.g. Colour specialists on Camden Street",
    },
    logoUrl: { label: "Shop logo URL" },
  },
  beauty: {
    description: {
      label: "Studio tagline",
      placeholder: "e.g. Lashes, nails, and brows — South King Street",
    },
    logoUrl: { label: "Studio logo URL" },
  },
  "body-art": {
    description: {
      label: "Studio intro",
      placeholder: "Styles, walk-in policy, deposit notes…",
    },
    instagramHandle: { label: "Instagram / portfolio" },
  },
  wellness: {
    description: {
      label: "Studio intro",
      placeholder: "Modalities, cancellation tone, what guests should know…",
    },
    instagramHandle: { label: "Social handle (optional)" },
  },
  fitness: {
    description: {
      label: "Studio intro",
      placeholder: "Classes, coaching, what members should know…",
    },
    name: { label: "Gym / studio name" },
  },
  medspa: {
    description: {
      label: "Clinic intro",
      placeholder: "Treatments offered, consultation expectations…",
    },
    name: { label: "Clinic name" },
    logoUrl: { label: "Clinic logo URL" },
  },
  "allied-health": {
    description: {
      label: "Practice intro",
      placeholder: "Specialisms, referral notes, patient expectations…",
    },
    name: { label: "Practice name" },
    phone: { label: "Reception phone" },
  },
  "pet-grooming": {
    description: {
      label: "Salon intro",
      placeholder: "Breeds, services, pickup policy…",
    },
    name: { label: "Salon name" },
    logoUrl: { label: "Salon logo URL" },
  },
  "automotive-detailing": {
    description: {
      label: "Studio intro",
      placeholder: "Services, bay hours, vehicle notes you need upfront…",
    },
    logoUrl: { label: "Brand logo URL" },
  },
  "event-vendors": {
    description: {
      label: "Studio tagline",
      placeholder: "Event styling, balloons, weddings — what you specialise in…",
    },
    instagramHandle: { label: "Instagram handle" },
    logoUrl: { label: "Logo URL" },
  },
};

export function studioProfileFieldsForVertical(
  vertical?: string | null,
  category?: string | null,
): StudioProfileFieldDef[] {
  const key = resolveVerticalKey(vertical, category);
  const order = VERTICAL_ORDER[key];
  const overrides = VERTICAL_OVERRIDES[key] ?? {};
  return order.map((id) => ({
    id,
    ...FIELD[id],
    ...overrides[id],
  }));
}
