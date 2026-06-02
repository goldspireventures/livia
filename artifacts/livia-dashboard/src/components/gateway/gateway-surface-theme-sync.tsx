import { useEffect } from "react";
import { useLocation } from "wouter";
import { applyGatewaySurfaceTheme } from "@/lib/gateway-surface-theme";

function isGatewayRoute(path: string): boolean {
  const p = path.split("?")[0]?.replace(/\/+$/, "") ?? "";
  return p === "/demo" || p.startsWith("/demo/") || p === "/sign-in" || p === "/sign-up";
}

/** Reset tenant W4 tokens when entering W2 gateway routes (e.g. after shop sign-out). */
export function GatewaySurfaceThemeSync() {
  const [location] = useLocation();

  useEffect(() => {
    if (isGatewayRoute(location)) {
      applyGatewaySurfaceTheme();
    }
  }, [location]);

  return null;
}
