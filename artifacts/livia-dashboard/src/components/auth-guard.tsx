import { useAuth, useUser } from "@clerk/clerk-react";
import { Redirect, useLocation } from "wouter";
import { useGetMyBusinesses } from "@workspace/api-client-react";
import { BusinessProvider, normalizeBusinessList, useBusiness } from "@/lib/business-context";
import { MembershipProvider, useMembership } from "@/lib/membership-context";
import { isDemoLoginEnabled, usePersona } from "@/lib/persona";
import { PERSONA_RITUALS, resolvePersonaRitual } from "@/lib/persona-rituals";
import { Spinner } from "@/components/ui/spinner";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api-fetch";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PlatformLegalGate } from "@/components/platform-legal-gate";
import { isDemoAccountEmail, isDemoTenantSlug } from "@/lib/demo-tenant";
import { prospectDemoEntryUrl } from "@/lib/demo-routes";
import { localDevSignInPath, isLocalDashboardDev } from "@/lib/local-dashboard-auth";
import { ProspectDemoRedirect } from "@/components/prospect-demo-redirect";
import { isOnboardingAppUnlocked, type OnboardingState } from "@workspace/policy";
import {
  filterSessionBusinesses,
  pickPrimarySessionBusiness,
  resolvePostLegalDestination,
  shouldSkipLegalToDashboard,
  type SessionBusinessLike,
} from "@workspace/policy";
import { useAuthSessionReset } from "@/hooks/use-auth-session-reset";
import {
  pruneStalePersistedBusinessId,
  readPersistedBusinessId,
} from "@/lib/tenant-session-storage";
import { PlatformExecHandoff } from "@/components/platform-exec-handoff";
import {
  applyTenantPresentationSkin,
  warmTenantPresentationSkin,
} from "@/lib/tenant-presentation-sync";
import {
  prefetchTenantDashboardShell,
  applyTenantShellFromCache,
} from "@/lib/prefetch-tenant-dashboard";

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
    const isFounderOnboarding =
      location === "/onboarding" || location.startsWith("/onboarding/");
    if (isLocalDashboardDev()) {
      return <Redirect to={localDevSignInPath(location)} />;
    }
    // Demo-enabled stacks must not send real founders through G1 → marketing book-demo.
    if (isFounderOnboarding && isDemoLoginEnabled) {
      const params = new URLSearchParams({ beta: "1", redirect_url: location });
      return <Redirect to={`/sign-in?${params.toString()}`} />;
    }
    const gate = isDemoLoginEnabled ? prospectDemoEntryUrl() : "/sign-in";
    if (isDemoLoginEnabled && gate.startsWith("http")) {
      return <ProspectDemoRedirect />;
    }
    return <Redirect to={`${gate}?redirect_url=${encodeURIComponent(location)}`} />;
  }

  return (
    <PlatformExecHandoff>
      <AuthSessionBoundary>
        {location === "/legal-acceptance" ? (
          <BusinessDataLoader skipLegalGate>{children}</BusinessDataLoader>
        ) : (
          <PlatformLegalGate>
            <BusinessDataLoader>{children}</BusinessDataLoader>
          </PlatformLegalGate>
        )}
      </AuthSessionBoundary>
    </PlatformExecHandoff>
  );
}

function AuthSessionBoundary({ children }: { children: ReactNode }) {
  useAuthSessionReset();
  return <>{children}</>;
}

