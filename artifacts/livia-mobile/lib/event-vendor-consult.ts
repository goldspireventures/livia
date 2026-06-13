import { customFetch } from "@workspace/api-client-react";

export type EnquiryRow = {
  id: string;
  status: string;
  contactName: string;
  contactEmail: string;
  eventType?: string | null;
  eventDate?: string | null;
  guestCount?: number | null;
  theme?: string | null;
  venue?: string | null;
  budgetRange?: string | null;
};

export type ConsultDashboard = {
  newEnquiries: number;
  lowFitNewEnquiries?: number;
  lowFitList?: Array<{
    enquiryId: string;
    contactName: string;
    eventType?: string | null;
    headline: string;
  }>;
  quotedEnquiries: number;
  staleQuotes: number;
  acceptedAwaitingDeposit?: number;
  bookedEvents?: number;
  prepTasksDue?: number;
  staleQuotesList?: Array<{
    quoteId: string;
    contactName: string;
    eventType?: string | null;
    daysSinceSent: number;
  }>;
  prepTaskList?: Array<{
    quoteId: string;
    contactName: string;
    taskId: string;
    label: string;
    dueDate: string;
    overdue: boolean;
  }>;
};

export type QuoteRow = {
  id: string;
  status: string;
  subtotalMinor: number;
  enquiryId?: string | null;
  publicToken: string;
  enquiry?: {
    contactName: string;
    eventType?: string | null;
    eventDate?: string | null;
    venue?: string | null;
    theme?: string | null;
  } | null;
};

export function eur(minor: number): string {
  return new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" }).format(minor / 100);
}

export async function fetchConsultDashboard(businessId: string) {
  return customFetch<ConsultDashboard>(`/api/businesses/${businessId}/event-vendor/dashboard`);
}

export async function fetchEnquiries(businessId: string) {
  return customFetch<EnquiryRow[]>(`/api/businesses/${businessId}/enquiries`);
}

export async function fetchQuotes(businessId: string) {
  return customFetch<QuoteRow[]>(`/api/businesses/${businessId}/quotes`);
}

export async function generateQuote(businessId: string, enquiryId: string, templateId?: string) {
  return customFetch<{ id: string; reusedExisting?: boolean }>(
    `/api/businesses/${businessId}/enquiries/${enquiryId}/quotes`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ templateId }),
    },
  );
}

export async function copyStaleNudge(businessId: string, quoteId: string) {
  return customFetch<{ whatsappText: string }>(
    `/api/businesses/${businessId}/quotes/${quoteId}/stale-liv-draft`,
  );
}

export async function copyEnquiryWhatsApp(businessId: string, enquiryId: string) {
  return customFetch<{ whatsappText: string }>(
    `/api/businesses/${businessId}/enquiries/${enquiryId}/liv-draft`,
  );
}

export async function copyQuoteWhatsApp(businessId: string, quoteId: string) {
  return customFetch<{ whatsappText: string }>(
    `/api/businesses/${businessId}/quotes/${quoteId}/liv-draft`,
  );
}
