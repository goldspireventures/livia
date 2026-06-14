/**
 * Demo inbox thread specs — policy hub (not inline in api-server seed).
 */
import { livPendingBookingAssistCopy } from "./liv-platform-program";

export type DemoInboxThreadSpec = {
  customerIdx?: number;
  anonymous?: boolean;
  channel: "WEB" | "SMS" | "EMAIL" | "VOICE";
  status: "OPEN" | "HANDED_OFF" | "CLOSED";
  aiHandled: boolean;
  name: string;
  phone: string;
  email: string;
  summary: string;
  linkedBookingKey?: string;
  caseIntent?: string;
  messages: Array<{ role: "USER" | "ASSISTANT"; content: string; minsAgo: number }>;
};

const SALON_THREADS: DemoInboxThreadSpec[] = [
  {
    customerIdx: 0,
    channel: "SMS",
    status: "OPEN",
    aiHandled: true,
    name: "Mary McNamara",
    phone: "+353 87 100 0001",
    email: "mary.m@email.ie",
    summary: "Balayage reschedule — Liv proposed Tuesday 2pm with Lara.",
    linkedBookingKey: "mary_balayage",
    caseIntent: "reschedule",
    messages: [
      { role: "USER", content: "Hi, can I move my colour to next week? Tuesdays work best.", minsAgo: 42 },
      {
        role: "ASSISTANT",
        content:
          "Mary — I can offer Tuesday at 2:00pm with Lara for Full Colour (€120). Reply YES to confirm or tell me another day.",
        minsAgo: 40,
      },
      { role: "USER", content: "Tuesday 2 is perfect, thanks!", minsAgo: 8 },
    ],
  },
  {
    customerIdx: 1,
    channel: "WEB",
    status: "HANDED_OFF",
    aiHandled: false,
    name: "Sean Kelly",
    phone: "+353 87 100 0002",
    email: "sean.k@email.ie",
    summary: "Refund request €60 — needs manager sign-off (late cancellation).",
    linkedBookingKey: "sean_today",
    caseIntent: "refund_request",
    messages: [
      { role: "USER", content: "I had to cancel last minute because of work — can I get the deposit back?", minsAgo: 180 },
      {
        role: "ASSISTANT",
        content:
          "I'm sorry that happened, Sean. Refunds over €50 need a manager sign-off — I've flagged this for Niamh.",
        minsAgo: 175,
      },
    ],
  },
  {
    customerIdx: 2,
    channel: "SMS",
    status: "OPEN",
    aiHandled: true,
    name: "Orla Murphy",
    phone: "+353 87 100 0003",
    email: "orla.m@email.ie",
    summary: "New client — booked Cut & Finish Saturday via Liv.",
    messages: [
      { role: "USER", content: "Do you have anything Saturday morning?", minsAgo: 25 },
      {
        role: "ASSISTANT",
        content: "Yes — Saturday 10:30 with James for Cut & Finish (€65). I've held it for 15 minutes.",
        minsAgo: 23,
      },
    ],
  },
  {
    customerIdx: 0,
    channel: "EMAIL",
    status: "CLOSED",
    aiHandled: true,
    name: "Mary McNamara",
    phone: "+353 87 100 0001",
    email: "mary.m@email.ie",
    summary: "Confirmed — reminder scheduled.",
    messages: [
      { role: "USER", content: "Please confirm my appointment for tomorrow.", minsAgo: 1440 },
      { role: "ASSISTANT", content: "You're confirmed tomorrow at 10:00 with Lara. We'll text you a reminder.", minsAgo: 1430 },
    ],
  },
  {
    customerIdx: 3,
    channel: "WEB",
    status: "OPEN",
    aiHandled: true,
    name: "Cian Walsh",
    phone: "+353 87 100 0004",
    email: "cian.w@email.ie",
    summary: "Asking about colour-safe products post-appointment.",
    messages: [
      { role: "USER", content: "What shampoo should I use after the colour you booked me for?", minsAgo: 15 },
      {
        role: "ASSISTANT",
        content:
          "Sulphate-free shampoo for the first 48 hours — your stylist left notes in your booking. Want me to add a care kit to your visit?",
        minsAgo: 12,
      },
    ],
  },
  {
    anonymous: true,
    channel: "VOICE",
    status: "OPEN",
    aiHandled: true,
    name: "Unknown caller",
    phone: "+353 87 199 8822",
    email: "",
    summary: "Missed call — Liv texted back with tomorrow 11:00 hold.",
    messages: [
      { role: "USER", content: "Missed your call — still want a cut tomorrow if possible", minsAgo: 5 },
      {
        role: "ASSISTANT",
        content: "We have tomorrow 11:00 with James — reply YES to lock it in.",
        minsAgo: 3,
      },
    ],
  },
];

