import { useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

type BookingRow = {
  id: string;
  customer?: { firstName?: string | null; lastName?: string | null } | null;
  service?: { name?: string | null } | null;
};

/** Toast when polling surfaces bookings the owner has not seen yet (R2-C). */
export function useNewBookingArrivalToast(
  bookings: BookingRow[],
  enabled: boolean,
) {
  const { toast } = useToast();
  const seenIds = useRef<Set<string>>(new Set());
  const primed = useRef(false);

  useEffect(() => {
    if (!enabled || bookings.length === 0) return;

    const ids = new Set(bookings.map((b) => b.id));
    if (!primed.current) {
      seenIds.current = ids;
      primed.current = true;
      return;
    }

    const fresh = bookings.filter((b) => !seenIds.current.has(b.id));
    if (fresh.length > 0) {
      const b = fresh[0]!;
      const name =
        [b.customer?.firstName, b.customer?.lastName].filter(Boolean).join(" ") || "Guest";
      toast({
        title: fresh.length === 1 ? "New booking" : `${fresh.length} new bookings`,
        description: `${name} — ${b.service?.name ?? "appointment"}`,
      });
    }
    seenIds.current = ids;
  }, [bookings, enabled, toast]);
}
