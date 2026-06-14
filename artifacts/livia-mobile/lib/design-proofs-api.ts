import { customFetch } from "@workspace/api-client-react";

export type DesignProofRow = {
  id: string;
  status: string;
  imageUrl?: string | null;
  note?: string | null;
  guestFeedback?: string | null;
  studioNote?: string | null;
  customerId?: string | null;
  bookingId?: string | null;
  version?: number;
  createdAt?: string;
};

export type DesignProofRevisionRow = {
  version: number;
  imageUrl: string | null;
  createdAt: string;
};

export type DesignProofStatus =
  | "draft"
  | "pending_review"
  | "approved"
  | "rejected";

export async function listDesignProofs(businessId: string, status?: DesignProofStatus) {
  const q = status ? `?status=${encodeURIComponent(status)}` : "";
  const res = await customFetch<DesignProofRow[]>(
    `/api/businesses/${businessId}/design-proofs${q}`,
  );
  return Array.isArray(res) ? res : [];
}

export async function createDesignProof(
  businessId: string,
  body: { imageUrl?: string; note?: string; customerId?: string; bookingId?: string },
) {
  return customFetch<DesignProofRow>(`/api/businesses/${businessId}/design-proofs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function updateDesignProofStatus(
  businessId: string,
  proofId: string,
  status: DesignProofStatus,
) {
  return customFetch<DesignProofRow>(
    `/api/businesses/${businessId}/design-proofs/${proofId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    },
  );
}

export async function listDesignProofRevisions(
  businessId: string,
  proofId: string,
): Promise<DesignProofRevisionRow[]> {
  const res = await customFetch<DesignProofRevisionRow[]>(
    `/api/businesses/${businessId}/design-proofs/${proofId}/revisions`,
  );
  return Array.isArray(res) ? res : [];
}

export async function patchDesignProof(
  businessId: string,
  proofId: string,
  body: {
    revertToVersion?: number;
    resendAfterRevert?: boolean;
    replaceArtwork?: boolean;
    resendAfterReplace?: boolean;
    imageUrl?: string;
    note?: string;
    status?: DesignProofStatus;
  },
) {
  return customFetch<DesignProofRow>(
    `/api/businesses/${businessId}/design-proofs/${proofId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
}
