import { useQueryClient } from "@tanstack/react-query";
import { useBusiness } from "@/lib/business-context";
import { invalidateOperationalState } from "@/lib/operational-cache";

/** Hook for pages that mutate operational state — returns invalidator bound to current shop. */
export function useOperationalInvalidator() {
  const { business } = useBusiness();
  const qc = useQueryClient();
  const bid = business?.id ?? "";
  return () => {
    if (bid) invalidateOperationalState(qc, bid);
  };
}
