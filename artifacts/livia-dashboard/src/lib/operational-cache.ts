import type { QueryClient } from "@tanstack/react-query";
import {
  getGetActivityFeedQueryKey,
  getGetDashboardSummaryQueryKey,
  getListBookingsQueryKey,
} from "@workspace/api-client-react";

/** After any operational action, refresh all surfaces that depend on live business state. */
export function invalidateOperationalState(qc: QueryClient, businessId: string) {
  void qc.invalidateQueries({ queryKey: ["liv-proposals", businessId] });
  void qc.invalidateQueries({ queryKey: getListBookingsQueryKey(businessId) });
  void qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey(businessId) });
  void qc.invalidateQueries({ queryKey: getGetActivityFeedQueryKey(businessId) });
  void qc.invalidateQueries({ queryKey: [`/businesses/${businessId}/conversations`] });
  void qc.invalidateQueries({ queryKey: ["inbox-linked-booking", businessId] });
  void qc.invalidateQueries({ queryKey: ["my-day", businessId] });
  void qc.invalidateQueries({ queryKey: ["shift-templates", businessId] });
  void qc.invalidateQueries({ queryKey: ["staff-shifts", businessId] });
}

/** Background poll so operator surfaces stay aligned with backend state. */
export const OPERATIONAL_REFETCH_MS = 45_000;
