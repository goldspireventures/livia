/**
 * Incumbent pain points Livia solves — per vertical and sub-vertical (generic categories, no vendor names).
 */
import type { BusinessVertical } from "./types";
import type { SubverticalProfileId } from "./subvertical-profiles";
import type { IncumbentCategory } from "./competitive-parity";

export type VerticalPainPoint = {
  id: string;
  incumbent: IncumbentCategory;
  pain: string;
  liviaAnswer: string;
};

const BASE_PAINS: Record<BusinessVertical, VerticalPainPoint[]> = {
  hair: [
    { id: "double_entry", incumbent: "solo_scheduling", pain: "Personal calendar vs salon book — double entry", liviaAnswer: "Google Calendar two-way sync; Liv blocks slots from your real life" },
    { id: "stylist_memory", incumbent: "salon_suite", pain: "Colour formulas lost between visits", liviaAnswer: "Client memory + visit notes — stylist-scoped, not a CRM chore" },
    { id: "dm_chaos", incumbent: "marketplace_booking", pain: "Instagram DMs for bookings never become appointments", liviaAnswer: "Liv books in WhatsApp thread — confirm without opening Acuity" },
    { id: "waitlist", incumbent: "salon_suite", pain: "Cancellations leave dead chair time", liviaAnswer: "Waitlist auto-fill — Liv offers the slot, guest accepts in one tap" },
  ],
  beauty: [
    { id: "allergy_gate", incumbent: "solo_scheduling", pain: "Patch tests tracked in spreadsheets", liviaAnswer: "Tokenized intake before visit — allergy data on the booking, not a clipboard" },
    { id: "multi_service", incumbent: "salon_suite", pain: "Lash + nail + brow = three systems", liviaAnswer: "One menu, one calendar, vertical copy for each service kind" },
    { id: "dm_book", incumbent: "marketplace_booking", pain: "DM-to-chair still means manual re-keying", liviaAnswer: "WhatsApp book + intake link in-thread" },
    { id: "deposit", incumbent: "solo_scheduling", pain: "No-shows on long fills", liviaAnswer: "Deposit at book + reminders — policy-driven per service" },
  ],
  wellness: [
    { id: "room_board", incumbent: "fitness_studio", pain: "Therapist calendars disagree with room board", liviaAnswer: "Room resources + calendar poison alerts after Google sync" },
    { id: "packages", incumbent: "fitness_studio", pain: "Series packs tracked manually", liviaAnswer: "Package credits burn on book — Liv tracks balance" },
    { id: "quiet_ops", incumbent: "solo_scheduling", pain: "Mindbody UI noise for a 3-room spa", liviaAnswer: "Owner home ritual — depth in background, calm day view" },
  ],
  "body-art": [
    { id: "proof_loop", incumbent: "consult_first_vendor", pain: "Design approval over screenshot threads", liviaAnswer: "Proof guest surface — approve/reject with audit trail" },
    { id: "health_gate", incumbent: "solo_scheduling", pain: "Health questions at arrival slow the chair", liviaAnswer: "Pre-session intake token — signed before day-of" },
    { id: "deposit", incumbent: "consult_first_vendor", pain: "Large sessions need deposits without awkward DMs", liviaAnswer: "Guest pay link on book host" },
  ],
  fitness: [
    { id: "capacity", incumbent: "fitness_studio", pain: "Class overbooking and manual waitlists", liviaAnswer: "Class capacity + waitlist accept surface" },
    { id: "packs", incumbent: "fitness_studio", pain: "Membership packs in spreadsheets", liviaAnswer: "Package credits + burn on attendance" },
    { id: "fill", incumbent: "horizontal_pos", pain: "Empty spots last minute", liviaAnswer: "Waitlist recovery — Liv promotes when someone drops" },
  ],
  medspa: [
    { id: "consent", incumbent: "clinical_aesthetics", pain: "Consent packets and clinical intake scattered", liviaAnswer: "Clinical hub + guest intake — queue, not paper" },
    { id: "compliance", incumbent: "clinical_aesthetics", pain: "Procedure-specific consent versions", liviaAnswer: "Medspa procedure registry — versioned consent bodies" },
    { id: "deposit", incumbent: "salon_suite", pain: "High-value treatments need prepay", liviaAnswer: "Deposit at book + balance at visit rail" },
  ],
  "allied-health": [
    { id: "intake", incumbent: "clinical_aesthetics", pain: "Reason-for-visit forms retyped every time", liviaAnswer: "Pre-visit intake token — persists on client record" },
    { id: "plan", incumbent: "solo_scheduling", pain: "Care series and follow-ups fall through", liviaAnswer: "Care series + Liv memory across visits" },
    { id: "reminders", incumbent: "solo_scheduling", pain: "Reminder fatigue with generic templates", liviaAnswer: "Tenant vocabulary reminders — physio/chiro copy" },
  ],
  "pet-grooming": [
    { id: "pet_profile", incumbent: "salon_suite", pain: "Temperament notes live in reception sticky notes", liviaAnswer: "Pet profile on customer — breed, behaviour, vet" },
    { id: "mobile_route", incumbent: "solo_scheduling", pain: "Van route vs book out of sync", liviaAnswer: "Calendar sync + travel-aware slots" },
    { id: "repeat", incumbent: "salon_suite", pain: "Rebook same groomer is manual", liviaAnswer: "Guest /my relationship + rebook same staff" },
  ],
  "automotive-detailing": [
    { id: "vehicle", incumbent: "horizontal_pos", pain: "Which Audi was this again?", liviaAnswer: "Vehicle continuity on customer + guest hub" },
    { id: "bay", incumbent: "solo_scheduling", pain: "Bay time vs detail duration mismatch", liviaAnswer: "Service duration + deposit for long details" },
    { id: "migrate", incumbent: "solo_scheduling", pain: "Leaving generic scheduler loses client list", liviaAnswer: "CSV + OAuth migration with parallel-run diff" },
  ],
  "event-vendors": [
    { id: "quote_book", incumbent: "consult_first_vendor", pain: "Enquire → quote → book is three tools", liviaAnswer: "Consult-first pipeline — quote deposit credits on book" },
    { id: "wa_quote", incumbent: "consult_first_vendor", pain: "Couples ask on WhatsApp; quotes live in Notes", liviaAnswer: "Liv in DM + operator quote templates" },
    { id: "milestones", incumbent: "solo_scheduling", pain: "Wedding dates and holds scattered", liviaAnswer: "Event lifecycle + milestone bookings" },
  ],
};

