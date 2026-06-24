/**
 * Owner appearance picker — operator + guest intent per preset (policy hub).
 * @see docs/design/PRESENTATION-PRESETS-AND-ROLLOUT.md
 */
import type { BusinessVertical } from "./types";
import { PLATFORM_DEFAULT_PRESET_ID } from "./presentation-presets";
import type { PresentationLayoutMorph } from "./presentation-surface";
import { resolveBeautyPickerMeta } from "./beauty-experience";

export type PresetPickerMeta = {
  presetId: string;
  label: string;
  colorScheme: string;
  morph?: PresentationLayoutMorph;
  morphLabel?: string;
  operatorIntent: string;
  guestIntent: string;
  whenToPick: string;
};

const META: Record<string, PresetPickerMeta> = {
  [PLATFORM_DEFAULT_PRESET_ID]: {
    presetId: PLATFORM_DEFAULT_PRESET_ID,
    label: "Platform Default",
    colorScheme: "Constellation · champagne accent · Aurora Today",
    morph: "constellation",
    morphLabel: "Constellation",
    operatorIntent: "Classic Livia Today — briefing, inbox, and bookings on the constellation shell.",
    guestIntent: "Vertical default booking page until you pick a studio skin.",
    whenToPick: "Start here, then choose a native preset for your studio mood.",
  },
  /* —— Hair —— */
  "hair-warm-chair": {
    presetId: "hair-warm-chair",
    label: "Warm Chair",
    colorScheme: "Golden daylight · serif headlines · roomy cards",
    morph: "standard",
    morphLabel: "Salon cards",
    operatorIntent: "Warm salon Today — serif headers, golden accents, comfortable card density.",
    guestIntent: "Classic appointment book — friendly, bright, treatment-first.",
    whenToPick: "Full-service salons and colour bars with a welcoming chair-side feel.",
  },
  "hair-clean-salon": {
    presetId: "hair-clean-salon",
    label: "Clean Salon",
    colorScheme: "Cool white · sans-serif · timeline flow",
    morph: "timeline-rail",
    morphLabel: "Timeline",
    operatorIntent: "Modern timeline Today — airy spacing, fast scan down the day.",
    guestIntent: "Minimal booking page — clean slots, no visual noise.",
    whenToPick: "Contemporary salons and blow-dry bars prioritising clarity.",
  },
  "hair-barber-bold": {
    presetId: "hair-barber-bold",
    label: "Barber Bold",
    colorScheme: "Dark shop · high contrast · compact list",
    morph: "standard",
    morphLabel: "Bold list",
    operatorIntent: "Compact dark shell — walk-ins and fades at a glance.",
    guestIntent: "Fast book path — bold type, minimal steps.",
    whenToPick: "Barbershops and men's grooming with high throughput.",
  },
  /* —— Body art —— */
  "body-art-studio-dark": {
    presetId: "body-art-studio-dark",
    label: "Studio Dark",
    colorScheme: "Charcoal walls · red accent · flash-paper cards",
    morph: "pipeline",
    morphLabel: "Consult → proof → session",
    operatorIntent: "Pipeline Today — consults, proof review, and session-ready rows in one desk.",
    guestIntent: "Moody booking page — artist roster, sessions, aftercare shop, approved flash gallery.",
    whenToPick: "Traditional tattoo studios and custom work shops.",
  },
  "body-art-flash-light": {
    presetId: "body-art-flash-light",
    label: "Flash Light",
    colorScheme: "Paper white · flash-sheet cards · clean proof review",
    morph: "pipeline",
    morphLabel: "Flash desk",
    operatorIntent: "Bright proof desk — artwork on paper-white cards, pipeline sidebar.",
    guestIntent: "Flash-sheet booking page — swipe gallery, walk-in friendly book flow.",
    whenToPick: "Walk-in flash days and artists who live on light desk aesthetics.",
  },
  "body-art-minimal-mono": {
    presetId: "body-art-minimal-mono",
    label: "Minimal Mono",
    colorScheme: "Black & white · typography-first · compact",
    morph: "standard",
    morphLabel: "Minimal list",
    operatorIntent: "Compact mono shell — proof queue as a tight list, no chrome fuss.",
    guestIntent: "Typography-led booking page — proof page with square mats and uppercase labels.",
    whenToPick: "Solo artists who want software to disappear.",
  },
  /* —— Wellness —— */
  "wellness-harbour-light": {
    presetId: "wellness-harbour-light",
    label: "Harbour Light",
    colorScheme: "Sea-glass teal · serif · room atrium",
    morph: "atrium",
    morphLabel: "Room atrium",
    operatorIntent: "Atrium Today — lanes per room, concierge inbox, gift-ready retail.",
    guestIntent: "Calm spa booking page — ritual copy, couples packages, take-home retail.",
    whenToPick: "Day spas and multi-room wellness studios.",
  },
  "wellness-session-rail": {
    presetId: "wellness-session-rail",
    label: "Session Rail",
    colorScheme: "Neutral rail · vertical time · therapist day",
    morph: "timeline-rail",
    morphLabel: "Time rail",
    operatorIntent: "Vertical time rail — one therapist's day in a single scroll.",
    guestIntent: "Slot list booking page — pick a time, minimal marketing chrome.",
    whenToPick: "Solo therapists and small teams living by the clock.",
  },
  "wellness-evening-ledger": {
    presetId: "wellness-evening-ledger",
    label: "Evening Ledger",
    colorScheme: "Muted gold · dark ledger · voucher tone",
    morph: "ledger",
    morphLabel: "Evening ledger",
    operatorIntent: "Ledger Today — vouchers, packages, and evening retreat check-ins.",
    guestIntent: "Retreat booking page — gift vouchers and ritual booking path.",
    whenToPick: "Retreat venues and evening-only spas.",
  },
  /* —— Fitness —— */
  "fitness-gym-bold": {
    presetId: "fitness-gym-bold",
    label: "Gym Bold",
    colorScheme: "Dark gym · green accent · class roster",
    morph: "timeline-rail",
    morphLabel: "Class roster",
    operatorIntent: "High-energy dark shell — classes and PT blocks on a bold timeline.",
    guestIntent: "Class-first booking page — roster visible, strong CTA to book.",
    whenToPick: "Gyms and HIIT studios with class-heavy ops.",
  },
  "fitness-studio-clean": {
    presetId: "fitness-studio-clean",
    label: "Studio Clean",
    colorScheme: "Bright studio · teal calm · capacity cards",
    morph: "standard",
    morphLabel: "Studio cards",
    operatorIntent: "Bright Pilates/yoga Today — capacity and waitlist forward.",
    guestIntent: "Airy booking page — class tiles with spots remaining.",
    whenToPick: "Boutique movement studios and reformer rooms.",
  },
  "fitness-coach-compact": {
    presetId: "fitness-coach-compact",
    label: "Coach Compact",
    colorScheme: "Dense day list · pack burn visible",
    morph: "standard",
    morphLabel: "Compact list",
    operatorIntent: "Dense PT day — many short slots, pack usage visible.",
    guestIntent: "Quick book — minimal marketing, session picker first.",
    whenToPick: "Personal trainers and small PT gyms.",
  },
  /* —— Medspa —— */
  "medspa-clinical-calm": {
    presetId: "medspa-clinical-calm",
    label: "Clinical Calm",
    colorScheme: "Lavender clinical · small radius · consent forward",
    morph: "standard",
    morphLabel: "Clinical cards",
    operatorIntent: "Consent-forward Today — procedures, intakes, and audit trail visible.",
    guestIntent: "Clinical booking page — consent step in book flow, restrained palette.",
    whenToPick: "Medspas and aesthetic clinics with compliance-first ops.",
  },
  "medspa-luxury-serif": {
    presetId: "medspa-luxury-serif",
    label: "Luxury Serif",
    colorScheme: "Dark luxe · serif display · wide spacing",
    morph: "standard",
    morphLabel: "Luxury list",
    operatorIntent: "Premium dark cockpit — serif headers, wide margins on Today.",
    guestIntent: "High-end booking page — editorial spacing, premium tone.",
    whenToPick: "Luxury aesthetics clinics and celebrity-facing practices.",
  },
  "medspa-minimal-consent": {
    presetId: "medspa-minimal-consent",
    label: "Minimal Consent",
    colorScheme: "Form-first · compact · procedure dominates",
    morph: "standard",
    morphLabel: "Form-first",
    operatorIntent: "Form-dense shell — intakes and mandates dominate the layout.",
    guestIntent: "Procedure + consent steps lead the booking page wizard.",
    whenToPick: "Clinics where compliance screens outrank marketing.",
  },
  /* —— Allied health —— */
  "allied-clinic-standard": {
    presetId: "allied-clinic-standard",
    label: "Clinic Standard",
    colorScheme: "Clinical blue · follow-up chain",
    morph: "timeline-rail",
    morphLabel: "Care timeline",
    operatorIntent: "Physio/chiro timeline — follow-ups and care plans visible.",
    guestIntent: "Professional booking page — short slots, clinical trust copy.",
    whenToPick: "Physio, chiro, and standard outpatient clinics.",
  },
  "allied-practice-warm": {
    presetId: "allied-practice-warm",
    label: "Practice Warm",
    colorScheme: "Warm approachable · serif · patient-friendly",
    morph: "standard",
    morphLabel: "Warm cards",
    operatorIntent: "Approachable Today — softer tone, patient-friendly density.",
    guestIntent: "Welcoming booking page — less clinical, more neighbourhood practice.",
    whenToPick: "Family practices and community clinics.",
  },
  "allied-compact-desk": {
    presetId: "allied-compact-desk",
    label: "Compact Desk",
    colorScheme: "Front-desk dense · fast check-in",
    morph: "standard",
    morphLabel: "Desk list",
    operatorIntent: "Dense front desk — many short appointments, quick patient lookup.",
    guestIntent: "Fast book — minimal friction for repeat patients.",
    whenToPick: "Busy multi-practitioner clinics with high footfall.",
  },
  /* —— Pet grooming —— */
  "pet-playful-paw": {
    presetId: "pet-playful-paw",
    label: "Playful Paw",
    colorScheme: "Rounded cards · purple accent · pet-forward",
    morph: "standard",
    morphLabel: "Playful cards",
    operatorIntent: "Friendly groomer Today — pet profiles and pickup SMS forward.",
    guestIntent: "Playful booking page — pet details in book flow, warm colours.",
    whenToPick: "Neighbourhood groomers and daycare-style salons.",
  },
  "pet-clean-groom": {
    presetId: "pet-clean-groom",
    label: "Clean Groom",
    colorScheme: "Professional tidy · teal calm",
    morph: "timeline-rail",
    morphLabel: "Salon timeline",
    operatorIntent: "Professional salon timeline — tidy day board, SMS pickup.",
    guestIntent: "Clean booking page — breed/size guards, professional tone.",
    whenToPick: "Premium grooming salons and multi-staff shops.",
  },
  "pet-mobile-van": {
    presetId: "pet-mobile-van",
    label: "Mobile Van",
    colorScheme: "Compact route · orange accent",
    morph: "standard",
    morphLabel: "Route list",
    operatorIntent: "Mobile route list — compact day, van-friendly density.",
    guestIntent: "Simple booking page — address-first booking for mobile groomers.",
    whenToPick: "Mobile groomers and van routes.",
  },
  /* —— Automotive —— */
  "auto-bay-industrial": {
    presetId: "auto-bay-industrial",
    label: "Bay Industrial",
    colorScheme: "Industrial dark · bay yellow · spatial packages",
    morph: "atrium",
    morphLabel: "Bay floor",
    operatorIntent: "Bay timeline — vehicle-aware packages and floor overview.",
    guestIntent: "Industrial booking page — package cards, valet comms tone.",
    whenToPick: "Detail shops and multi-bay studios.",
  },
  "auto-showroom-light": {
    presetId: "auto-showroom-light",
    label: "Showroom Light",
    colorScheme: "Premium light · package cards",
    morph: "standard",
    morphLabel: "Showroom",
    operatorIntent: "Premium detail Today — package upsell and valet handoffs.",
    guestIntent: "Showroom booking page — package-first book path.",
    whenToPick: "Premium detail and concierge valet services.",
  },
  "auto-compact-mobile": {
    presetId: "auto-compact-mobile",
    label: "Compact Mobile",
    colorScheme: "One-thumb day · running-late broadcast",
    morph: "standard",
    morphLabel: "Mobile list",
    operatorIntent: "Mobile detailer list — one-thumb day, late broadcast ready.",
    guestIntent: "Minimal booking page — location and slot, fast confirm.",
    whenToPick: "Mobile detailers and solo operators.",
  },
  /* —— Event vendors —— */
  "event-vendor-atelier": {
    presetId: "event-vendor-atelier",
    label: "Atelier",
    colorScheme: "Gallery warm · serif · enquire-first",
    morph: "atrium",
    morphLabel: "Gallery atrium",
    operatorIntent: "Gallery Today — hero enquiries, roomy pipeline, decor studio.",
    guestIntent: "Enquire-first `/e` — portfolio-led, consult CTA.",
    whenToPick: "Event decorators and design-led vendors.",
  },
  "event-wedding-ledger": {
    presetId: "event-wedding-ledger",
    label: "Wedding Ledger",
    colorScheme: "Muted luxury · quote pipeline · deposits",
    morph: "pipeline",
    morphLabel: "Quote pipeline",
    operatorIntent: "Quote pipeline Today — milestones and deposits front and centre.",
    guestIntent: "Ledger `/e` — milestone deposits in guest journey.",
    whenToPick: "Wedding planners and luxury event suppliers.",
  },
  "event-party-pop": {
    presetId: "event-party-pop",
    label: "Party Pop",
    colorScheme: "Playful party · menu-card grid",
    morph: "menu-card",
    morphLabel: "Party menu",
    operatorIntent: "Playful party grid — packages as menu cards on Today.",
    guestIntent: "Fun `/e` — package picker, party energy.",
    whenToPick: "Kids' parties, entertainers, and playful vendors.",
  },
};

/** Resolve picker copy for settings appearance tab (all verticals). */
export function resolvePresetPickerMeta(
  vertical: BusinessVertical | null | undefined,
  presetId: string | null | undefined,
): PresetPickerMeta | null {
  if (!presetId) return null;
  if (vertical === "beauty") {
    const beauty = resolveBeautyPickerMeta(presetId);
    if (beauty) return beauty;
  }
  return META[presetId] ?? null;
}

/** All preset ids that must have picker meta (CI). */
export function listPresetIdsRequiringPickerMeta(): string[] {
  return Object.keys(META).filter((id) => id !== PLATFORM_DEFAULT_PRESET_ID);
}
