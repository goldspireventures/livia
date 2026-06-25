/**
 * Editorial home copy — EN + DE. Single source for livia.io human-crafted surfaces.
 */
import { marketingSoloFloorPrice } from "@/lib/pricing-catalog";
export type MarketingLocale = "en" | "de";

export type HomeConstellationCopy = {
  headline1: string;
  headline2: string;
  subhead: string;
  getStarted: string;
  bookDemo: string;
  howItWorks: string;
  joinBeta: string;
};

export type HomeOsCopy = {
  eyebrow: string;
  headline: [string, string];
  headlineAccent: string;
  subhead: string;
  livIntro: string;
  seeDemo: string;
  howItWorks: string;
  joinBeta: string;
  convergenceLabel: string;
  channels: { short: string; label: string }[];
  physicsTitle: string;
  physicsSubtitle: string;
  physics: { title: string; body: string }[];
  livBand: {
    title: string;
    body: string;
    bullets: string[];
    panelLabel: string;
    panelLines: { text: string; muted?: boolean }[];
  };
};

export type HomeFoldCopy = {
  physicsEyebrow: string;
  physicsHeadline: string;
  livLine: string;
  pricingFrom: string;
  verticalsEyebrow: string;
  verticalsHeadline: string;
  verticalsSub: string;
  faqMore: string;
};

export type ProductShowcaseCopy = {
  eyebrow: string;
  title: string;
  titleAccent: string;
  subtitle: string;
  webLabel: string;
  mobileLabel: string;
  bookingLabel: string;
  webAlt: string;
  mobileAlt: string;
  bookingAlt: string;
};

export type EditorialCopy = {
  nav: {
    getStarted: string;
    seeDemo: string;
    pricing: string;
    howItWorks: string;
    joinBeta: string;
    tryBeta: string;
    product: string;
    solutions: string;
    resources: string;
    about: string;
    menu: string;
    english: string;
    deutsch: string;
    closeMenu: string;
  };
  hero: {
    eyebrow: string;
    headline: [string, string, string];
    livLine: string;
    body: string;
    regions: string;
    meetLiv: string;
    howItWorks: string;
    photoAlt: string;
    photoCaption: string;
  };
  homeConstellation: HomeConstellationCopy;
  homeFold: HomeFoldCopy;
  productShowcase: ProductShowcaseCopy;
  homeOs: HomeOsCopy;
  homeTrust: { label: string; value: string }[];
  homeFeatures: { title: string; body: string }[];
  homeMarkets: {
    title: string;
    subtitle: string;
    cities: { place: string; note: string }[];
  };
  faqIntro: string;
  proof: {
    statHead: string;
    statBody: string;
    cohort: string;
    quote: string;
    quoteAttribution: string;
    briefingLabel: string;
    briefingItems: [string, string, string];
    tags: [string, string, string];
  };
  story: {
    chapter1: string;
    inboxTitle: string;
    inboxBody: string;
    smsTime: string;
    smsCustomer: string;
    smsLiv: string;
    livReplied: string;
    chapter2: string;
    creamTitle: string;
    creamBody: string;
    creamAside: string;
    chapter3: string;
    cockpitTitle: string;
    cockpitLabel: string;
    cockpitBody: string;
    cockpitNote: string;
    trustIntro: string;
    trustTitle: string;
    trustSteps: { when: string; what: string }[];
  };
  pricing: {
    title: string;
    subtitle: string;
    morePlans: string;
    fullPricing: string;
    compareAll: string;
    mostStudios: string;
    soloFeatures: string[];
    studioFeatures: string[];
  };
  faq: {
    title: string;
    items: { q: string; a: string }[];
  };
  founder: {
    quote: string;
    attribution: string;
    ctaTitle: string;
    ctaSubtitle: string;
  };
  form: {
    placeholder: string;
    submit: string;
    success: string;
    error: string;
  };
  bookDemoPage: {
    eyebrow: string;
    titleLead: string;
    titleAccent: string;
    subtitle: string;
    steps: [string, string, string];
    invitedPrompt: string;
    invitedLink: string;
  };
  formDemo: {
    submit: string;
    pending: string;
    success: string;
  };
  deContact?: {
    title: string;
    body: string;
    cta: string;
    mailSubject: string;
  };
};

