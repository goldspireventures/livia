/**
 * Demo persona registry — the seven doors of the Livia hotel.
 *
 * The premise (`docs/personas.md`, "the hotel principle"): each persona
 * walks into the *same hotel* (same Livia data model), but the *ritual*
 * they encounter is theirs alone. This file is the source of truth for
 * who those seven personas are, what they're called, what colour their
 * door is, and what copy + data they see in the showcase surface.
 *
 * Pure client-side mock — no API calls. The demo gateway is a public
 * showcase, gated only by the env-flag/Clerk-allow-list when wired to
 * the real backend (see `docs/demo-gateway.md`). For now it's a
 * marketing-grade tap-through that proves the principle.
 */

export type PersonaId =
  | "org_admin"
  | "owner"
  | "manager"
  | "staff-senior"
  | "staff-junior"
  | "receptionist"
  | "customer";

export type PersonaAccent = "violet" | "cyan" | "mint" | "champagne" | "amber" | "rose" | "indigo";

export interface PersonaBooking {
  id: string;
  time: string; // "10:30"
  durationMin: number;
  customer: string;
  service: string;
  staff?: string;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
  tipEur?: number;
}

export interface PersonaShop {
  id: string;
  name: string;
  city: string;
  todayBookings: number;
  todayRevenueEur: number;
  utilisationPct: number;
  staffOnShift: number;
  pendingCount: number;
  trend: "up" | "flat" | "down";
}

export interface Persona {
  id: PersonaId;
  /** Display name of the human in this persona */
  displayName: string;
  /** Their role label in the demo business */
  roleLabel: string;
  /** The business (or businesses) they're attached to */
  businessName: string;
  /** Aurora-aligned accent colour for their door + ambience */
  accent: PersonaAccent;
  /** SF-symbol-ish lucide icon name (rendered by the showcase) */
  iconName:
    | "Sparkles"
    | "LayoutDashboard"
    | "ShieldCheck"
    | "Sun"
    | "Leaf"
    | "Headphones"
    | "Heart";
  /** One-line teaser shown on the launcher card */
  tease: string;
  /** First-frame welcome line on their showcase */
  welcomeLine: string;
  /** Italic continuation under the welcome line */
  welcomeSub: string;
  /** Their ritual — the one job they came here to do */
  ritualLine: string;
  /** Live-feeling alert that fires on their surface */
  alertText: string;
  alertKind: "ai" | "human" | "system" | "money" | "deposit";
  /** The "native moment" mock — Live-Activity-style card title */
  nativeMomentTitle: string;
  nativeMomentBody: string;
  nativeMomentKind: "live-activity" | "widget" | "push" | "biometric" | "haptic" | "share";
}

// ----------------------- shared seed data --------------------------

/** Three demo businesses the org admin oversees, used by the org-admin persona only. */
export const ORG_ADMIN_SHOPS: PersonaShop[] = [
  {
    id: "shop-dublin",
    name: "Aoife & Co. — Dublin",
    city: "Dublin 2, IE",
    todayBookings: 18,
    todayRevenueEur: 1240,
    utilisationPct: 86,
    staffOnShift: 4,
    pendingCount: 1,
    trend: "up",
  },
  {
    id: "shop-cork",
    name: "Aoife & Co. — Cork",
    city: "Cork City, IE",
    todayBookings: 12,
    todayRevenueEur: 880,
    utilisationPct: 71,
    staffOnShift: 3,
    pendingCount: 3,
    trend: "flat",
  },
  {
    id: "shop-galway",
    name: "Aoife & Co. — Galway",
    city: "Galway, IE",
    todayBookings: 9,
    todayRevenueEur: 540,
    utilisationPct: 58,
    staffOnShift: 2,
    pendingCount: 0,
    trend: "down",
  },
];

/** Owner's own business — shared with Manager + Receptionist personas. */
export const OWNER_TODAY: PersonaBooking[] = [
  { id: "b1",  time: "09:00", durationMin: 45, customer: "Niamh O'Reilly",   service: "Cut & Style",      staff: "Lara",  status: "COMPLETED", tipEur: 8 },
  { id: "b2",  time: "09:45", durationMin: 60, customer: "Pádraig Murphy",   service: "Skin Fade + Beard",staff: "Ciarán",status: "COMPLETED", tipEur: 5 },
  { id: "b3",  time: "10:30", durationMin: 90, customer: "Sinéad Walsh",     service: "Balayage",         staff: "Lara",  status: "CONFIRMED" },
  { id: "b4",  time: "11:00", durationMin: 30, customer: "Rónán Byrne",      service: "Trim",             staff: "Ciarán",status: "CONFIRMED" },
  { id: "b5",  time: "12:00", durationMin: 60, customer: "Aoibhinn Daly",    service: "Colour Refresh",   staff: "Maeve", status: "PENDING"   },
  { id: "b6",  time: "13:30", durationMin: 45, customer: "Eoin Kelleher",    service: "Cut & Style",      staff: "Lara",  status: "CONFIRMED" },
  { id: "b7",  time: "14:30", durationMin: 75, customer: "Saoirse Doherty",  service: "Cut & Highlights", staff: "Maeve", status: "CONFIRMED" },
  { id: "b8",  time: "15:30", durationMin: 30, customer: "Conor Hennessy",   service: "Hot Towel Shave",  staff: "Ciarán",status: "PENDING"   },
  { id: "b9",  time: "16:15", durationMin: 60, customer: "Caoimhe Lynch",    service: "Cut & Style",      staff: "Lara",  status: "CONFIRMED" },
];

