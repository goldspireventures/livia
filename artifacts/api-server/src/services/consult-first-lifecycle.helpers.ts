/** Shared quote contact resolution for lifecycle + send (avoids circular imports). */
type QuoteEventDaySheet = {
  billToName?: string | null;
  billToEmail?: string | null;
  billToPhone?: string | null;
};

export function resolveQuoteRecipient(
  quote: { customerId?: string | null; eventDaySheet?: QuoteEventDaySheet | null },
  enquiry: {
    contactName?: string | null;
    contactEmail?: string | null;
    contactPhone?: string | null;
  } | null,
  customer: {
    displayName?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null,
) {
  const sheet = quote.eventDaySheet ?? {};
  const joinedName = [customer?.firstName, customer?.lastName].filter(Boolean).join(" ");
  const contactName =
    enquiry?.contactName?.trim() ||
    sheet.billToName?.trim() ||
    customer?.displayName?.trim() ||
    joinedName ||
    "there";
  const contactEmail = enquiry?.contactEmail ?? sheet.billToEmail?.trim() ?? customer?.email ?? undefined;
  const contactPhone = enquiry?.contactPhone ?? sheet.billToPhone?.trim() ?? customer?.phone ?? undefined;
  return { contactName, contactEmail, contactPhone };
}
