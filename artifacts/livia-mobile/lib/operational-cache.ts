import type { QueryClient } from "@tanstack/react-query";

/** Mobile parity with dashboard operational cache invalidation. */
export function invalidateOperationalState(qc: QueryClient, businessId: string) {
  void qc.invalidateQueries({ queryKey: ["liv-proposals", businessId] });
  void qc.invalidateQueries({ queryKey: ["liv-mandate", businessId] });
  void qc.invalidateQueries({ queryKey: ["bookings", businessId] });
  void qc.invalidateQueries({ queryKey: ["my-day", businessId] });
  void qc.invalidateQueries({ queryKey: ["inbox", businessId] });
  void qc.invalidateQueries({ queryKey: ["dashboard-summary", businessId] });
}

export const OPERATIONAL_REFETCH_MS = 45_000;
