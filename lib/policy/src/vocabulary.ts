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
    /** Public /b — catalog section title (plural, guest-facing). */
    publicBookCatalogTitle: string;
    /** W4 /bookings page title (align with shell nav, e.g. wellness "Rooms"). */
    bookingsPageTitle?: string;
    bookingsPageSubtitle?: string;
    /** W4 /staff roster page subtitle (no ownership/legal asides — those live in Settings). */
    teamPageSubtitle?: string;
    /** Singular provider on calendar rows (wellness: Therapist). */
    providerNoun?: string;
    /** Membership role labels on roster + invites. */
    membershipRoleStaff?: string;
    membershipRoleAdmin?: string;
    teamInviteRoleStaff?: string;
    teamInviteRoleAdmin?: string;
    teamInviteCta?: string;
  }
> = {
  hair: {
    clientNoun: "Client",
    serviceNoun: "Service",
    publicBookCatalogTitle: "Services",
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
    publicBookCatalogTitle: "Treatments",
    locationNoun: "Studio",
    teamNoun: "Team",
    hint: "Treatments and tech assignments — patch tests where required.",
    ownerTodayLine: "Today's schedule, approvals, and inbox — one calm view.",
    ownerTodayScheduleTitle: "Today's schedule",
    ownerTodayScheduleCalendarCta: "Full day calendar",
    runningLateLabel: "Running late",
    bookingsPageTitle: "Schedule",
    bookingsPageSubtitle: "Today's stations and appointments — confirm fills and new sets.",
    teamPageSubtitle: "Artists and techs on your floor calendar.",
    providerNoun: "Artist",
    membershipRoleStaff: "Artist",
    membershipRoleAdmin: "Studio lead",
    teamInviteRoleStaff: "Artist — own calendar",
    teamInviteRoleAdmin: "Studio lead — full access except billing",
    teamInviteCta: "Invite artist",
  },
  "body-art": {
    clientNoun: "Client",
    serviceNoun: "Session",
    publicBookCatalogTitle: "Sessions",
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
    publicBookCatalogTitle: "Sessions",
    locationNoun: "Studio",
    teamNoun: "Practitioners",
    hint: "Calmer tone; policy-heavy reschedules.",
    ownerTodayLine: "Today's sessions and handoffs — steady rhythm.",
    ownerTodayScheduleTitle: "Today's sessions",
    ownerTodayScheduleCalendarCta: "Room calendar",
    runningLateLabel: "Running behind",
    bookingsPageTitle: "Rooms",
    bookingsPageSubtitle: "Room calendar — sessions by slot and therapist.",
    teamPageSubtitle: "Therapists and front desk on your room calendar.",
    providerNoun: "Therapist",
    membershipRoleStaff: "Practitioner",
    membershipRoleAdmin: "Studio lead",
    teamInviteRoleStaff: "Practitioner — own calendar",
    teamInviteRoleAdmin: "Studio lead — full access except billing",
    teamInviteCta: "Invite practitioner",
  },
  fitness: {
    clientNoun: "Member",
    serviceNoun: "Session",
    publicBookCatalogTitle: "Sessions",
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
    publicBookCatalogTitle: "Treatments",
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
    publicBookCatalogTitle: "Appointments",
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
    publicBookCatalogTitle: "Grooming",
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
    publicBookCatalogTitle: "Services",
    locationNoun: "Studio",
    teamNoun: "Team",
    hint: "Vehicle details and bay time — confirm make/model on book.",
    ownerTodayLine: "Today's bay schedule and client threads.",
    ownerTodayScheduleTitle: "Today's schedule",
    ownerTodayScheduleCalendarCta: "Full day calendar",
    runningLateLabel: "Running late for booking",
  },
  "event-vendors": {
    clientNoun: "Client",
    serviceNoun: "Service",
    publicBookCatalogTitle: "Catalogue",
    locationNoun: "Studio",
    teamNoun: "Team",
    hint: "Event date, theme, and guest count — quote before you book.",
    ownerTodayLine: "New enquiries and quotes awaiting your reply.",
    ownerTodayScheduleTitle: "Upcoming events",
    ownerTodayScheduleCalendarCta: "Event calendar",
    runningLateLabel: "Running late for setup",
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

/** W4 operational pages — titles and role nouns (web + mobile). */
export function verticalOperationalCopy(vertical?: string | null, category?: string | null) {
  const v = businessVocabulary(vertical, category);
  return {
    bookingsPageTitle: v.bookingsPageTitle ?? "Bookings",
    bookingsPageSubtitle:
      v.bookingsPageSubtitle ?? "Calendar and reservations for your studio.",
    teamPageTitle: v.teamNoun,
    teamPageSubtitle:
      v.teamPageSubtitle ?? `Your ${v.teamNoun.toLowerCase()} and who can sign in to Livia.`,
    providerNoun: v.providerNoun ?? "Provider",
    membershipRoleStaff: v.membershipRoleStaff ?? "Staff",
    membershipRoleAdmin: v.membershipRoleAdmin ?? "Manager",
    teamInviteRoleStaff:
      v.teamInviteRoleStaff ?? "Staff — own calendar only",
    teamInviteRoleAdmin:
      v.teamInviteRoleAdmin ?? "Admin — full access except billing & ownership",
    addTeamMemberCta: `Add ${v.providerNoun?.toLowerCase() ?? "team member"}`,
    emptyTeamTitle: `No ${v.teamNoun.toLowerCase()} yet`,
    emptyTeamBody: `Add ${v.teamNoun.toLowerCase()} to fill your room calendar.`,
    searchBookingsPlaceholder: `Search guest or ${v.serviceNoun.toLowerCase()}…`,
    teamInviteCta: v.teamInviteCta ?? "Invite team member",
  };
}

/** Roster row subtitle — calendar staff, not membership enum. */
export function rosterMemberRoleLabel(
  role: string | null | undefined,
  vertical?: string | null,
  category?: string | null,
): string {
  const op = verticalOperationalCopy(vertical, category);
  const r = String(role ?? "").toUpperCase();
  if (r === "ADMIN") return op.membershipRoleAdmin;
  if (r === "STAFF") return op.membershipRoleStaff;
  if (role?.trim()) return role.trim();
  return op.providerNoun;
}
