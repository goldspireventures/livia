/**
 * Editorial home copy — EN + DE. Single source for livia.io human-crafted surfaces.
 */
import { marketingSoloFloorPrice } from "@/lib/pricing-catalog";
export type MarketingLocale = "en" | "de";

export type HomeConstellationCopy = {
  headline1: string;
  headline2: string;
  subhead: string;
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

export type EditorialCopy = {
  nav: {
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
    seeDemo: "Book demo",
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
    photoCaption: "09:14 · Dublin",
  },
  homeConstellation: {
    headline1: "One OS.",
    headline2: "Every people-business.",
    subhead: "Same physics. Different floor. Liv runs the gap.",
    bookDemo: "Book a demo",
    howItWorks: "How it works",
    joinBeta: "Join beta",
  },
  homeFold: {
    physicsEyebrow: "Same physics",
    physicsHeadline: "Three invariants on every floor.",
    livLine: "Replies, books, and briefs inside your OS — with staff override on every thread.",
    pricingFrom: "Chain, Host, and add-ons on the full pricing page.",
    verticalsEyebrow: "Your trade",
    verticalsHeadline: "Pick your floor type",
    verticalsSub: "Request access — we match your trade and send a demo invite.",
    faqMore: "More answers",
  },
  homeOs: {
    eyebrow: "Operating system · people-businesses",
    headline: ["Demand arrives everywhere.", "Time is scarce."],
    headlineAccent: "One floor holds it.",
    subhead:
      "Salons, clinics, studios, groomers — any business where skilled humans sell scarce time to people who come back. Livia is the OS that unifies channels, calendar, memory, and policy.",
    livIntro:
      "<strong>Liv</strong> is the governed colleague on that floor — replying, booking, briefing, and leaving an audit trail you can trust.",
    seeDemo: "Book a demo",
    howItWorks: "How it works",
    joinBeta: "Join beta",
    convergenceLabel: "Every channel → one operating truth",
    channels: [
      { short: "DM", label: "Social" },
      { short: "SMS", label: "Text" },
      { short: "Web", label: "Booking" },
      { short: "Tel", label: "Phone" },
    ],
    physicsTitle: "The physics every in-scope business shares",
    physicsSubtitle:
      "Hair was the microscope, not the organism. These invariants hold whether you run a chair, a room, a bay, or a class slot.",
    physics: [
      { title: "Time inventory", body: "Scarce slots, buffers, and real availability — not a decorative calendar." },
      { title: "Skill match", body: "Right practitioner, right service, right duration — policy-aware." },
      { title: "Relationship memory", body: "Formula, plan, pet profile, vehicle notes — continuity that compounds." },
      { title: "Policy", body: "Deposits, cancel windows, consent — yours, enforced consistently." },
      { title: "Channels converge", body: "DM, SMS, web, phone — one schedule, one inbox, one truth." },
    ],
    livBand: {
      title: "Liv is not a chatbot bolt-on",
      body: "She runs inside your operating system — with disclosure, escalation, and staff override on every customer surface.",
      bullets: [
        "Replies in your tone with real slot checks",
        "Books, reminds, and backfills against your rules",
        "Briefs the owner before the day asks",
        "EU AI Act disclosure built into guest surfaces",
      ],
      panelLabel: "Floor snapshot · Tuesday 07:02",
      panelLines: [
        { text: "3 chairs open Thursday — Liv offered the waitlist." },
        { text: "Marie's 2:30 held for a regular." },
        { text: "No deposit disputes this week." },
        { text: "Staff can take over any thread.", muted: true },
      ],
    },
  },
  homeTrust: [
    { label: "Verticals", value: "21+ in demo" },
    { label: "Markets", value: "IE · UK · EU" },
    { label: "Policies", value: "Yours" },
    { label: "Product", value: "Inbox + calendar + staff" },
  ],
  homeFeatures: [
    { title: "Inbox", body: "SMS, email, web chat. One thread." },
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
    tags: ["Phorest-class ops", "Fresha-simple booking", "European calm"],
  },
  story: {
    chapter1: "Chapter one",
    inboxTitle: "The inbox you never quite cleared.",
    inboxBody:
      "Liv replies on SMS, email, and your public booking chat today — one inbox, real availability, and EU AI disclosure on every customer surface. More inbound channels (e.g. WhatsApp, Instagram) roll out with pilot shops.",
    smsTime: "SMS · 22:41",
    smsCustomer: "Hi — any chance for a colour Thursday? Used to come to Aoife.",
    smsLiv: "— Aoife has 2:30 Thursday. Want me to hold it?",
    livReplied: "Liv replied",
    chapter2: "Chapter two",
    creamTitle: "Liv answered. You slept.",
    creamBody:
      "No-show recovery, waitlist backfill, and deposit-ready scheduling — policies you approve, not boilerplate you inherit from a marketplace.",
    creamAside: "Empty chairs are a Tuesday problem. Livia is built for the Sunday night before.",
    chapter3: "Chapter three",
    cockpitTitle: "One calm view of the day.",
    cockpitLabel: "Owner cockpit · preview",
    cockpitBody: "Every shop's day, week, and money — without opening three apps before 9am.",
    cockpitNote: "Full product walkthrough on the demo — not a stock dashboard mockup.",
    trustIntro: "Liv",
    trustTitle: "She earns more responsibility every month.",
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
        a: `The OS for appointment businesses — your calendar, inbox, team, and booking page in one place. From ${marketingSoloFloorPrice()}/mo at launch; closed beta is free for you.`,
      },
      {
        q: "Who is it for?",
        a: "Anyone whose calendar is revenue. Hair to medspa, pets to physio. Solo shops and small chains.",
      },
      {
        q: "How is this different from Booksy or Fresha?",
        a: "Not a marketplace. Not a bolt-on chatbot. Your OS — Liv works the inbox and books your calendar.",
      },
      {
        q: "What does Liv do?",
        a: "Replies in your tone. Checks real slots. Books. Staff can take over any thread.",
      },
      {
        q: "When can I get in?",
        a: "Waitlist below. We invite in batches — IE, UK, EU.",
      },
      {
        q: "GDPR and EU AI Act?",
        a: "GDPR-first. Art. 50 disclosure on customer surfaces. Legal at livia-hq.com/legal.",
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
      "Plug-and-play for your floor — but we walk you in first. Tell us your trade and market; we reply with a live demo link or a short call.",
    steps: [
      "You share email, trade, and country.",
      "We qualify fit and invite in batches.",
      "Your personal link opens /demo with a secure key — valid seven days.",
    ],
    invitedPrompt: "Already invited?",
    invitedLink: "Open the personal link we emailed you — it contains your demo key.",
  },
  formDemo: {
    submit: "Request demo",
    pending: "Sending…",
    success: "Request received. We'll email you a demo link or next steps within a few days.",
  },
};

const DE: EditorialCopy = {
  nav: {
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
    headline1: "Ein OS.",
    headline2: "Jedes People-Business.",
    subhead: "Gleiche Physik. Anderer Floor. Liv schließt die Lücke.",
    bookDemo: "Demo buchen",
    howItWorks: "So funktioniert's",
    joinBeta: "Beta beitreten",
  },
  homeFold: {
    physicsEyebrow: "Gleiche Physik",
    physicsHeadline: "Drei Invarianten auf jedem Floor.",
    livLine: "Antwortet, bucht, briefed — im OS, mit Team-Override in jedem Thread.",
    pricingFrom: "Chain, Host und Add-ons auf der Preisseite.",
    verticalsEyebrow: "Ihr Gewerk",
    verticalsHeadline: "Wählen Sie Ihren Floor",
    verticalsSub: "Zugang anfragen — wir schicken eine Demo-Einladung.",
    faqMore: "Mehr Antworten",
  },
  homeOs: {
    eyebrow: "Betriebssystem · People-Businesses",
    headline: ["Nachfrage kommt überall an.", "Zeit ist knapp."],
    headlineAccent: "Ein Floor hält alles.",
    subhead:
      "Salons, Kliniken, Studios, Groomer — jedes Geschäft, in dem Menschen knappe Zeit an Stammkunden verkaufen. Livia ist das OS für Kanäle, Kalender, Gedächtnis und Policy.",
    livIntro:
      "<strong>Liv</strong> ist die governierte Kollegin auf diesem Floor — antwortet, bucht, briefed und hinterlässt einen prüfbaren Trail.",
    seeDemo: "Demo buchen",
    howItWorks: "So funktioniert's",
    joinBeta: "Beta beitreten",
    convergenceLabel: "Jeder Kanal → eine operative Wahrheit",
    channels: [
      { short: "DM", label: "Social" },
      { short: "SMS", label: "Text" },
      { short: "Web", label: "Buchung" },
      { short: "Tel", label: "Telefon" },
    ],
    physicsTitle: "Die Physik, die jedes passende Geschäft teilt",
    physicsSubtitle:
      "Friseur war das Mikroskop, nicht der Organismus. Diese Invarianten gelten für Stuhl, Raum, Box oder Kurs-Slot.",
    physics: [
      { title: "Zeit-Inventar", body: "Knapp Slots, Puffer, echte Verfügbarkeit — kein Deko-Kalender." },
      { title: "Skill-Match", body: "Richtige Person, richtiger Service, richtige Dauer — policy-aware." },
      { title: "Beziehungsgedächtnis", body: "Formel, Plan, Tierprofil, Fahrzeugnotizen — Kontinuität, die wächst." },
      { title: "Policy", body: "Anzahlungen, Storno, Einwilligung — Ihre Regeln, durchgängig." },
      { title: "Kanäle konvergieren", body: "DM, SMS, Web, Telefon — ein Schedule, eine Inbox, eine Wahrheit." },
    ],
    livBand: {
      title: "Liv ist kein Chatbot-Bolt-on",
      body: "Sie läuft im Betriebssystem — mit Disclosure, Eskalation und Staff-Override auf jeder Kundenoberfläche.",
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
    { label: "Branchen", value: "21+ in der Demo" },
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
      "No-Show-Recovery, Wartelisten-Nachrücken und Anzahlungs-Buchung — Richtlinien, die Sie freigeben, kein Marktplatz-Boilerplate.",
    creamAside: "Leere Stühle sind ein Dienstag-Problem. Livia ist für den Sonntagabend davor gebaut.",
    chapter3: "Kapitel drei",
    cockpitTitle: "Ein ruhiger Blick auf den Tag.",
    cockpitLabel: "Owner Cockpit · Vorschau",
    cockpitBody: "Tag, Woche und Umsatz Ihres Studios — ohne drei Apps vor 9 Uhr.",
    cockpitNote: "Vollständige Demo im Produkt — kein Stock-Dashboard.",
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
        a: "Kein Marktplatz. Kein Chatbot-Anbau. Ihr OS — Liv arbeitet die Inbox und bucht.",
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
      "Plug-and-play für Ihren Floor — aber wir führen Sie zuerst ein. Branche und Markt nennen; wir antworten mit Demo-Link oder kurzem Call.",
    steps: [
      "E-Mail, Branche und Land senden.",
      "Wir prüfen Passung und laden in Wellen ein.",
      "Persönlicher Link zur Live-Demo — für Ihre Branche vorbereitet.",
    ],
    invitedPrompt: "Bereits eingeladen?",
    invitedLink: "Nutzen Sie den persönlichen Link aus Ihrer E-Mail — er enthält Ihren Demo-Schlüssel.",
  },
  formDemo: {
    submit: "Demo anfragen",
    pending: "Wird gesendet…",
    success: "Anfrage erhalten. Demo-Link oder nächste Schritte per E-Mail in wenigen Tagen.",
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
