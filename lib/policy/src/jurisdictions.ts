import type { JurisdictionCode, JurisdictionPack } from "./types";

function disclosure(localeNote: string) {
  return {
    chatFirstMessage: (businessName: string) =>
      `Hi, I'm Liv — an AI assistant booking on behalf of ${businessName}. I keep notes for the team and a human can take over any time. ${localeNote}`,
    chatFooterLine: "AI-assisted by Liv · Powered by Anthropic Claude",
    smsPrefix: (businessName: string) => `(Liv, AI assistant for ${businessName}) — `,
    emailBlock: (businessName: string) =>
      `This message was drafted by Liv, an AI assistant for ${businessName}. Reply to this email and a human will respond.`,
  };
}

export const JURISDICTION_PACKS: Record<JurisdictionCode, JurisdictionPack> = {
  IE: {
    code: "IE",
    label: "Ireland",
    currency: "EUR",
    defaultLocale: "en-IE",
    defaultTimezone: "Europe/Dublin",
    euRegion: "dub",
    countryIso: "IE",
    smsMarketingRequiresOptIn: true,
    cancellationHours: 24,
    depositPolicySummary:
      "Deposits may apply for longer services. Cancellations with less than 24 hours' notice may forfeit the deposit where you agreed at booking.",
    bookingTermsIntro:
      "By confirming this appointment you agree to our booking terms. Marketing messages are only sent with your separate opt-in.",
    aiDisclosure: disclosure(""),
  },
  GB: {
    code: "GB",
    label: "United Kingdom",
    currency: "GBP",
    defaultLocale: "en-GB",
    defaultTimezone: "Europe/London",
    euRegion: "dub",
    countryIso: "GB",
    smsMarketingRequiresOptIn: true,
    cancellationHours: 24,
    depositPolicySummary:
      "Deposits may apply. Late cancellations or no-shows may forfeit the deposit if stated at booking and accepted by you.",
    bookingTermsIntro:
      "By confirming you accept our booking terms. Promotional SMS requires your explicit consent under PECR.",
    aiDisclosure: disclosure(""),
  },
  FR: {
    code: "FR",
    label: "France",
    currency: "EUR",
    defaultLocale: "fr-FR",
    defaultTimezone: "Europe/Paris",
    euRegion: "fra",
    countryIso: "FR",
    smsMarketingRequiresOptIn: true,
    cancellationHours: 24,
    depositPolicySummary:
      "Un acompte peut s'appliquer. Annulation sous 24 h : perte possible de l'acompte si accepté à la réservation.",
    bookingTermsIntro:
      "En confirmant, vous acceptez nos conditions. SMS marketing avec consentement séparé.",
    aiDisclosure: {
      chatFirstMessage: (businessName: string) =>
        `Bonjour, je suis Liv — assistante IA de ${businessName}. Je prends les rendez-vous ; une personne peut reprendre à tout moment.`,
      chatFooterLine: "Assisté par IA · Liv · Powered by Anthropic Claude",
      smsPrefix: (businessName: string) => `(Liv, IA pour ${businessName}) — `,
      emailBlock: (businessName: string) =>
        `Message rédigé par Liv, assistante IA de ${businessName}. Répondez à cet e-mail pour parler à une personne.`,
    },
  },
  DE: {
    code: "DE",
    label: "Germany",
    currency: "EUR",
    defaultLocale: "de-DE",
    defaultTimezone: "Europe/Berlin",
    euRegion: "fra",
    countryIso: "DE",
    smsMarketingRequiresOptIn: true,
    cancellationHours: 24,
    depositPolicySummary:
      "Anzahlungen können vereinbart werden. Stornierung innerhalb von 24 Stunden kann zum Verfall der Anzahlung führen, wenn dies bei der Buchung bestätigt wurde.",
    bookingTermsIntro:
      "Mit der Buchungsbestätigung akzeptieren Sie unsere AGB. Marketing-SMS nur mit gesonderter Einwilligung.",
    aiDisclosure: {
      chatFirstMessage: (businessName: string) =>
        `Hallo, ich bin Liv — eine KI-Assistentin für ${businessName}. Ich buche Termine und ein Mensch kann jederzeit übernehmen.`,
      chatFooterLine: "KI-unterstützt durch Liv · Powered by Anthropic Claude",
      smsPrefix: (businessName: string) => `(Liv, KI für ${businessName}) — `,
      emailBlock: (businessName: string) =>
        `Diese Nachricht wurde von Liv, einer KI-Assistentin für ${businessName}, erstellt. Antworten Sie auf diese E-Mail für einen Menschen.`,
    },
  },
  ES: {
    code: "ES",
    label: "Spain",
    currency: "EUR",
    defaultLocale: "es-ES",
    defaultTimezone: "Europe/Madrid",
    euRegion: "fra",
    countryIso: "ES",
    smsMarketingRequiresOptIn: true,
    cancellationHours: 24,
    depositPolicySummary:
      "Puede aplicarse un depósito. Cancelaciones con menos de 24 h pueden implicar la pérdida del depósito si lo aceptó al reservar.",
    bookingTermsIntro:
      "Al confirmar acepta nuestras condiciones de reserva. Los SMS promocionales requieren consentimiento aparte.",
    aiDisclosure: {
      chatFirstMessage: (businessName: string) =>
        `Hola, soy Liv — asistente de IA de ${businessName}. Reservo citas y una persona puede tomar el control cuando quiera.`,
      chatFooterLine: "Asistido por IA · Liv · Powered by Anthropic Claude",
      smsPrefix: (businessName: string) => `(Liv, IA de ${businessName}) — `,
      emailBlock: (businessName: string) =>
        `Mensaje redactado por Liv, asistente de IA de ${businessName}. Responda a este correo para hablar con una persona.`,
    },
  },
  IT: {
    code: "IT",
    label: "Italy",
    currency: "EUR",
    defaultLocale: "it-IT",
    defaultTimezone: "Europe/Rome",
    euRegion: "fra",
    countryIso: "IT",
    smsMarketingRequiresOptIn: true,
    cancellationHours: 24,
    depositPolicySummary:
      "Può essere richiesto un acconto. Cancellazioni entro 24 ore possono comportare la perdita dell'acconto se accettato in fase di prenotazione.",
    bookingTermsIntro:
      "Confermando accetta i termini di prenotazione. Gli SMS promozionali richiedono consenso separato.",
    aiDisclosure: {
      chatFirstMessage: (businessName: string) =>
        `Ciao, sono Liv — assistente IA di ${businessName}. Prenoto appuntamenti e una persona può subentrare in qualsiasi momento.`,
      chatFooterLine: "Assistito da IA · Liv · Powered by Anthropic Claude",
      smsPrefix: (businessName: string) => `(Liv, IA per ${businessName}) — `,
      emailBlock: (businessName: string) =>
        `Messaggio redatto da Liv, assistente IA di ${businessName}. Risponda a questa email per parlare con una persona.`,
    },
  },
  NL: {
    code: "NL",
    label: "Netherlands",
    currency: "EUR",
    defaultLocale: "nl-NL",
    defaultTimezone: "Europe/Amsterdam",
    euRegion: "fra",
    countryIso: "NL",
    smsMarketingRequiresOptIn: true,
    cancellationHours: 24,
    depositPolicySummary:
      "Er kan een aanbetaling gelden. Annulering binnen 24 uur kan het verlies van de aanbetaling betekenen indien bij boeking geaccepteerd.",
    bookingTermsIntro:
      "Door te bevestigen accepteert u onze boekingsvoorwaarden. Marketing-SMS vereist aparte toestemming.",
    aiDisclosure: {
      chatFirstMessage: (businessName: string) =>
        `Hoi, ik ben Liv — AI-assistent van ${businessName}. Ik plan afspraken en een mens kan altijd overnemen.`,
      chatFooterLine: "AI-ondersteund door Liv · Powered by Anthropic Claude",
      smsPrefix: (businessName: string) => `(Liv, AI voor ${businessName}) — `,
      emailBlock: (businessName: string) =>
        `Dit bericht is opgesteld door Liv, AI-assistent van ${businessName}. Antwoord op deze e-mail voor een mens.`,
    },
  },
  SE: {
    code: "SE",
    label: "Sweden",
    currency: "SEK",
    defaultLocale: "sv-SE",
    defaultTimezone: "Europe/Stockholm",
    euRegion: "fra",
    countryIso: "SE",
    smsMarketingRequiresOptIn: true,
    cancellationHours: 24,
    depositPolicySummary:
      "Deposition kan gälla. Avbokning inom 24 timmar kan innebära att depositionen faller bort om du godkände det vid bokning.",
    bookingTermsIntro:
      "Genom att bekräfta accepterar du våra bokningsvillkor. Marknadsförings-SMS kräver separat samtycke.",
    aiDisclosure: {
      chatFirstMessage: (businessName: string) =>
        `Hej, jag är Liv — AI-assistent för ${businessName}. Jag bokar tider och en människa kan ta över när som helst.`,
      chatFooterLine: "AI-assisterad av Liv · Powered by Anthropic Claude",
      smsPrefix: (businessName: string) => `(Liv, AI för ${businessName}) — `,
      emailBlock: (businessName: string) =>
        `Meddelandet skapades av Liv, AI-assistent för ${businessName}. Svara på detta mail för en människa.`,
    },
  },
  DK: {
    code: "DK",
    label: "Denmark",
    currency: "DKK",
    defaultLocale: "da-DK",
    defaultTimezone: "Europe/Copenhagen",
    euRegion: "fra",
    countryIso: "DK",
    smsMarketingRequiresOptIn: true,
    cancellationHours: 24,
    depositPolicySummary:
      "Depositum kan gælde. Afbud inden for 24 timer kan medføre tab af depositum, hvis accepteret ved booking.",
    bookingTermsIntro:
      "Ved bekræftelse accepterer du vores bookingvilkår. Marketing-SMS kræver særskilt samtykke.",
    aiDisclosure: {
      chatFirstMessage: (businessName: string) =>
        `Hej, jeg er Liv — AI-assistent for ${businessName}. Jeg booker tider, og et menneske kan overtage når som helst.`,
      chatFooterLine: "AI-assisteret af Liv · Powered by Anthropic Claude",
      smsPrefix: (businessName: string) => `(Liv, AI for ${businessName}) — `,
      emailBlock: (businessName: string) =>
        `Besked udarbejdet af Liv, AI-assistent for ${businessName}. Svar på denne e-mail for et menneske.`,
    },
  },
  NO: {
    code: "NO",
    label: "Norway",
    currency: "NOK",
    defaultLocale: "nb-NO",
    defaultTimezone: "Europe/Oslo",
    euRegion: "fra",
    countryIso: "NO",
    smsMarketingRequiresOptIn: true,
    cancellationHours: 24,
    depositPolicySummary:
      "Depositum kan gjelde. Avbestilling innen 24 timer kan medføre tap av depositum hvis akseptert ved booking.",
    bookingTermsIntro:
      "Ved å bekrefte godtar du våre bookingvilkår. Markedsførings-SMS krever separat samtykke.",
    aiDisclosure: {
      chatFirstMessage: (businessName: string) =>
        `Hei, jeg er Liv — AI-assistent for ${businessName}. Jeg booker timer og et menneske kan ta over når som helst.`,
      chatFooterLine: "AI-assistert av Liv · Powered by Anthropic Claude",
      smsPrefix: (businessName: string) => `(Liv, AI for ${businessName}) — `,
      emailBlock: (businessName: string) =>
        `Melding utarbeidet av Liv, AI-assistent for ${businessName}. Svar på denne e-posten for et menneske.`,
    },
  },
  FI: {
    code: "FI",
    label: "Finland",
    currency: "EUR",
    defaultLocale: "fi-FI",
    defaultTimezone: "Europe/Helsinki",
    euRegion: "fra",
    countryIso: "FI",
    smsMarketingRequiresOptIn: true,
    cancellationHours: 24,
    depositPolicySummary:
      "Ennakkomaksu voi olla voimassa. Peruutus 24 tunnin sisällä voi johtaa ennakkomaksun menetykseen, jos hyväksyit sen varauksen yhteydessä.",
    bookingTermsIntro:
      "Vahvistamalla hyväksyt varausehtomme. Markkinointi-SMS vaatii erillisen suostumuksen.",
    aiDisclosure: {
      chatFirstMessage: (businessName: string) =>
        `Hei, olen Liv — ${businessName}:n tekoälyavustaja. Varaan aikoja ja ihminen voi ottaa vastuun milloin tahansa.`,
      chatFooterLine: "Tekoälyavusteinen Liv · Powered by Anthropic Claude",
      smsPrefix: (businessName: string) => `(Liv, AI ${businessName}) — `,
      emailBlock: (businessName: string) =>
        `Viestin laati Liv, ${businessName}:n tekoälyavustaja. Vastaa tähän sähköpostiin puhuaksesi ihmisen kanssa.`,
    },
  },
  PL: {
    code: "PL",
    label: "Poland",
    currency: "PLN",
    defaultLocale: "pl-PL",
    defaultTimezone: "Europe/Warsaw",
    euRegion: "fra",
    countryIso: "PL",
    smsMarketingRequiresOptIn: true,
    cancellationHours: 24,
    depositPolicySummary:
      "Może obowiązywać zaliczka. Anulowanie w ciągu 24 godzin może skutkować utratą zaliczki, jeśli zaakceptowano to przy rezerwacji.",
    bookingTermsIntro:
      "Potwierdzając rezerwację akceptujesz warunki. SMS marketingowe wymagają osobnej zgody.",
    aiDisclosure: {
      chatFirstMessage: (businessName: string) =>
        `Cześć, jestem Liv — asystentka AI w ${businessName}. Rezerwuję wizyty, a człowiek może przejąć w każdej chwili.`,
      chatFooterLine: "Wsparcie AI · Liv · Powered by Anthropic Claude",
      smsPrefix: (businessName: string) => `(Liv, AI dla ${businessName}) — `,
      emailBlock: (businessName: string) =>
        `Wiadomość przygotowana przez Liv, asystentkę AI ${businessName}. Odpowiedz na ten e-mail, by porozmawiać z człowiekiem.`,
    },
  },
};

export function resolveJurisdictionCode(country?: string | null): JurisdictionCode {
  const c = (country ?? "IE").toUpperCase();
  if (c in JURISDICTION_PACKS) return c as JurisdictionCode;
  if (c === "UK") return "GB";
  return "IE";
}

export function getJurisdictionPack(country?: string | null): JurisdictionPack {
  return JURISDICTION_PACKS[resolveJurisdictionCode(country)];
}

export function listJurisdictionCatalog() {
  return Object.values(JURISDICTION_PACKS).map((j) => ({
    jurisdiction: j.code,
    label: j.label,
    currency: j.currency,
    defaultTimezone: j.defaultTimezone,
    countryIso: j.countryIso,
  }));
}
