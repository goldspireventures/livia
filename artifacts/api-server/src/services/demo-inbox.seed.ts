import {
  db,
  bookingsTable,
  conversationsTable,
  conversationMessagesTable,
} from "@workspace/db";

type BookingStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
import { generateId } from "../lib/id";

type CustomerRow = { id: string; displayName: string; email: string; phone: string };

function ago(minutes: number): Date {
  return new Date(Date.now() - minutes * 60_000);
}

type InboxThread = {
  customerIdx: number;
  channel: "WEB" | "SMS" | "EMAIL";
  status: "OPEN" | "HANDED_OFF" | "CLOSED";
  aiHandled: boolean;
  name: string;
  phone: string;
  email: string;
  summary: string;
  /** Key from seedExpandedBookings return map */
  linkedBookingKey?: string;
  caseIntent?: string;
  messages: Array<{ role: "USER" | "ASSISTANT"; content: string; minsAgo: number }>;
};

const SALON_THREADS: InboxThread[] = [
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
    customerIdx: 1,
    channel: "SMS",
    status: "OPEN",
    aiHandled: true,
    name: "Walk-in (unknown)",
    phone: "+353 87 199 8822",
    email: "walkin@email.ie",
    summary: "Incoming call missed — Liv rebooked for tomorrow 11am.",
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

const ALLIED_HEALTH_THREADS: InboxThread[] = [
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
    customerIdx: 0,
    channel: "SMS",
    status: "OPEN",
    aiHandled: true,
    name: "Walk-in (unknown)",
    phone: "+353 87 199 8822",
    email: "walkin@email.ie",
    summary: "Missed call — Liv offered sports massage tomorrow 11am.",
    messages: [
      { role: "USER", content: "Missed your call — still need sports massage tomorrow", minsAgo: 5 },
      { role: "ASSISTANT", content: "Tomorrow 11:00 Sports massage (30 min) — reply YES to confirm.", minsAgo: 3 },
    ],
  },
];

