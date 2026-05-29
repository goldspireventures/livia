import { useAuth } from "@clerk/clerk-react";
import { Redirect, useLocation } from "wouter";
import { useGetMyBusinesses } from "@workspace/api-client-react";
import { BusinessProvider, normalizeBusinessList, useBusiness } from "@/lib/business-context";
import { MembershipProvider, useMembership } from "@/lib/membership-context";
import { usePersona } from "@/lib/persona";
import { PERSONA_RITUALS } from "@/lib/persona-rituals";
import { Spinner } from "@/components/ui/spinner";
import { ReactNode, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-fetch";
import { useQuery } from "@tanstack/react-query";
import { PlatformLegalGate } from "@/components/platform-legal-gate";
import { isDemoTenantSlug } from "@/lib/demo-tenant";
import { isOnboardingAppUnlocked, type OnboardingState } from "@workspace/policy";
import { PlatformExecHandoff } from "@/components/platform-exec-handoff";

// On first authenticated load, sweep up any pending Clerk invitations
// and turn them into business_memberships rows. Idempotent + cheap, so
// safe to run unconditionally.
function useAcceptPendingInvites(enabled: boolean) {
  return useQuery({
    queryKey: ["accept-invitations"],
    queryFn: () => apiFetch("/me/accept-invitations", { method: "POST" }),
    enabled,
    staleTime: Infinity,
    retry: false,
  });
}

const CLERK_LOAD_TIMEOUT_MS = 20_000;

function ClerkLoadingScreen() {
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setTimedOut(true), CLERK_LOAD_TIMEOUT_MS);
    return () => window.clearTimeout(t);
  }, []);

  if (timedOut) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <p className="text-lg font-medium text-foreground">Sign-in could not load</p>
        <p className="max-w-md text-sm text-muted-foreground">
          Clerk auth did not finish loading. Run{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">pnpm prod:smoke</code> and
          fix Railway <code className="rounded bg-muted px-1 py-0.5 text-xs">DASHBOARD_URL</code>{" "}
          (see docs/operations/ENV-VARIABLES.md). Check DevTools → Network for failed{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">clerk</code> requests.
        </p>
        <a
          href="/sign-in"
          className="text-sm font-medium text-primary underline underline-offset-2"
        >
          Retry sign-in
        </a>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <Spinner className="h-8 w-8 text-primary" />
    </div>
  );
}

export function AuthGuard({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const [location] = useLocation();

  // Fire-and-forget; we don't block render on it. If the user has no
  // pending invites, the endpoint returns `{ accepted: [] }` immediately.
  useAcceptPendingInvites(!!isLoaded && !!isSignedIn);

  if (!isLoaded) {
    return <ClerkLoadingScreen />;
  }

  if (!isSignedIn) {
    return <Redirect to={`/sign-in?redirect_url=${encodeURIComponent(location)}`} />;
  }

  return (
    <PlatformExecHandoff>
      {location === "/legal-acceptance" ? (
        <BusinessDataLoader skipLegalGate>{children}</BusinessDataLoader>
      ) : (
        <PlatformLegalGate>
          <BusinessDataLoader>{children}</BusinessDataLoader>
        </PlatformLegalGate>
      )}
    </PlatformExecHandoff>
  );
}

function BusinessDataLoader({
  children,
  skipLegalGate,
}: {
  children: ReactNode;
  skipLegalGate?: boolean;
}) {
  const { data: businesses, isLoading } = useGetMyBusinesses();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    );
  }

  const list = normalizeBusinessList(businesses);
  const hasAny = list.length > 0;

  if (!hasAny && location !== "/onboarding" && location !== "/legal-acceptance") {
    return <Redirect to="/onboarding" />;
  }

  if (
    !skipLegalGate &&
    hasAny &&
    location === "/legal-acceptance"
  ) {
    return <Redirect to="/dashboard" />;
  }

  return (
    <BusinessProvider businesses={list} isLoading={isLoading}>
      <MembershipProvider>
        <OnboardingGate>
          <RoleGate>{children}</RoleGate>
        </OnboardingGate>
      </MembershipProvider>
    </BusinessProvider>
  );
}

const ONBOARDING_EXEMPT_PREFIXES = [
  "/onboarding",
  "/legal-acceptance",
  "/sign-in",
  "/demo",
  "/b/",
];

/** Production owners finish onboarding; demo tenants skip via provisioned state. */
function OnboardingGate({ children }: { children: ReactNode }) {
  const { business } = useBusiness();
  const { effectiveRole } = useMembership();
  const [location] = useLocation();

  if (!business || isDemoTenantSlug(business.slug)) return <>{children}</>;
  if (effectiveRole !== "OWNER") return <>{children}</>;

  const onboardingState = (business as { onboardingState?: OnboardingState })
    .onboardingState;
  if (isOnboardingAppUnlocked(onboardingState)) return <>{children}</>;

  if (ONBOARDING_EXEMPT_PREFIXES.some((p) => location === p || location.startsWith(p))) {
    return <>{children}</>;
  }
  if (location.startsWith("/settings")) return <>{children}</>;

  return <Redirect to="/onboarding" />;
}

// Owner/admin landing routes that we want to redirect STAFF away from.
// (Keep this conservative — STAFF can still navigate freely to most
// surfaces; this is just the sign-in landing redirect.)
const STAFF_BLOCKED_LANDING = new Set([
  "/dashboard",
  "/inbox",
]);

function RoleGate({ children }: { children: ReactNode }) {
  const { effectiveRole, isLoading } = useMembership();
  const { kind: persona, isLoading: personaLoading } = usePersona();
  const { businesses } = useBusiness();
  const [location, navigate] = useLocation();

  useEffect(() => {
    if (isLoading || personaLoading) return;

    let home = PERSONA_RITUALS[persona].homePath;
    if (persona === "org_admin" && businesses.length < 2) {
      home = "/dashboard";
    }

    if (location === "/" || location === "") {
      navigate(home, { replace: true });
      return;
    }
    if (persona === "org_admin" && businesses.length < 2 && location === "/chain") {
      navigate("/dashboard", { replace: true });
      return;
    }
    if (effectiveRole === "STAFF" && STAFF_BLOCKED_LANDING.has(location)) {
      navigate("/my-day", { replace: true });
    }
    if (persona === "staff" && location === "/dashboard") {
      navigate("/my-day", { replace: true });
    }
    if (persona === "receptionist" && location === "/dashboard") {
      navigate("/bookings", { replace: true });
    }
  }, [effectiveRole, isLoading, location, navigate, persona, personaLoading, businesses.length]);

  return <>{children}</>;
}
