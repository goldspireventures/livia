/**
 * Editorial home copy — EN + DE. Single source for livia.io human-crafted surfaces.
 */
export type MarketingLocale = "en" | "de";

export type EditorialCopy = {
  nav: {
    seeDemo: string;
    pricing: string;
    howItWorks: string;
    joinBeta: string;
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
  deContact?: {
    title: string;
    body: string;
    cta: string;
    mailSubject: string;
  };
};

const EN: EditorialCopy = {
  nav: {
    seeDemo: "Demo",
    pricing: "Pricing",
    howItWorks: "How it works",
    joinBeta: "Join beta",
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
        a: "The OS for appointment businesses. Calendar, inbox, staff, deposits — one interface. From €79/mo at launch; beta is free.",
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
};

const DE: EditorialCopy = {
  nav: {
    seeDemo: "Demo ansehen",
    pricing: "Preise",
    howItWorks: "So funktioniert's",
    joinBeta: "Beta beitreten",
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
        a: "Das OS für Termingeschäfte. Kalender, Inbox, Team, Anzahlungen. Ab €79/Monat zum Launch; Beta kostenlos.",
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
