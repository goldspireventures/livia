import {
  getCountryLocalePack,
  getJurisdictionPack,
  resolveJurisdictionCode,
  upcomingPublicHolidays,
  isPublicHolidayClosed,
} from "@workspace/policy";

export function buildCountryPackForBusiness(biz: {
  country?: string | null;
  locale?: string | null;
  name: string;
}) {
  const jurisdiction = resolveJurisdictionCode(biz.country);
  const jPack = getJurisdictionPack(jurisdiction);
  const localePack = getCountryLocalePack(jurisdiction);
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: jPack.defaultTimezone,
  }).format(new Date());

  return {
    jurisdiction,
    currency: jPack.currency,
    locale: biz.locale ?? jPack.defaultLocale,
    timezone: jPack.defaultTimezone,
    publicBooking: localePack.publicBooking,
    countryShowcaseNote: localePack.countryShowcaseNote,
    upcomingHolidays: upcomingPublicHolidays(jurisdiction, today, 5),
    smsTemplates: {
      bookingReminderExample: localePack.sms.bookingReminder({
        businessName: biz.name,
        when: "tomorrow at 2pm",
      }),
      bookingConfirmedExample: localePack.sms.bookingConfirmed({
        businessName: biz.name,
        when: "Fri 14:00",
      }),
    },
  };
}

export function isDateClosedForBusiness(country: string | null | undefined, dateYmd: string) {
  const code = resolveJurisdictionCode(country);
  return isPublicHolidayClosed(code, dateYmd);
}
