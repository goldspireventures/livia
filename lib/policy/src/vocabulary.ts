import type { BusinessVertical } from "./types";
import { getVerticalPack, resolveVerticalFromCategory } from "./verticals";

/** UI + ritual copy per vertical — single source for web and mobile. */
const VOCAB: Record<
  BusinessVertical,
  {
    clientNoun: string;
    serviceNoun: string;
    locationNoun: string;
    teamNoun: string;
    hint: string;
    ownerTodayLine: string;
    /** Owner home — today's timeline card heading (avoid pluralising serviceNoun). */
    ownerTodayScheduleTitle: string;
    /** Owner home — link to /bookings for the full day. */
    ownerTodayScheduleCalendarCta: string;
    /** Per-appointment SMS when you're behind (CONFIRMED bookings). */
    runningLateLabel: string;
  }
> = {
  hair: {
    clientNoun: "Client",
    serviceNoun: "Service",
    locationNoun: "Shop",
    teamNoun: "Team",
    hint: "Cuts, colour, and chair time — Liv speaks your vertical.",
    ownerTodayLine: "Today's bookings, inbox, and anything that needs a yes or no.",
    ownerTodayScheduleTitle: "Today's chair",
    ownerTodayScheduleCalendarCta: "Full day calendar",
    runningLateLabel: "Running late",
  },
  beauty: {
    clientNoun: "Client",
    serviceNoun: "Treatment",
    locationNoun: "Studio",
    teamNoun: "Team",
    hint: "Treatments and tech assignments — patch tests where required.",
    ownerTodayLine: "Today's schedule, approvals, and inbox — one calm view.",
    ownerTodayScheduleTitle: "Today's schedule",
    ownerTodayScheduleCalendarCta: "Full day calendar",
    runningLateLabel: "Running late",
  },
  "body-art": {
    clientNoun: "Client",
    serviceNoun: "Session",
    locationNoun: "Studio",
    teamNoun: "Artists",
    hint: "Consult before long sessions; never rush the relationship.",
    ownerTodayLine: "Sessions, consults, and messages — studio-wide.",
    ownerTodayScheduleTitle: "Today's sessions",
    ownerTodayScheduleCalendarCta: "Full day calendar",
    runningLateLabel: "Running late",
  },
  wellness: {
    clientNoun: "Guest",
    serviceNoun: "Session",
    locationNoun: "Studio",
    teamNoun: "Practitioners",
    hint: "Calmer tone; policy-heavy reschedules.",
    ownerTodayLine: "Today's sessions and handoffs — steady rhythm.",
    ownerTodayScheduleTitle: "Today's sessions",
    ownerTodayScheduleCalendarCta: "Full day calendar",
    runningLateLabel: "Running behind",
  },
  fitness: {
    clientNoun: "Member",
    serviceNoun: "Session",
    locationNoun: "Studio",
    teamNoun: "Coaches",
    hint: "Sessions and coaches — brisk energy.",
    ownerTodayLine: "Classes and PT slots — who's in today.",
    ownerTodayScheduleTitle: "Today's schedule",
    ownerTodayScheduleCalendarCta: "Full day calendar",
    runningLateLabel: "Running behind",
  },
  medspa: {
    clientNoun: "Patient",
    serviceNoun: "Treatment",
    locationNoun: "Clinic",
    teamNoun: "Practitioners",
    hint: "Clinical precision; consent language explicit.",
    ownerTodayLine: "Today's schedule and approvals — clinical calm.",
    ownerTodayScheduleTitle: "Today's schedule",
    ownerTodayScheduleCalendarCta: "Full day calendar",
    runningLateLabel: "Running late for appointment",
  },
  "allied-health": {
    clientNoun: "Patient",
    serviceNoun: "Appointment",
    locationNoun: "Practice",
    teamNoun: "Clinicians",
    hint: "Session-based care; not a substitute for clinical records systems.",
    ownerTodayLine: "Today's appointments and patient messages.",
    ownerTodayScheduleTitle: "Today's appointments",
    ownerTodayScheduleCalendarCta: "Full day calendar",
    runningLateLabel: "Running late for appointment",
  },
  "pet-grooming": {
    clientNoun: "Parent",
    serviceNoun: "Groom",
    locationNoun: "Salon",
    teamNoun: "Groomers",
    hint: "Pet records, breed notes, and rebook cycles every 4–8 weeks.",
    ownerTodayLine: "Today's schedule and pet parent messages.",
    ownerTodayScheduleTitle: "Today's schedule",
    ownerTodayScheduleCalendarCta: "Full day calendar",
    runningLateLabel: "Running late",
  },
  "automotive-detailing": {
    clientNoun: "Client",
    serviceNoun: "Detail",
    locationNoun: "Studio",
    teamNoun: "Team",
    hint: "Vehicle details and bay time — confirm make/model on book.",
    ownerTodayLine: "Today's bay schedule and client threads.",
    ownerTodayScheduleTitle: "Today's schedule",
    ownerTodayScheduleCalendarCta: "Full day calendar",
    runningLateLabel: "Running late for booking",
  },
};

export function resolveVerticalKey(
  vertical?: string | null,
  category?: string | null,
): BusinessVertical {
  if (vertical && vertical in VOCAB) return vertical as BusinessVertical;
  return resolveVerticalFromCategory(category);
}

export function businessVocabulary(vertical?: string | null, category?: string | null) {
  const key = resolveVerticalKey(vertical, category);
  const pack = getVerticalPack(key);
  const v = VOCAB[key];
  return {
    vertical: key,
    label: pack.label,
    livVocabularyHint: pack.livVocabularyHint,
    ...v,
  };
}
