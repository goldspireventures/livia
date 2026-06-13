import type { BusinessVertical } from "./types";

export interface BookingGuardField {
  id: string;
  label: string;
  type: "text" | "select" | "boolean";
  required?: boolean;
  options?: { value: string; label: string }[];
  helpText?: string;
}

const HAIR_GUARDS: BookingGuardField[] = [
  {
    id: "first_colour_visit",
    label: "First time for colour with us?",
    type: "select",
    required: false,
    options: [
      { value: "yes", label: "Yes — first colour visit" },
      { value: "no", label: "No — returning client" },
    ],
    helpText: "Helps us allow enough time and patch-test where required.",
  },
  {
    id: "inspiration_note",
    label: "Style reference (optional)",
    type: "text",
    helpText: "You can also send photos in the text thread after booking.",
  },
  {
    id: "service_duration_ok",
    label: "Does the time slot feel long enough for what you want?",
    type: "select",
    required: true,
    options: [
      { value: "yes", label: "Yes — slot length looks right" },
      { value: "unsure", label: "Not sure — please advise" },
      { value: "no", label: "Probably need longer" },
    ],
    helpText: "Helps avoid double-booking short slots for big colour work (Scenario 06).",
  },
];

const PET_GUARDS: BookingGuardField[] = [
  {
    id: "pet_name",
    label: "Pet's name",
    type: "text",
    required: true,
  },
  {
    id: "pet_breed",
    label: "Breed (optional)",
    type: "text",
  },
  {
    id: "behaviour_notes",
    label: "Temperament or handling notes",
    type: "text",
    helpText: "Anxious, elderly, matted coat, etc.",
  },
];

const DETAILING_GUARDS: BookingGuardField[] = [
  {
    id: "vehicle_make_model",
    label: "Vehicle make & model",
    type: "text",
    required: true,
  },
];

const MEDSPA_GUARDS: BookingGuardField[] = [
  {
    id: "prior_treatment",
    label: "Had this treatment before?",
    type: "select",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No — may need intake" },
    ],
  },
];

const ALLIED_HEALTH_GUARDS: BookingGuardField[] = [
  {
    id: "reason_for_visit",
    label: "Reason for visit",
    type: "text",
    required: true,
    helpText: "e.g. lower back pain, sports injury, routine hygiene",
  },
  {
    id: "gp_referral",
    label: "GP referral or prior imaging?",
    type: "select",
    options: [
      { value: "yes", label: "Yes — I can bring details" },
      { value: "no", label: "No" },
      { value: "na", label: "Not applicable" },
    ],
  },
];

const WELLNESS_GUARDS: BookingGuardField[] = [
  {
    id: "health_notes",
    label: "Health or allergy notes (optional)",
    type: "text",
    helpText: "Pregnancy, injuries, oils, pressure preference — not a medical diagnosis.",
  },
  {
    id: "therapist_preference",
    label: "Therapist preference",
    type: "select",
    required: false,
    options: [
      { value: "no_preference", label: "No preference" },
      { value: "same_as_last", label: "Same therapist as last visit" },
      { value: "female", label: "Female therapist if available" },
      { value: "male", label: "Male therapist if available" },
    ],
  },
  {
    id: "couples_or_shared",
    label: "Booking type",
    type: "select",
    options: [
      { value: "solo", label: "Solo session" },
      { value: "couples", label: "Couples / shared room" },
      { value: "gift", label: "Gift for someone else" },
    ],
    helpText: "Helps reception assign the right room layout.",
  },
];

const FITNESS_GUARDS: BookingGuardField[] = [
  {
    id: "parq_cleared",
    label: "Physical activity readiness (PAR-Q)",
    type: "select",
    required: true,
    options: [
      { value: "yes_cleared", label: "I am cleared for exercise" },
      {
        value: "need_review",
        label: "I have a condition — please review before my first session",
      },
    ],
    helpText: "Required on your first visit. Bring medical clearance if you are unsure.",
  },
  {
    id: "fitness_goal",
    label: "Session goal (optional)",
    type: "text",
    helpText: "Strength, rehab, intro class, etc.",
  },
];

export const BOOKING_GUARDS: Partial<Record<BusinessVertical, BookingGuardField[]>> = {
  hair: HAIR_GUARDS,
  beauty: [
    {
      id: "patch_test",
      label: "Patch test up to date (if required)?",
      type: "select",
      required: true,
      options: [
        { value: "yes", label: "Yes" },
        { value: "no", label: "No / not sure" },
        { value: "na", label: "Not applicable" },
      ],
    },
  ],
  "pet-grooming": PET_GUARDS,
  "automotive-detailing": DETAILING_GUARDS,
  medspa: MEDSPA_GUARDS,
  "allied-health": ALLIED_HEALTH_GUARDS,
  fitness: FITNESS_GUARDS,
  wellness: WELLNESS_GUARDS,
  "event-vendors": [
    {
      id: "event_theme",
      label: "Theme or colour palette",
      type: "text",
      helpText: "e.g. blush and gold, superhero, elegant white",
    },
    {
      id: "inspiration_link",
      label: "Inspiration link (optional)",
      type: "text",
      helpText: "Pinterest or Instagram post URL",
    },
  ],
};

export function getBookingGuardsForVertical(vertical: BusinessVertical): BookingGuardField[] {
  return BOOKING_GUARDS[vertical] ?? [];
}

export function formatGuardAnswersForNotes(
  guards: BookingGuardField[],
  answers: Record<string, string>,
): string {
  const lines: string[] = [];
  for (const g of guards) {
    const v = answers[g.id]?.trim();
    if (!v) continue;
    const label = g.options?.find((o) => o.value === v)?.label ?? v;
    lines.push(`${g.label}: ${label}`);
  }
  return lines.join("\n");
}