const ALLIED_HEALTH_THREADS: DemoInboxThreadSpec[] = [
  {
    customerIdx: 0,
    channel: "SMS",
    status: "OPEN",
    aiHandled: true,
    name: "Mary McNamara",
    phone: "+353 87 100 0001",
    email: "mary.m@email.ie",
    summary: "Follow-up session reschedule — Liv offered Thursday 10am with Eoin.",
    messages: [
      { role: "USER", content: "Can I move my physio to Thursday morning?", minsAgo: 42 },
      {
        role: "ASSISTANT",
        content:
          "Mary — Thursday 10:00 for Follow-up session (€45) with Eoin is free. Reply YES to confirm.",
        minsAgo: 40,
      },
      { role: "USER", content: "Yes please", minsAgo: 8 },
    ],
  },
  {
    customerIdx: 1,
    channel: "WEB",
    status: "HANDED_OFF",
    aiHandled: false,
    name: "Sean Kelly",
    phone: "+353 87 100 0002",
    email: "sean.k@email.ie",
    summary: "GP referral letter — clinician review before booking assessment.",
    messages: [
      { role: "USER", content: "I have a referral from my GP — do you need it before I book?", minsAgo: 180 },
      {
        role: "ASSISTANT",
        content: "Yes please — I've flagged this for your clinician to review before we confirm assessment.",
        minsAgo: 175,
      },
    ],
  },
  {
    customerIdx: 2,
    channel: "SMS",
    status: "OPEN",
    aiHandled: true,
    name: "Orla Murphy",
    phone: "+353 87 100 0003",
    email: "orla.m@email.ie",
    summary: "New patient — initial assessment booked Saturday via Liv.",
    messages: [
      { role: "USER", content: "First time — anything Saturday?", minsAgo: 25 },
      {
        role: "ASSISTANT",
        content: "Saturday 09:00 Initial assessment (€65) is available — reply YES to hold it.",
        minsAgo: 23,
      },
    ],
  },
  {
    anonymous: true,
    channel: "VOICE",
    status: "OPEN",
    aiHandled: true,
    name: "Unknown caller",
    phone: "+353 87 199 8822",
    email: "",
    summary: "Missed call — Liv offered sports massage tomorrow 11am.",
    messages: [
      { role: "USER", content: "Missed your call — still need sports massage tomorrow", minsAgo: 5 },
      { role: "ASSISTANT", content: "Tomorrow 11:00 Sports massage (30 min) — reply YES to confirm.", minsAgo: 3 },
    ],
  },
];

const BODY_ART_THREADS: DemoInboxThreadSpec[] = [
  {
    customerIdx: 0,
    channel: "WEB",
    status: "OPEN",
    aiHandled: true,
    name: "Mary McNamara",
    phone: "+353 87 100 0001",
    email: "mary.m@email.ie",
    summary: "Design proof approval — sleeve consult before session.",
    messages: [
      { role: "USER", content: "Can you check the attached sketch before my session Friday?", minsAgo: 30 },
      {
        role: "ASSISTANT",
        content: "I've sent this to your artist for proof approval — you'll get a yes/no in the thread.",
        minsAgo: 28,
      },
    ],
  },
];

const PET_THREADS: DemoInboxThreadSpec[] = [
  {
    customerIdx: 0,
    channel: "SMS",
    status: "OPEN",
    aiHandled: true,
    name: "Mary McNamara",
    phone: "+353 87 100 0001",
    email: "mary.m@email.ie",
    summary: "Baxter groom — Liv booked full groom next Tuesday.",
    messages: [
      { role: "USER", content: "Need a full groom for Baxter (cocker spaniel) next week", minsAgo: 20 },
      {
        role: "ASSISTANT",
        content: "Tuesday 10:00 Full groom (€55) is open — reply YES for Baxter.",
        minsAgo: 18,
      },
    ],
  },
];

const FITNESS_THREADS: DemoInboxThreadSpec[] = [
  {
    customerIdx: 1,
    channel: "SMS",
    status: "OPEN",
    aiHandled: true,
    name: "Sean Kelly",
    phone: "+353 87 100 0002",
    email: "sean.k@email.ie",
    summary: "PT pack — Liv held intro assessment Saturday.",
    messages: [
      { role: "USER", content: "Still have sessions left on my 10-pack?", minsAgo: 35 },
      {
        role: "ASSISTANT",
        content: "You have 3 sessions left. Want Saturday 09:00 intro assessment or a PT slot?",
        minsAgo: 33,
      },
    ],
  },
];

