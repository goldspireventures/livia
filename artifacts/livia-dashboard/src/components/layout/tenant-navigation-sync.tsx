import { useLayoutEffect, useRef } from "react";
import { useLocation } from "wouter";
import { isPublicGuestPath } from "@/lib/public-guest-paths";
import { clearGuestRouteDomState, isLeavingGuestRoute } from "@/lib/tenant-navigation-restore";

/**
 * Browser back from /book preview → /store left constellation chrome with empty main.
 * Force-clear guest DOM state whenever we land on a tenant route (popstate or wouter).
 */
export function TenantNavigationSync() {
  const [location] = useLocation();
  const prevPath = useRef(location);

  useLayoutEffect(() => {
    const prev = prevPath.current;
    if (isLeavingGuestRoute(prev, location)) {
      clearGuestRouteDomState();
    }
    prevPath.current = location;
  }, [location]);

  useLayoutEffect(() => {
    const onPopState = () => {
      const path = `${window.location.pathname}${window.location.search}`;
      if (!isPublicGuestPath(path)) {
        clearGuestRouteDomState();
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  return null;
}
