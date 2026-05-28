import type { JurisdictionCode } from "./types";
import { getJurisdictionPack } from "./jurisdictions";

/** Customer-facing public booking copy per jurisdiction. */
export type CountryLocalePack = {
  code: JurisdictionCode;
  currency: string;
  locale: string;
  publicBooking: {
    chooseService: string;
    pickTime: string;
    yourDetails: string;
    confirmBooking: string;
    closedHoliday: string;
    aiFooter: string;
    dateFormat: "DMY" | "MDY";
  };
  sms: {
    bookingReminder: (args: { businessName: string; when: string }) => string;
    bookingConfirmed: (args: { businessName: string; when: string }) => string;
  };
  countryShowcaseNote: string;
};

const PACKS: Record<JurisdictionCode, CountryLocalePack> = {} as Record<
  JurisdictionCode,
  CountryLocalePack
>;

function enPack(code: JurisdictionCode, showcaseNote: string): CountryLocalePack {
  const j = getJurisdictionPack(code);
  return {
    code,
    currency: j.currency,
    locale: j.defaultLocale,
    publicBooking: {
      chooseService: "Choose a service",
      pickTime: "Pick a time",
      yourDetails: "Your details",
      confirmBooking: "Confirm booking",
      closedHoliday: "We're closed on this date (public holiday).",
      aiFooter: j.aiDisclosure.chatFooterLine,
      dateFormat: code === "GB" || code === "IE" ? "DMY" : "DMY",
    },
    sms: {
      bookingReminder: ({ businessName, when }) =>
        `Reminder: your appointment at ${businessName} is ${when}. Reply to reschedule.`,
      bookingConfirmed: ({ businessName, when }) =>
        `Confirmed at ${businessName} for ${when}. See you soon!`,
    },
    countryShowcaseNote: showcaseNote,
  };
}

PACKS.IE = enPack(
  "IE",
  "EUR · en-IE · St Patrick's & bank holidays in slot engine · GDPR-first defaults.",
);
PACKS.GB = enPack(
  "GB",
  "GBP · en-GB · UK bank holidays · PECR marketing consent on SMS.",
);

PACKS.DE = {
  ...enPack("DE", "EUR · de-DE · Feiertage blockieren Slots · formelles Sie in Kontinuität."),
  publicBooking: {
    chooseService: "Leistung wählen",
    pickTime: "Termin wählen",
    yourDetails: "Ihre Angaben",
    confirmBooking: "Buchung bestätigen",
    closedHoliday: "An diesem Feiertag haben wir geschlossen.",
    aiFooter: getJurisdictionPack("DE").aiDisclosure.chatFooterLine,
    dateFormat: "DMY",
  },
  sms: {
    bookingReminder: ({ businessName, when }) =>
      `Erinnerung: Ihr Termin bei ${businessName} ist ${when}. Antworten zum Umbuchen.`,
    bookingConfirmed: ({ businessName, when }) =>
      `Bestätigt bei ${businessName} am ${when}. Bis bald!`,
  },
};

PACKS.FR = {
  ...enPack("FR", "EUR · fr-FR · jours fériés · SMS marketing avec consentement."),
  publicBooking: {
    chooseService: "Choisir une prestation",
    pickTime: "Choisir un créneau",
    yourDetails: "Vos coordonnées",
    confirmBooking: "Confirmer la réservation",
    closedHoliday: "Fermé ce jour (jour férié).",
    aiFooter: getJurisdictionPack("FR").aiDisclosure.chatFooterLine,
    dateFormat: "DMY",
  },
  sms: {
    bookingReminder: ({ businessName, when }) =>
      `Rappel : votre rendez-vous chez ${businessName} est ${when}. Répondez pour reporter.`,
    bookingConfirmed: ({ businessName, when }) =>
      `Confirmé chez ${businessName} le ${when}. À bientôt !`,
  },
};

PACKS.DK = {
  ...enPack("DK", "DKK · da-DK · helligdage · rolige beskeder på dansk."),
  publicBooking: {
    chooseService: "Vælg behandling",
    pickTime: "Vælg tid",
    yourDetails: "Dine oplysninger",
    confirmBooking: "Bekræft booking",
    closedHoliday: "Vi har lukket denne dag (helligdag).",
    aiFooter: getJurisdictionPack("DK").aiDisclosure.chatFooterLine,
    dateFormat: "DMY",
  },
  sms: {
    bookingReminder: ({ businessName, when }) =>
      `Påmindelse: din tid hos ${businessName} er ${when}. Svar for at flytte tiden.`,
    bookingConfirmed: ({ businessName, when }) =>
      `Bekræftet hos ${businessName} ${when}. Vi glæder os!`,
  },
};

/** Beta showcase markets — fill remaining EU codes from jurisdiction defaults. */
for (const code of ["ES", "IT", "NL", "PL", "SE", "NO", "FI"] as JurisdictionCode[]) {
  if (!PACKS[code]) PACKS[code] = enPack(code, `${code} locale pack`);
}

export function getCountryLocalePack(code: JurisdictionCode): CountryLocalePack {
  return PACKS[code] ?? PACKS.IE;
}

export function formatSmsWithPrefix(
  jurisdiction: JurisdictionCode,
  businessName: string,
  body: string,
): string {
  const prefix = getJurisdictionPack(jurisdiction).aiDisclosure.smsPrefix(businessName);
  return `${prefix}${body}`;
}