const EN: EditorialCopy = {
  nav: {
    getStarted: "Get started",
    seeDemo: "How it works",
    pricing: "Pricing",
    howItWorks: "How it works",
    joinBeta: "Join beta",
    tryBeta: "Try beta",
    product: "Product",
    solutions: "Solutions",
    resources: "Resources",
    about: "About",
    menu: "Menu",
    english: "English",
    deutsch: "Deutsch",
    closeMenu: "Close",
  },
  hero: {
    eyebrow: "Closed beta",
    headline: ["Appointment businesses", "deserve better", "software."],
    livLine: "Her name is Liv.",
    body: "Calendar, inbox, team, deposits — one place.",
    regions: "Hair · beauty · wellness · barber · tattoo · medspa · pets · physio · fitness · IE · UK · EU",
    meetLiv: "Meet Liv",
    howItWorks: "How it works",
    photoAlt: "European service business interior in quiet morning light",
    photoCaption: "09:14 · London",
  },
  homeConstellation: {
    headline1: "Software for",
    headline2: "appointment businesses.",
    subhead:
      "Your calendar, messages, team, and booking page in one place. Liv picks up when you close for the night.",
    getStarted: "Get started",
    bookDemo: "Book a demo",
    howItWorks: "How it works",
    joinBeta: "Join beta",
  },
  homeFold: {
    physicsEyebrow: "What every shop shares",
    physicsHeadline: "Three things you need to get right.",
    livLine: "Liv replies, books, and sends you a morning summary — your team can jump in any time.",
    pricingFrom: "Chain, Host, and add-ons on the full pricing page.",
    verticalsEyebrow: "Your trade",
    verticalsHeadline: "Pick your trade",
    verticalsSub: "See how Livia fits your work — then create your shop.",
    faqMore: "More answers",
  },
  productShowcase: {
    eyebrow: "The product",
    title: "Your shop,",
    titleAccent: "on screen.",
    subtitle:
      "Livia on desktop and mobile — inbox, owner Today, and the public booking page your clients use.",
    webLabel: "Inbox · web",
    mobileLabel: "Today · mobile",
    bookingLabel: "Booking page",
    webAlt: "Livia inbox on desktop with Mary McNamara's thread open — Liv handling colour reschedule",
    mobileAlt: "Livia Today view on mobile showing the day's appointments",
    bookingAlt: "Livia public booking page branded for a beauty studio",
  },
  homeOs: {
    eyebrow: "Built for your trade",
    headline: ["Messages pile up.", "Time doesn't."],
    headlineAccent: "Livia keeps both in check.",
    subhead:
      "Salons, clinics, studios, groomers — any business that sells time by appointment. One calendar, one inbox, one place for your team.",
    livIntro:
      "<strong>Liv</strong> works inside Livia — replying, booking, and briefing you before the day starts.",
    seeDemo: "Get started",
    howItWorks: "How it works",
    joinBeta: "Join beta",
    convergenceLabel: "Every channel in one inbox",
    channels: [
      { short: "DM", label: "Social" },
      { short: "SMS", label: "Text" },
      { short: "Web", label: "Booking" },
      { short: "Tel", label: "Phone" },
    ],
    physicsTitle: "What every appointment business shares",
    physicsSubtitle: "Hair was our first trade — not our only one. The basics hold whether you run a chair, a room, or a class.",
    physics: [
      { title: "Your calendar", body: "Real slots, buffers, and availability — not a calendar that lies." },
      { title: "Right person, right service", body: "Your rules for who does what, and how long it takes." },
      { title: "Client history", body: "Notes, formulas, plans — so you don't start from zero each visit." },
      { title: "Your policies", body: "Deposits, cancel windows, consent — set once, applied everywhere." },
      { title: "One inbox", body: "SMS, email, and web chat in one thread — tied to your calendar." },
    ],
    livBand: {
      title: "Liv is part of Livia — not a chat widget on the side",
      body: "She works inside your software. Customers know when they're talking to AI. You can take over any conversation.",
      bullets: [
        "Replies in your tone with real slot checks",
        "Books, reminds, and backfills against your rules",
        "Briefs the owner before the day asks",
        "Customers are told they're talking to AI on your booking page and messages",
      ],
      panelLabel: "Tuesday morning · 07:02",
      panelLines: [
        { text: "3 chairs open Thursday — Liv offered the waitlist." },
        { text: "Marie's 2:30 held for a regular." },
        { text: "No deposit disputes this week." },
        { text: "Your team can take over any conversation.", muted: true },
      ],
    },
  },
  homeTrust: [
    { label: "Trades", value: "21+" },
    { label: "Markets", value: "IE · UK · EU" },
    { label: "Policies", value: "Yours" },
    { label: "Product", value: "Inbox + calendar + staff" },
  ],
  homeFeatures: [
    { title: "Inbox", body: "SMS, email, web chat. One conversation history." },
    { title: "Calendar", body: "Real availability. Your rules." },
    { title: "Briefing", body: "The day, before you ask." },
  ],
  homeMarkets: {
    title: "Built for European craft",
    subtitle: "Same platform. Different verticals.",
    cities: [
      { place: "Dublin", note: "Hair · tattoo · medspa" },
      { place: "London", note: "Beauty · wellness" },
      { place: "Berlin", note: "Barber · studio" },
      { place: "Paris", note: "Nails · brows" },
      { place: "Cork", note: "Physio · fitness" },
      { place: "Copenhagen", note: "Wellness" },
    ],
  },
  faqIntro: "Quick answers.",
  proof: {
    statHead: "Sunday night",
    statBody: "back in your hands — not lost to unread messages and half-answered booking requests.",
    cohort: "Design partner cohort · IE & UK · closed beta",
    quote: "I stopped checking Instagram at 10pm.",
    quoteAttribution: "— salon owner, Cork",
    briefingLabel: "Tuesday briefing · 07:02",
    briefingItems: [
      "3 chairs open Thursday — Liv offered waitlist",
      "Marie's 2:30 held for regular",
      "No deposit disputes this week",
    ],
    tags: ["Calendar-first", "Inbox built in", "European calm"],
  },
  story: {
    chapter1: "Chapter one",
    inboxTitle: "The inbox you never quite cleared.",
    inboxBody:
      "Liv replies on SMS, email, and your public booking chat today — one inbox, real availability, and customers are told when they're talking to AI. More inbound channels (e.g. WhatsApp, Instagram) roll out with pilot shops.",
    smsTime: "SMS · 22:41",
    smsCustomer: "Hi — any chance for a colour Thursday? Used to come to Aoife.",
    smsLiv: "— Aoife has 2:30 Thursday. Want me to hold it?",
    livReplied: "Liv replied",
    chapter2: "Chapter two",
    creamTitle: "Liv answered. You slept.",
    creamBody:
      "No-show recovery, waitlist backfill, and deposit-ready scheduling — using rules you set, not templates from someone else's product.",
    creamAside: "Empty chairs hurt on Tuesday. Livia is for the Sunday night before.",
    chapter3: "Chapter three",
    cockpitTitle: "One calm view of the day.",
    cockpitLabel: "Your morning view",
    cockpitBody: "Your day, week, and revenue — without opening three apps before 9am.",
    cockpitNote: "These are real Livia screens — not a stock mock-up.",
    trustIntro: "Liv",
    trustTitle: "She takes on more each month — with you still in control.",
    trustSteps: [
      { when: "Month 1", what: "Answers after-hours messages in your tone." },
      { when: "Month 2", what: "Books from your policies — not generic rules." },
      { when: "Month 3", what: "Knows regulars by name and preference." },
      { when: "Month 6", what: "Runs the morning briefing before you ask." },
      { when: "Month 12", what: "You'd notice if she left." },
    ],
  },
  pricing: {
    title: "Pricing",
    subtitle: "EUR, clear VAT. Closed beta is free.",
    morePlans: "Chain, Host, and add-ons on the",
    fullPricing: "full pricing page",
    compareAll: "Compare all plans",
    mostStudios: "Most studios",
    soloFeatures: [
      "Liv inbox: SMS, email & public chat",
      "Voice receptionist (outcome share, capped)",
      "Public booking + mobile app",
    ],
    studioFeatures: ["Everything in Solo", "Per-seat team tools", "Manager inbox take-over"],
  },
  faq: {
    title: "FAQ",
    items: [
      {
        q: "What is Livia?",
        a: `Software for appointment businesses — your calendar, inbox, team, and booking page in one place. From ${marketingSoloFloorPrice()}/mo at launch; closed beta is free for you.`,
      },
      {
        q: "Who is it for?",
        a: "Anyone whose calendar is revenue. Hair to medspa, pets to physio. Solo shops and small chains.",
      },
      {
        q: "How is this different from Booksy or Fresha?",
        a: "We're not a marketplace and we're not a chatbot you bolt on. It's your software — your calendar, your clients, your rules. Liv works the inbox.",
      },
      {
        q: "What does Liv do?",
        a: "Replies in your tone. Checks real slots. Books. Your team can take over any conversation.",
      },
      {
        q: "When can I get in?",
        a: "Waitlist below. We invite in batches — IE, UK, EU.",
      },
      {
        q: "GDPR and EU AI Act?",
        a: "Built for GDPR. Customers are told when they're talking to AI, as required in the EU. Legal at livia-hq.com/legal.",
      },
      {
        q: "Pricing and VAT?",
        a: "Flat monthly tiers at launch. Beta free. EU VAT ID → reverse charge.",
      },
      {
        q: "How do I apply?",
        a: "Email in the form. We reply when a batch fits.",
      },
    ],
  },
  founder: {
    quote:
      "Better software for businesses that run on appointments. You shouldn't lose revenue because you were working.",
    attribution: "— Livia",
    ctaTitle: "Join the beta",
    ctaSubtitle: "We invite in batches.",
  },
  form: {
    placeholder: "you@yourstudio.ie",
    submit: "Join the waitlist",
    success: "You're on the list. We'll be in touch when a batch opens.",
    error: "Something went wrong. Please try again.",
  },
  bookDemoPage: {
    eyebrow: "Closed beta",
    titleLead: "Book a",
    titleAccent: "demo",
    subtitle:
      "One form opens your personal demo room. Pick your trade, walk a real seeded studio, then sign up when you're ready.",
    steps: [
      "Share your email, trade, and country.",
      "We open your demo room straight away — access lasts seven days.",
      "Pick a trade card, explore as guest or owner, then create your studio.",
    ],
    invitedPrompt: "Already invited?",
    invitedLink: "Use the link from your email — it skips this form and opens your demo room.",
  },
  formDemo: {
    submit: "Enter demo room",
    pending: "Opening…",
    success: "Request received. Check your email for next steps.",
  },
};