function BusinessDataLoader({
  children,
  skipLegalGate,
}: {
  children: ReactNode;
  skipLegalGate?: boolean;
}) {
  const queryClient = useQueryClient();
  const [location] = useLocation();
  const onOnboarding =
    location === "/onboarding" || location.startsWith("/onboarding/");
  const onLegalAcceptance = location === "/legal-acceptance";
  const { data: businesses, isLoading, isError, isFetching, refetch } = useGetMyBusinesses({
    query: {
      staleTime: onOnboarding || onLegalAcceptance ? 60_000 : 0,
      refetchOnMount: onOnboarding || onLegalAcceptance ? false : "always",
      refetchOnWindowFocus: !(onOnboarding || onLegalAcceptance),
      retry: onOnboarding || onLegalAcceptance ? 2 : 1,
    } as never,
  });
  const { data: meLegal, isLoading: meLegalLoading } = useQuery({
    queryKey: ["me-legal"],
    queryFn: () => apiFetch<{ platformLegalAccepted?: boolean }>("/me"),
    enabled: onLegalAcceptance,
    staleTime: 60_000,
    retry: 2,
  });
  const { user } = useUser();
  const demoEmail = isDemoAccountEmail(user?.primaryEmailAddress?.emailAddress);
  const clerkUserId = user?.id ?? "";
  const email = user?.primaryEmailAddress?.emailAddress ?? null;

  const list = useMemo(() => {
    const raw = normalizeBusinessList(businesses);
    return filterSessionBusinesses(raw, email);
  }, [businesses, email]);

  useEffect(() => {
    pruneStalePersistedBusinessId(new Set(list.map((b) => b.id)));
  }, [list]);

  const initialBusiness = useMemo(() => {
    return pickPrimarySessionBusiness(
      list as SessionBusinessLike[],
      clerkUserId,
      email,
      readPersistedBusinessId(),
    );
  }, [list, clerkUserId, email]);

  useEffect(() => {
    const businessId = initialBusiness?.id;
    if (!businessId) return;
    warmTenantPresentationSkin(queryClient, businessId, initialBusiness, "owner");
    void prefetchTenantDashboardShell(queryClient, businessId).then(() => {
      applyTenantShellFromCache(queryClient, businessId);
    });
  }, [initialBusiness, queryClient]);

  if (isLoading && !onOnboarding && !onLegalAcceptance) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    );
  }

  if (isError && !onOnboarding && !onLegalAcceptance && !businesses) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <p className="text-lg font-medium text-foreground">Could not load your account</p>
        <p className="max-w-md text-sm text-muted-foreground">
          Your session is valid but we could not reach your shop list. Check your connection and try
          again.
        </p>
        <button
          type="button"
          className="text-sm font-medium text-primary underline underline-offset-2"
          onClick={() => void refetch()}
        >
          Retry
        </button>
      </div>
    );
  }

  const hasAny = list.length > 0;

  const sessionLanding = resolvePostLegalDestination({
    businesses: list as SessionBusinessLike[],
    clerkUserId,
    email,
  });
  if (sessionLanding === "/onboarding" && location === "/dashboard") {
    return <Redirect to="/onboarding" />;
  }

  if (!hasAny && location !== "/onboarding" && location !== "/legal-acceptance") {
    // Demo roster accounts need provisioned world + membership — send to launcher, not self-serve onboarding.
    if (
      demoEmail &&
      !location.startsWith("/demo/")
    ) {
      if (isLocalDashboardDev()) {
        return <Redirect to="/demo" />;
      }
      return <ProspectDemoRedirect />;
    }
    return <Redirect to="/onboarding" />;
  }

  if (
    onLegalAcceptance &&
    !meLegalLoading &&
    meLegal?.platformLegalAccepted
  ) {
    const dest = resolvePostLegalDestination({
      businesses: list as SessionBusinessLike[],
      clerkUserId,
      email,
    });
    return <Redirect to={dest} />;
  }

  if (
    !skipLegalGate &&
    location === "/legal-acceptance" &&
    shouldSkipLegalToDashboard({
      businesses: list as SessionBusinessLike[],
      clerkUserId,
      email,
    })
  ) {
    return <Redirect to="/dashboard" />;
  }

  return (
    <BusinessProvider
      businesses={list}
      isLoading={onOnboarding ? isLoading : isLoading || isFetching}
      clerkUserId={clerkUserId}
      sessionEmail={email}
      initialBusinessId={initialBusiness?.id ?? null}
    >
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

  const onboardingState = (business as { onboardingState?: OnboardingState; vertical?: string })
    .onboardingState;
  const vertical = (business as { vertical?: string }).vertical;
  if (isOnboardingAppUnlocked(onboardingState, vertical)) return <>{children}</>;

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
  const { businesses, business } = useBusiness();
  const [location, navigate] = useLocation();

  useEffect(() => {
    if (isLoading || personaLoading) return;

    const vertical = (business as { vertical?: string } | undefined)?.vertical ?? null;
    let home = resolvePersonaRitual(persona, vertical).homePath;
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
      const v = (business as { vertical?: string } | null)?.vertical;
      navigate(
        v === "wellness" ? "/wellness-reception" : v === "beauty" ? "/beauty-reception" : "/bookings",
        { replace: true },
      );
    }
  }, [effectiveRole, isLoading, location, navigate, persona, personaLoading, businesses.length, business]);

  return <>{children}</>;
}
