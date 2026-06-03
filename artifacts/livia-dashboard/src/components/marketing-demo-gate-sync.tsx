import { useEffect } from "react";
import { useLocation } from "wouter";
import { captureMarketingDemoGateKeyFromLocation } from "@/lib/marketing-demo-gate";

/** Keep invite `?key=` on the app origin so sign-out can return to W1 concierge. */
export function MarketingDemoGateSync() {
  const [location] = useLocation();

  useEffect(() => {
    captureMarketingDemoGateKeyFromLocation();
  }, [location]);

  return null;
}