const BODY_ART_THREADS: InboxThread[] = [
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

const PET_THREADS: InboxThread[] = [
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

const FITNESS_THREADS: InboxThread[] = [
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

const MEDSPA_THREADS: InboxThread[] = [
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

function threadsForVertical(vertical?: string): InboxThread[] {
  if (vertical === "allied-health") return ALLIED_HEALTH_THREADS;
  if (vertical === "medspa") return MEDSPA_THREADS;
  if (vertical === "body-art") return BODY_ART_THREADS;
  if (vertical === "pet-grooming") return PET_THREADS;
  if (vertical === "fitness") return FITNESS_THREADS;
  if (vertical === "beauty" || vertical === "wellness") return SALON_THREADS;
  return SALON_THREADS;
}

/** Manager queue always has threads — copy matches business vertical when provided. */
export async function seedDemoInbox(
  businessId: string,
  customers: CustomerRow[],
  opts?: { pendingBookingNotes?: string; vertical?: string; bookingKeys?: Record<string, string> },
) {
  const threads: InboxThread[] = threadsForVertical(opts?.vertical).map((t) => ({
    ...t,
    phone: customers[t.customerIdx]?.phone ?? t.phone,
    email: customers[t.customerIdx]?.email ?? t.email,
  }));

  if (opts?.pendingBookingNotes) {
    threads.push({
      customerIdx: 2,
      channel: "WEB",
      status: "OPEN",
      aiHandled: true,
      name: "Orla Murphy",
      phone: customers[2]?.phone ?? "",
      email: customers[2]?.email ?? "",
      summary: opts.pendingBookingNotes,
      messages: [
        { role: "USER", content: "Can I add a blow-dry to my colour appointment?", minsAgo: 2 },
        { role: "ASSISTANT", content: "I've added Blow-Dry after your colour — pending team confirm.", minsAgo: 1 },
      ],
    });
  }

  for (const t of threads) {
    const cid = customers[t.customerIdx]?.id ?? customers[0]?.id;
    const linkedBookingId =
      t.linkedBookingKey && opts?.bookingKeys?.[t.linkedBookingKey]
        ? opts.bookingKeys[t.linkedBookingKey]
        : null;
    const convId = generateId();
    const lastAt = ago(Math.min(...t.messages.map((m) => m.minsAgo)));
    await db.insert(conversationsTable).values({
      id: convId,
      businessId,
      customerId: cid,
      channel: t.channel,
      status: t.status,
      customerName: t.name,
      customerEmail: t.email,
      customerPhone: t.phone,
      aiHandled: t.aiHandled,
      summary: t.summary,
      linkedBookingId,
      caseIntent: t.caseIntent ?? null,
      lastMessageAt: lastAt,
    });
    for (const m of t.messages) {
      await db.insert(conversationMessagesTable).values({
        id: generateId(),
        conversationId: convId,
        role: m.role,
        content: m.content,
        bookingId: linkedBookingId,
        createdAt: ago(m.minsAgo),
      });
    }
  }
}

function nextWeekdayAt(base: Date, weekday: number, hour: number, minute = 0): Date {
  const d = new Date(base);
  d.setHours(hour, minute, 0, 0);
  let delta = (weekday - d.getDay() + 7) % 7;
  if (delta === 0 && d.getTime() <= base.getTime()) delta = 7;
  d.setDate(d.getDate() + delta);
  return d;
}

export async function seedExpandedBookings(
  businessId: string,
  customers: CustomerRow[],
  staffIds: string[],
  serviceIds: string[],
  base: Date,
): Promise<Record<string, string>> {
  const keys: Record<string, string> = {};
  const makeDt = (daysOffset: number, hour: number) => {
    const t = new Date(base);
    t.setDate(t.getDate() + daysOffset);
    t.setHours(hour, 0, 0, 0);
    return t;
  };
  const maryTuesday = nextWeekdayAt(base, 2, 14);
  const maryTuesdayEnd = new Date(maryTuesday.getTime() + 150 * 60_000);
  const defs: Array<{
    key?: string;
    ci: number;
    si: number;
    vi: number;
    status: BookingStatus;
    start: Date;
    end: Date;
    notes?: string;
  }> = [
    {
      key: "mary_pending",
      ci: 0,
      si: 0,
      vi: 0,
      status: "PENDING",
      start: makeDt(0, 16),
      end: new Date(makeDt(0, 16).getTime() + 60 * 60_000),
      notes: "Colour consult — manager to confirm",
    },
    {
      key: "sean_today",
      ci: 1,
      si: 1,
      vi: 1,
      status: "CONFIRMED",
      start: makeDt(0, 11),
      end: new Date(makeDt(0, 11).getTime() + 60 * 60_000),
      notes: "Deposit €60 — Sean requested late cancel",
    },
    {
      key: "mary_balayage",
      ci: 0,
      si: 0,
      vi: 2,
      status: "CONFIRMED",
      start: maryTuesday,
      end: maryTuesdayEnd,
      notes: "Balayage — rescheduled to Tuesday 2pm via Liv",
    },
    { ci: 2, si: 0, vi: 0, status: "CONFIRMED", start: makeDt(1, 9), end: new Date(makeDt(1, 9).getTime() + 60 * 60_000) },
    { ci: 3, si: 1, vi: 0, status: "PENDING", start: makeDt(1, 15), end: new Date(makeDt(1, 15).getTime() + 60 * 60_000) },
    { ci: 0, si: 0, vi: 1, status: "CONFIRMED", start: makeDt(2, 10), end: new Date(makeDt(2, 10).getTime() + 60 * 60_000) },
    { ci: 1, si: 0, vi: 0, status: "COMPLETED", start: makeDt(-1, 14), end: new Date(makeDt(-1, 14).getTime() + 60 * 60_000) },
    { ci: 2, si: 1, vi: 0, status: "COMPLETED", start: makeDt(-2, 11), end: new Date(makeDt(-2, 11).getTime() + 60 * 60_000) },
  ];
  await db.insert(bookingsTable).values(
    defs.map((b) => {
      const id = generateId();
      if (b.key) keys[b.key] = id;
      const serviceId =
        serviceIds[Math.min(b.vi, Math.max(0, serviceIds.length - 1))] ??
        serviceIds[0];
      return {
        id,
        businessId,
        customerId: customers[b.ci].id,
        staffId: staffIds[b.si],
        serviceId,
        status: b.status,
        startAt: b.start,
        endAt: b.end,
        notes: b.notes ?? null,
        channelType: "WEB" as const,
        depositPaidEurCents: b.key === "sean_today" ? 6000 : 0,
      };
    }),
  );
  return keys;
}
