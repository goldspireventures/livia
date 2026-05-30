import { Redirect, useLocation } from "wouter";
import { useEffect } from "react";
import { useBusiness } from "@/lib/business-context";
import { isDashboardRouteAllowedForTenant } from "@workspace/policy";

type Biz = { vertical?: string; tier?: string };

export function WedgeRouteGuard({
  path,
  children,
}: {
  path: string;
  children: React.ReactNode;
}) {
  const { business } = useBusiness();
  const [, navigate] = useLocation();
  const b = business as Biz | null;
  const allowed = isDashboardRouteAllowedForTenant(path, b?.vertical, b?.tier);

  useEffect(() => {
    if (!allowed) navigate("/dashboard", { replace: true });
  }, [allowed, navigate]);

  if (!allowed) {
    return <Redirect to="/dashboard" />;
  }
  return <>{children}</>;
}
