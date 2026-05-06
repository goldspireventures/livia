import { useAuth } from "@clerk/clerk-react";
import { Redirect, useLocation } from "wouter";
import { useGetMyBusinesses } from "@workspace/api-client-react";
import { BusinessProvider } from "@/lib/business-context";
import { MembershipProvider, useMembership } from "@/lib/membership-context";
import { Spinner } from "@/components/ui/spinner";
import { ReactNode, useEffect } from "react";
import { apiFetch } from "@/lib/api-fetch";
import { useQuery } from "@tanstack/react-query";

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

export function AuthGuard({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const [location] = useLocation();

  // Fire-and-forget; we don't block render on it. If the user has no
  // pending invites, the endpoint returns `{ accepted: [] }` immediately.
  useAcceptPendingInvites(!!isLoaded && !!isSignedIn);

  if (!isLoaded) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    );
  }

  if (!isSignedIn) {
    return <Redirect to={`/sign-in?redirect_url=${encodeURIComponent(location)}`} />;
  }

  return <BusinessDataLoader>{children}</BusinessDataLoader>;
}

function BusinessDataLoader({ children }: { children: ReactNode }) {
  const { data: businesses, isLoading } = useGetMyBusinesses();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    );
  }

  const business = businesses && businesses.length > 0 ? businesses[0] : null;

  if (!business && location !== "/onboarding") {
    return <Redirect to="/onboarding" />;
  }

  return (
    <BusinessProvider initialBusiness={business} isLoading={isLoading}>
      <MembershipProvider>
        <RoleGate>{children}</RoleGate>
      </MembershipProvider>
    </BusinessProvider>
  );
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
  const [location, navigate] = useLocation();

  useEffect(() => {
    if (isLoading) return;
    if (effectiveRole === "STAFF" && STAFF_BLOCKED_LANDING.has(location)) {
      navigate("/my-day", { replace: true });
    }
  }, [effectiveRole, isLoading, location, navigate]);

  return <>{children}</>;
}
