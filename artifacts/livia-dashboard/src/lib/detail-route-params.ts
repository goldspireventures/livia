import { useLocation } from "wouter";

/** Fallback when nested Switch + splat routes drop wouter params (detail pages go blank). */
export function usePathId(segment: "staff" | "customers" | "bookings"): string {
  const [location] = useLocation();
  const match = location.match(new RegExp(`^/${segment}/([^/?#]+)`));
  return match?.[1] ?? "";
}