const EVENT_VENDOR_THREADS: DemoInboxThreadSpec[] = [
  {
    channel: "SMS",
    status: "CLOSED",
    aiHandled: true,
    name: "Sarah Murphy",
    phone: "+353871234567",
    email: "sarah.murphy@example.com",
    summary: "Birthday quote sent — Sarah asked if blush & gold setup fits €500–€1,000.",
    caseIntent: "quote_follow_up",
    messages: [
      {
        role: "USER",
        content: "Got the quote — can we tweak the centrepieces if we drop one balloon garland?",
        minsAgo: 22,
      },
      {
        role: "ASSISTANT",
        content:
          "Absolutely — I'll ask the studio to revise the line items and resend. Your 15 Sept date is still held pending deposit.",
        minsAgo: 19,
      },
    ],
  },
  {
    channel: "WEB",
    status: "CLOSED",
    aiHandled: false,
    name: "Sarah Murphy",
    phone: "+353871234567",
    email: "sarah.murphy@example.com",
    summary: "Also enquired via website — same birthday celebration.",
    messages: [
      {
        role: "USER",
        content: "Submitted the enquire form for 15 Sept — blush & gold, 40 guests.",
        minsAgo: 45,
      },
    ],
  },
  {
    channel: "WEB",
    status: "HANDED_OFF",
    aiHandled: false,
    name: "Aoife Brennan",
    phone: "+353 87 100 0001",
    email: "aoife.b@email.ie",
    summary: "October wedding at Carton House — wants draping quote after a call.",
    messages: [
      {
        role: "USER",
        content: "Hi! We're getting married in October and need ceremony draping plus aisle decor.",
        minsAgo: 120,
      },
      {
        role: "ASSISTANT",
        content: "Congratulations! Share your guest count and venue and I'll draft a quote.",
        minsAgo: 118,
      },
      { role: "USER", content: "About 120 at Carton House — can someone call me this week?", minsAgo: 90 },
    ],
  },
  {
    channel: "SMS",
    status: "CLOSED",
    aiHandled: true,
    name: "Patrick O'Neill",
    phone: "+353 87 100 0004",
    email: "patrick.oneill@example.com",
    summary: "Christening balloon arch — Liv sent enquire link for 28 June.",
    messages: [
      { role: "USER", content: "Do you do balloon arches for christenings in Wicklow?", minsAgo: 14 },
      {
        role: "ASSISTANT",
        content:
          "We do — fill in the enquire form with your church & reception venues and I'll draft a quote same day.",
        minsAgo: 11,
      },
    ],
  },
  {
    anonymous: true,
    channel: "VOICE",
    status: "CLOSED",
    aiHandled: true,
    name: "Unknown caller",
    phone: "+353 87 199 8822",
    email: "",
    summary: "Missed call — Liv texted back with enquire link for a 40th birthday.",
    messages: [
      { role: "USER", content: "Missed your call about styling for a 40th in Dun Laoghaire", minsAgo: 8 },
      {
        role: "ASSISTANT",
        content: "No worries — use our enquire form with your date and theme. I'll follow up once it's in.",
        minsAgo: 5,
      },
    ],
  },
];

const MEDSPA_THREADS: DemoInboxThreadSpec[] = [
  {
    customerIdx: 0,
    channel: "SMS",
    status: "OPEN",
    aiHandled: true,
    name: "Mary McNamara",
    phone: "+353 87 100 0001",
    email: "mary.m@email.ie",
    summary: "Botox follow-up — Liv proposed review Tuesday 2pm.",
    messages: [
      { role: "USER", content: "When should I come back for review after treatment?", minsAgo: 42 },
      {
        role: "ASSISTANT",
        content: "Tuesday 2:00pm review slot is available. Reply YES to confirm.",
        minsAgo: 40,
      },
    ],
  },
];


export function getDemoInboxThreadsForVertical(vertical?: string): DemoInboxThreadSpec[] {
  if (vertical === "event-vendors") return EVENT_VENDOR_THREADS;
  if (vertical === "allied-health") return ALLIED_HEALTH_THREADS;
  if (vertical === "medspa") return MEDSPA_THREADS;
  if (vertical === "body-art") return BODY_ART_THREADS;
  if (vertical === "pet-grooming") return PET_THREADS;
  if (vertical === "fitness") return FITNESS_THREADS;
  if (vertical === "beauty" || vertical === "wellness") return SALON_THREADS;
  return SALON_THREADS;
}

export function demoPendingBookingInboxThread(summary: string): DemoInboxThreadSpec {
  return {
    customerIdx: 2,
    channel: "WEB",
    status: "OPEN",
    aiHandled: true,
    name: "Orla Murphy",
    phone: "",
    email: "",
    summary,
    messages: [
      { role: "USER", content: "Can I add a blow-dry to my colour appointment?", minsAgo: 2 },
      {
        role: "ASSISTANT",
        content: livPendingBookingAssistCopy("Blow-Dry after your colour"),
        minsAgo: 1,
      },
    ],
  };
}