const DE: EditorialCopy = {
  nav: {
    getStarted: "Jetzt starten",
    seeDemo: "Demo ansehen",
    pricing: "Preise",
    howItWorks: "So funktioniert's",
    joinBeta: "Beta beitreten",
    tryBeta: "Beta testen",
    product: "Produkt",
    solutions: "Lösungen",
    resources: "Ressourcen",
    about: "Über uns",
    menu: "Menü",
    english: "English",
    deutsch: "Deutsch",
    closeMenu: "Schließen",
  },
  hero: {
    eyebrow: "Geschlossene Beta",
    headline: ["Termingeschäfte verdienen", "bessere", "Software."],
    livLine: "Sie heißt Liv.",
    body: "Kalender, Inbox, Team, Anzahlungen — ein Ort.",
    regions: "Friseur · Beauty · Wellness · Tattoo · Medspa · Hund · Physio · Fitness · DACH · EU",
    meetLiv: "Liv kennenlernen",
    howItWorks: "So funktioniert's",
    photoAlt: "Europäisches Dienstleistungsstudio am ruhigen Morgen",
    photoCaption: "09:14 · München",
  },
  homeConstellation: {
    headline1: "Software für",
    headline2: "Termingeschäfte.",
    subhead:
      "Kalender, Nachrichten, Team und Buchungsseite an einem Ort. Liv antwortet, wenn Sie Feierabend haben.",
    getStarted: "Jetzt starten",
    bookDemo: "Demo buchen",
    howItWorks: "So funktioniert's",
    joinBeta: "Beta beitreten",
  },
  homeFold: {
    physicsEyebrow: "Was jedes Studio teilt",
    physicsHeadline: "Drei Dinge, die Sie richtig machen müssen.",
    livLine: "Liv antwortet, bucht und schickt Ihnen morgens eine Zusammenfassung — Ihr Team kann jederzeit übernehmen.",
    pricingFrom: "Chain, Host und Add-ons auf der Preisseite.",
    verticalsEyebrow: "Ihr Gewerk",
    verticalsHeadline: "Wählen Sie Ihr Gewerk",
    verticalsSub: "Sehen Sie, wie Livia zu Ihrem Gewerk passt — dann legen Sie Ihr Studio an.",
    faqMore: "Mehr Antworten",
  },
  productShowcase: {
    eyebrow: "Das Produkt",
    title: "Ihr Studio,",
    titleAccent: "auf dem Bildschirm.",
    subtitle:
      "Echtes Livia — Inbox am Desktop, Today auf dem Handy und die Buchungsseite, die Ihre Kunden nutzen.",
    webLabel: "Inbox · Web",
    mobileLabel: "Today · Mobil",
    bookingLabel: "Buchungsseite",
    webAlt: "Livia-Inbox am Desktop mit Kundennachrichten und Buchungsaktionen",
    mobileAlt: "Livia-Today-Ansicht auf dem Handy mit den Terminen des Tages",
    bookingAlt: "Öffentliche Livia-Buchungsseite für ein Beauty-Studio",
  },
  homeOs: {
    eyebrow: "Für Ihr Gewerk gebaut",
    headline: ["Nachrichten häufen sich.", "Zeit bleibt knapp."],
    headlineAccent: "Livia hält beides im Griff.",
    subhead:
      "Salons, Kliniken, Studios, Groomer — jedes Geschäft, das Zeit nach Termin verkauft. Ein Kalender, eine Inbox, ein Ort für Ihr Team.",
    livIntro:
      "<strong>Liv</strong> arbeitet in Livia — antwortet, bucht und briefed Sie, bevor der Tag beginnt.",
    seeDemo: "Jetzt starten",
    howItWorks: "So funktioniert's",
    joinBeta: "Beta beitreten",
    convergenceLabel: "Jeder Kanal in einer Inbox",
    channels: [
      { short: "DM", label: "Social" },
      { short: "SMS", label: "Text" },
      { short: "Web", label: "Buchung" },
      { short: "Tel", label: "Telefon" },
    ],
    physicsTitle: "Was jedes Termingeschäft teilt",
    physicsSubtitle:
      "Friseur war unser erster Fokus — nicht unser einziger. Die Grundlagen gelten für Stuhl, Raum oder Kurs.",
    physics: [
      { title: "Ihr Kalender", body: "Echte Slots, Puffer und Verfügbarkeit — kein Schmuckkalender." },
      { title: "Richtige Person, richtiger Service", body: "Ihre Regeln, wer was macht und wie lange es dauert." },
      { title: "Kundenhistorie", body: "Notizen, Formeln, Pläne — nicht bei jedem Besuch von vorn." },
      { title: "Ihre Regeln", body: "Anzahlungen, Storno, Einwilligung — einmal festlegen, überall anwenden." },
      { title: "Eine Inbox", body: "SMS, E-Mail und Web-Chat in einem Thread — verbunden mit Ihrem Kalender." },
    ],
    livBand: {
      title: "Liv ist Teil von Livia — kein Chat-Widget am Rand",
      body: "Sie arbeitet in Ihrer Software. Kunden wissen, wenn sie mit KI sprechen. Sie können jedes Gespräch übernehmen.",
      bullets: [
        "Antwortet in Ihrem Ton mit echten Slot-Checks",
        "Bucht, erinnert und füllt nach Ihren Regeln",
        "Briefed den Owner, bevor der Tag fragt",
        "EU AI Act Disclosure in Gast-Oberflächen",
      ],
      panelLabel: "Floor-Snapshot · Dienstag 07:02",
      panelLines: [
        { text: "3 Stühle Donnerstag frei — Liv bot die Warteliste an." },
        { text: "Maries 14:30 für Stammkundin reserviert." },
        { text: "Keine Anzahlungs-Streitigkeiten diese Woche." },
        { text: "Team kann jeden Thread übernehmen.", muted: true },
      ],
    },
  },
  homeTrust: [
    { label: "Gewerke", value: "21+" },
    { label: "Märkte", value: "DACH · EU" },
    { label: "Richtlinien", value: "Ihre" },
    { label: "Produkt", value: "Inbox + Kalender + Team" },
  ],
  homeFeatures: [
    { title: "Inbox", body: "SMS, E-Mail, Web-Chat. Ein Thread." },
    { title: "Kalender", body: "Echte Verfügbarkeit. Ihre Regeln." },
    { title: "Briefing", body: "Der Tag, bevor Sie fragen." },
  ],
  homeMarkets: {
    title: "Für europäisches Handwerk",
    subtitle: "Eine Plattform. Viele Branchen.",
    cities: [
      { place: "Dublin", note: "Hair · Tattoo · Medspa" },
      { place: "London", note: "Beauty · Wellness" },
      { place: "Berlin", note: "Barber · Studio" },
      { place: "Paris", note: "Nägel · Brauen" },
      { place: "München", note: "Wellness" },
      { place: "Hamburg", note: "Physio · Fitness" },
    ],
  },
  faqIntro: "Kurz und klar.",
  proof: {
    statHead: "Sonntagabend",
    statBody:
      "wieder in Ihrer Hand — nicht verloren in ungelesenen Nachrichten und halb beantworteten Buchungsanfragen.",
    cohort: "Design-Partner · DACH & EU · geschlossene Beta",
    quote: "Ich habe aufgehört, um 22 Uhr Instagram zu checken.",
    quoteAttribution: "— Saloninhaberin, Hamburg",
    briefingLabel: "Dienstag-Briefing · 07:02",
    briefingItems: [
      "3 Plätze Donnerstag frei — Liv hat Warteliste angeboten",
      "2:30 für Stammkundin reserviert",
      "Keine Anzahlungs-Streitigkeiten diese Woche",
    ],
    tags: ["Salon-Ops auf Enterprise-Niveau", "Einfache Online-Buchung", "Europäische Gelassenheit"],
  },
  story: {
    chapter1: "Kapitel eins",
    inboxTitle: "Die Inbox, die nie ganz leer wurde.",
    inboxBody:
      "Liv antwortet heute per SMS, E-Mail und Ihrem öffentlichen Buchungs-Chat — eine Inbox, echte Verfügbarkeit, EU-KI-Kennzeichnung auf jeder Kundenoberfläche. Weitere Kanäle (z. B. WhatsApp, Instagram) mit Pilotstudios.",
    smsTime: "SMS · 22:41",
    smsCustomer: "Hallo — geht am Donnerstag noch eine Farbe? War schon bei Aoife.",
    smsLiv: "— Aoife hat Donnerstag 14:30. Soll ich reservieren?",
    livReplied: "Liv hat geantwortet",
    chapter2: "Kapitel zwei",
    creamTitle: "Liv hat geantwortet. Sie haben geschlafen.",
    creamBody:
      "No-Show-Recovery, Wartelisten-Nachrücken und Anzahlungs-Buchung — mit Regeln, die Sie festlegen, nicht mit Vorlagen aus fremder Software.",
    creamAside: "Leere Stühle sind ein Dienstag-Problem. Livia ist für den Sonntagabend davor gebaut.",
    chapter3: "Kapitel drei",
    cockpitTitle: "Ein ruhiger Blick auf den Tag.",
    cockpitLabel: "Ihr Morgenüberblick · Vorschau",
    cockpitBody: "Tag, Woche und Umsatz Ihres Studios — ohne drei Apps vor 9 Uhr.",
    cockpitNote: "Echte Livia-Oberflächen — kein Stock-Mock-up.",
    trustIntro: "Liv",
    trustTitle: "Sie übernimmt jeden Monat mehr Verantwortung.",
    trustSteps: [
      { when: "Monat 1", what: "Beantwortet Nachrichten nach Feierabend in Ihrem Ton." },
      { when: "Monat 2", what: "Bucht nach Ihren Richtlinien — nicht generischen Regeln." },
      { when: "Monat 3", what: "Kennt Stammkunden beim Namen." },
      { when: "Monat 6", what: "Liefert das Morgen-Briefing, bevor Sie fragen." },
      { when: "Monat 12", what: "Sie würden es merken, wenn sie ginge." },
    ],
  },
  pricing: {
    title: "Preise",
    subtitle: "EUR, klare MwSt. Beta kostenlos.",
    morePlans: "Chain, Host und Add-ons auf der",
    fullPricing: "vollständigen Preisseite",
    compareAll: "Alle Pläne vergleichen",
    mostStudios: "Die meisten Studios",
    soloFeatures: [
      "Liv-Inbox: SMS, E-Mail & öffentlicher Chat",
      "Voice-Empfang (Erfolgsbeteiligung, gedeckelt)",
      "Öffentliche Buchung + Mobile App",
    ],
    studioFeatures: ["Alles aus Solo", "Team pro Sitz", "Manager-Inbox"],
  },
  faq: {
    title: "FAQ",
    items: [
      {
        q: "Was ist Livia?",
        a: `Das OS für Termingeschäfte — Kalender, Inbox, Team und Buchungsseite an einem Ort. Ab ${marketingSoloFloorPrice()}/Monat zum Launch; die Beta ist für Sie kostenlos.`,
      },
      {
        q: "Für wen?",
        a: "Wer mit Terminen Umsatz macht. Friseur bis Medspa, Hund bis Physio. Solo und kleine Ketten.",
      },
      {
        q: "Unterschied zu Booksy oder Fresha?",
        a: "Kein Marktplatz und kein Chatbot zum Anstecken. Ihre Software — Ihr Kalender, Ihre Kunden, Ihre Regeln. Liv arbeitet die Inbox.",
      },
      {
        q: "Was macht Liv?",
        a: "Antwortet in Ihrem Ton. Prüft Slots. Bucht. Team kann übernehmen.",
      },
      {
        q: "Wann rein?",
        a: "Warteliste unten. Einladung in Wellen — DACH und EU.",
      },
      {
        q: "DSGVO und EU AI Act?",
        a: "DSGVO-first. Art.-50 auf Kundenoberflächen. Legal unter livia-hq.com/legal.",
      },
      {
        q: "Preise und MwSt.?",
        a: "Flatrate zum Launch. Beta kostenlos. EU-USt-IdNr. → Reverse-Charge.",
      },
      {
        q: "Bewerbung?",
        a: "E-Mail ins Formular. Wir melden uns, wenn es passt.",
      },
    ],
  },
  founder: {
    quote: "Bessere Software für Termingeschäfte. Kein Umsatzverlust, weil Sie arbeiten.",
    attribution: "— Livia",
    ctaTitle: "Beta beitreten",
    ctaSubtitle: "Einladung in Wellen.",
  },
  form: {
    placeholder: "sie@ihr-studio.de",
    submit: "Auf die Warteliste",
    success: "Sie stehen auf der Liste. Wir melden uns, wenn eine Welle öffnet.",
    error: "Etwas ist schiefgelaufen. Bitte erneut versuchen.",
  },
  bookDemoPage: {
    eyebrow: "Geschlossene Beta",
    titleLead: "Demo",
    titleAccent: "buchen",
    subtitle:
      "Ein Formular öffnet Ihren persönlichen Demo-Raum. Branche wählen, echtes Studio durchgehen, dann anmelden.",
    steps: [
      "E-Mail, Branche und Land senden.",
      "Ihr Demo-Raum öffnet sich sofort — sieben Tage Zugang.",
      "Branche wählen, als Gast oder Inhaber erkunden, dann Studio anlegen.",
    ],
    invitedPrompt: "Bereits eingeladen?",
    invitedLink: "Link aus Ihrer E-Mail nutzen — er überspringt dieses Formular.",
  },
  formDemo: {
    submit: "Demo-Raum öffnen",
    pending: "Wird geöffnet…",
    success: "Anfrage erhalten. Nächste Schritte per E-Mail.",
  },
  deContact: {
    title: "DACH-Pilot",
    body: "Ausgewählte Studios. EN/DE-Oberfläche. Voice DE nach Evaluierung.",
    cta: "Kontakt",
    mailSubject: "DACH Beta",
  },
};

export function editorialCopy(locale: MarketingLocale): EditorialCopy {
  return locale === "de" ? DE : EN;
}