const SUBVERTICAL_OVERRIDES: Partial<Record<SubverticalProfileId, VerticalPainPoint[]>> = {
  "hair.chair_rental": [
    { id: "pii", incumbent: "salon_suite", pain: "Host seeing renter client phones", liviaAnswer: "PII firewall — host sees chairs and rent, not renter CRM" },
    { id: "rent", incumbent: "horizontal_pos", pain: "Weekly rent tracked in spreadsheets", liviaAnswer: "Host floor — due/paid with Friday auto-mark + notify" },
  ],
  "hair.barber": [
    { id: "walkin", incumbent: "solo_scheduling", pain: "Walk-ins vs online book clash", liviaAnswer: "Walk-in slot proposal + Liv voice for solo barbers" },
  ],
  "wellness.couples": [
    { id: "dual_room", incumbent: "fitness_studio", pain: "Two rooms must align for couples", liviaAnswer: "Dual resource booking + package day bundles" },
  ],
  "fitness.class": [
    { id: "waitlist", incumbent: "fitness_studio", pain: "Waitlist promoted by hand at 6am", liviaAnswer: "Class waitlist accept guest surface" },
  ],
  "event.wedding": [
    { id: "hold", incumbent: "consult_first_vendor", pain: "Date holds expire silently", liviaAnswer: "Quote deposit + expiry continuity — Liv nudges before hold lapses" },
  ],
  "auto.mobile": [
    { id: "location", incumbent: "solo_scheduling", pain: "Client address not on the booking", liviaAnswer: "Guest hub + intake notes for pickup location" },
  ],
};

export function incumbentPainPointsForVertical(vertical: BusinessVertical): VerticalPainPoint[] {
  return BASE_PAINS[vertical] ?? [];
}

export function incumbentPainPointsForSubvertical(
  vertical: BusinessVertical,
  subverticalId?: SubverticalProfileId | null,
): VerticalPainPoint[] {
  const base = incumbentPainPointsForVertical(vertical);
  const extra = subverticalId ? SUBVERTICAL_OVERRIDES[subverticalId] ?? [] : [];
  const seen = new Set<string>();
  return [...base, ...extra].filter((p) => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });
}
