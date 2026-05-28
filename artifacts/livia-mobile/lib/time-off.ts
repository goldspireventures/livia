import { customFetch } from "@workspace/api-client-react";
import { Alert } from "react-native";

export type TimeOffRequestRow = {
  id: string;
  staffId: string;
  kind: string;
  startAt: string;
  endAt: string;
  reason?: string | null;
  status: string;
};

const KINDS = [
  { value: "annual_leave", label: "Annual leave" },
  { value: "sick", label: "Sick" },
  { value: "training", label: "Training" },
  { value: "personal", label: "Personal" },
  { value: "bereavement", label: "Bereavement" },
] as const;

export { KINDS };

export async function listTimeOffRequests(
  businessId: string,
  staffId?: string,
): Promise<TimeOffRequestRow[]> {
  const q = staffId ? `?staffId=${encodeURIComponent(staffId)}` : "";
  return customFetch<TimeOffRequestRow[]>(
    `/api/businesses/${businessId}/time-off-requests${q}`,
  );
}

export async function submitTimeOffRequest(
  businessId: string,
  body: {
    staffId: string;
    kind: string;
    startAt: string;
    endAt: string;
    reason?: string;
  },
): Promise<void> {
  await customFetch(`/api/businesses/${businessId}/time-off-requests`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  Alert.alert(
    "Leave request sent",
    "Your manager gets notified — Liv blocks the calendar once approved.",
  );
}
