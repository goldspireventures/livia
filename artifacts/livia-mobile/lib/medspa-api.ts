import { customFetch } from "@workspace/api-client-react";

export type MedspaConsentRow = {
  id: string;
  procedureLabel: string;
  customerId: string;
  bookingId: string | null;
  status: string;
  createdAt: string;
};

export type MedspaIntakeRow = {
  id: string;
  customerId: string;
  allergies: string | null;
  medications: string | null;
  conditions: string | null;
  priorProcedures: string | null;
  notes: string | null;
  submittedAt: string | null;
};

export type WaitlistRow = {
  id: string;
  phone: string | null;
  email: string | null;
  serviceId: string | null;
  offeredBookingId?: string | null;
  createdAt: string;
};

export async function fetchClinicalHub(businessId: string) {
  const [consents, intakes, waitlist] = await Promise.all([
    customFetch<{ data: MedspaConsentRow[] }>(
      `/api/businesses/${businessId}/medspa/consents/pending`,
    ),
    customFetch<{ data: MedspaIntakeRow[] }>(
      `/api/businesses/${businessId}/medspa/intakes/review-queue`,
    ),
    customFetch<{ data: WaitlistRow[] }>(`/api/businesses/${businessId}/waitlist`),
  ]);
  return { consents: consents.data, intakes: intakes.data, waitlist: waitlist.data };
}

export async function signMedspaConsent(
  businessId: string,
  consentId: string,
  signatureName: string,
  bookingId?: string,
) {
  return customFetch(`/api/businesses/${businessId}/medspa/consents/${consentId}/sign`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ signatureName, bookingId }),
  });
}

export async function markIntakeReviewed(businessId: string, intakeId: string) {
  return customFetch(`/api/businesses/${businessId}/medspa/intakes/${intakeId}/reviewed`, {
    method: "PATCH",
  });
}

export async function submitMedspaIntake(
  businessId: string,
  body: {
    customerId: string;
    bookingId?: string;
    allergies?: string;
    medications?: string;
    conditions?: string;
    priorProcedures?: string;
    notes?: string;
    submit?: boolean;
  },
) {
  return customFetch(`/api/businesses/${businessId}/medspa/intakes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, submit: body.submit ?? true }),
  });
}
