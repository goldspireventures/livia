import { useEffect } from "react";
import { useLocation } from "wouter";

/** Guided booking opens as a modal on /bookings. */
export default function BookingNewPage() {
  const [, setLocation] = useLocation();
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const qs = params.toString();
    setLocation(qs ? `/bookings?guided=1&${qs}` : "/bookings?guided=1", { replace: true });
  }, [setLocation]);
  return null;
}