/** Senior STAFF (Lara) — only her own bookings, with tips. */
export const STAFF_SENIOR_TODAY: PersonaBooking[] = OWNER_TODAY.filter(
  (b) => b.staff === "Lara"
);

/** Junior STAFF (new hire on a quiet Tuesday). */
export const STAFF_JUNIOR_TODAY: PersonaBooking[] = [
  { id: "j1", time: "11:30", durationMin: 30, customer: "Walk-in", service: "Trim", staff: "Tomás", status: "COMPLETED", tipEur: 3 },
  { id: "j2", time: "15:00", durationMin: 45, customer: "Rachel Quinn", service: "Cut & Blow-dry", staff: "Tomás", status: "CONFIRMED" },
];

// --------------------- the seven personas --------------------------

export const PERSONAS: Persona[] = [
  {
    id: "org_admin",
    displayName: "Aoife Brennan",
    roleLabel: "Org admin · 3 locations",
    businessName: "Aoife & Co. (Dublin · Cork · Galway)",
    accent: "champagne",
    iconName: "Sparkles",
    tease: "Three locations before the first coffee. One glance.",
    welcomeLine: "Good morning, Aoife.",
    welcomeSub: "Three rooms, one quiet read.",
    ritualLine: "The morning glance — what's healthy, what needs a hand.",
    alertText: "Cork is light today (71% util). Liv suggests opening two 18:00 walk-in slots.",
    alertKind: "ai",
    nativeMomentTitle: "Daily glance · 7:42 AM",
    nativeMomentBody: "Live Activity surfaced your three-shop digest before you opened the app.",
    nativeMomentKind: "live-activity",
  },
  {
    id: "owner",
    displayName: "Sarah Kavanagh",
    roleLabel: "Single-shop owner",
    businessName: "Sarah's Hair Studio · Dublin 6",
    accent: "cyan",
    iconName: "LayoutDashboard",
    tease: "The cockpit. Your day, alive in one screen.",
    welcomeLine: "Today's flight plan, Sarah.",
    welcomeSub: "Nine bookings · two waiting on you.",
    ritualLine: "Confirm what's pending. Watch the timeline. Trust Liv with the rest.",
    alertText: "Liv just confirmed a 14:30 colour for Saoirse — replied in 18 seconds at 2:14 AM.",
    alertKind: "ai",
    nativeMomentTitle: "Cockpit widget · home screen",
    nativeMomentBody: "Today's bookings, pending count, and Liv's overnight wins, glanceable at a thumb-press.",
    nativeMomentKind: "widget",
  },
  {
    id: "manager",
    displayName: "Áine Connolly",
    roleLabel: "Manager · ADMIN",
    businessName: "Sarah's Hair Studio · Dublin 6",
    accent: "violet",
    iconName: "ShieldCheck",
    tease: "Approvals queue. No money, just judgement calls.",
    welcomeLine: "Three things need your eye, Áine.",
    welcomeSub: "Sarah's away — you're the steady hand today.",
    ritualLine: "Approvals first. Exceptions second. Money never reaches you.",
    alertText: "A new hire request from Tomás needs a sign-off — same shift two weeks running.",
    alertKind: "human",
    nativeMomentTitle: "Push · 'Áine, decision needed'",
    nativeMomentBody: "Approvals reach you the moment they're raised — never an open browser tab away.",
    nativeMomentKind: "push",
  },
  {
    id: "staff-senior",
    displayName: "Lara McCarthy",
    roleLabel: "Senior stylist",
    businessName: "Sarah's Hair Studio · Dublin 6",
    accent: "mint",
    iconName: "Sun",
    tease: "Your day. Just yours. Countdown to the next chair.",
    welcomeLine: "Hey Lara — next up at 10:30.",
    welcomeSub: "Sinéad's balayage, your favourite kind of morning.",
    ritualLine: "One countdown. One chair. One person at a time.",
    alertText: "Sinéad confirmed her 10:30. She mentioned her wedding is Saturday — small note saved.",
    alertKind: "human",
    nativeMomentTitle: "Live Activity · countdown",
    nativeMomentBody: "Your Lock Screen knows when Sinéad's chair starts — no app to open, no clock to check.",
    nativeMomentKind: "live-activity",
  },
  {
    id: "staff-junior",
    displayName: "Tomás Ó Briain",
    roleLabel: "Junior stylist · week 3",
    businessName: "Sarah's Hair Studio · Dublin 6",
    accent: "amber",
    iconName: "Leaf",
    tease: "Quiet Tuesday. We've got you — walk-ins on the way.",
    welcomeLine: "It's quiet, Tomás. That's normal in week three.",
    welcomeSub: "Two booked. Liv is opening walk-in windows behind the scenes.",
    ritualLine: "Take a breath. Watch the door. Liv will call you.",
    alertText: "A walk-in just tapped your link from Google Maps — 4 minutes away.",
    alertKind: "system",
    nativeMomentTitle: "Haptic tap · 'Walk-in incoming'",
    nativeMomentBody: "A gentle pulse on your wrist when the door's about to open. No alarm, no anxiety.",
    nativeMomentKind: "haptic",
  },
  {
    id: "receptionist",
    displayName: "Bríd Murphy",
    roleLabel: "Front desk",
    businessName: "Sarah's Hair Studio · Dublin 6",
    accent: "indigo",
    iconName: "Headphones",
    tease: "The desk view. Every chair, every staff, one wall.",
    welcomeLine: "The wall, Bríd.",
    welcomeSub: "Four staff, nine appointments, one Aoibhinn waiting on a callback.",
    ritualLine: "Watch the wall. Take the call. Move the pin.",
    alertText: "Aoibhinn (12:00) called — running 10 minutes late. Suggest pushing to 12:15?",
    alertKind: "human",
    nativeMomentTitle: "Tablet mode · landscape calendar",
    nativeMomentBody: "Drag a chair to a new staff member. The colour-coded grid never lies.",
    nativeMomentKind: "share",
  },
  {
    id: "customer",
    displayName: "Sinéad Walsh",
    roleLabel: "Customer · regular since 2024",
    businessName: "Sarah's Hair Studio · Dublin 6",
    accent: "rose",
    iconName: "Heart",
    tease: "What your customer sees. Booking page, confirmation, reminder.",
    welcomeLine: "Your appointment is at 10:30, Sinéad.",
    welcomeSub: "Lara's chair, as always. The kettle's on at 10:25.",
    ritualLine: "One link. One tap. One reminder when it matters.",
    alertText: "Sarah just sent you a small note: 'Bringing the lavender tea you liked last time.'",
    alertKind: "human",
    nativeMomentTitle: "Apple Wallet · 'Pass added'",
    nativeMomentBody: "Your booking sits in Wallet next to your boarding passes. The reminder is the lock screen.",
    nativeMomentKind: "share",
  },
];

export function getPersona(id: string): Persona | undefined {
  return PERSONAS.find((p) => p.id === id);
}

export function nextPersona(id: PersonaId): Persona {
  const i = PERSONAS.findIndex((p) => p.id === id);
  return PERSONAS[(i + 1) % PERSONAS.length];
}

export function prevPersona(id: PersonaId): Persona {
  const i = PERSONAS.findIndex((p) => p.id === id);
  return PERSONAS[(i - 1 + PERSONAS.length) % PERSONAS.length];
}

/** Tailwind class fragments per accent so showcases stay consistent. */
export const ACCENT_CLASSES: Record<PersonaAccent, {
  text: string; bg: string; border: string; ring: string; gradFrom: string; gradTo: string;
}> = {
  violet:    { text: "text-[#a78bfa]", bg: "bg-[#8b5cf6]/15",  border: "border-[#8b5cf6]/40",  ring: "ring-[#8b5cf6]/40",  gradFrom: "from-[#8b5cf6]/30", gradTo: "to-[#06b6d4]/10" },
  cyan:      { text: "text-[#22d3ee]", bg: "bg-[#06b6d4]/15",  border: "border-[#06b6d4]/40",  ring: "ring-[#06b6d4]/40",  gradFrom: "from-[#06b6d4]/30", gradTo: "to-[#10b981]/10" },
  mint:      { text: "text-[#34d399]", bg: "bg-[#10b981]/15",  border: "border-[#10b981]/40",  ring: "ring-[#10b981]/40",  gradFrom: "from-[#10b981]/30", gradTo: "to-[#06b6d4]/10" },
  champagne: { text: "text-[#d9c39a]", bg: "bg-[#d9c39a]/15",  border: "border-[#d9c39a]/40",  ring: "ring-[#d9c39a]/40",  gradFrom: "from-[#d9c39a]/30", gradTo: "to-[#8a7549]/10" },
  amber:     { text: "text-[#fbbf24]", bg: "bg-[#f59e0b]/15",  border: "border-[#f59e0b]/40",  ring: "ring-[#f59e0b]/40",  gradFrom: "from-[#f59e0b]/30", gradTo: "to-[#d9c39a]/10" },
  rose:      { text: "text-[#fb7185]", bg: "bg-[#f43f5e]/15",  border: "border-[#f43f5e]/40",  ring: "ring-[#f43f5e]/40",  gradFrom: "from-[#f43f5e]/30", gradTo: "to-[#8b5cf6]/10" },
  indigo:    { text: "text-[#818cf8]", bg: "bg-[#6366f1]/15",  border: "border-[#6366f1]/40",  ring: "ring-[#6366f1]/40",  gradFrom: "from-[#6366f1]/30", gradTo: "to-[#06b6d4]/10" },
};
