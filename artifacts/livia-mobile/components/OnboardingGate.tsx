import { useGetBusiness } from "@workspace/api-client-react";
import { isOnboardingAppUnlocked, type OnboardingState } from "@workspace/policy";
import { useRouter, useSegments } from "expo-router";
import React, { useEffect, type ReactNode } from "react";
import { useBusiness } from "@/contexts/BusinessContext";
import { useMembership } from "@/hooks/useMembership";
import { isDemoRoute, isGuestPublicRoute } from "@/lib/navigation";

const EXEMPT_ROOTS = new Set([
  "onboarding",
  "onboarding-setup",
  "onboarding-continue",
  "legal-acceptance",
  "sign-in",
  "settings",
  "demo",
  "my-livia",
  "my",
  "guest-surface",
  "public-book",
]);

/** Mirrors web `OnboardingGate` — owners finish essentials before full app. */
export function OnboardingGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const { currentBusiness, isDemoAccount, isLoading: bizLoading } = useBusiness();
  const { role, isLoading: roleLoading } = useMembership();
  const bid = currentBusiness?.id ?? "";
  const { data: biz } = useGetBusiness(bid, {
    query: { enabled: !!bid } as never,
  });

  const root = segments[0] ?? "";
  const exempt =
    isDemoRoute(segments) || isGuestPublicRoute(segments) || EXEMPT_ROOTS.has(root);

  useEffect(() => {
    if (bizLoading || roleLoading || exempt || !currentBusiness || isDemoAccount) return;
    if (role !== "OWNER") return;
    const state = (biz as { onboardingState?: OnboardingState } | undefined)?.onboardingState ??
      (currentBusiness as { onboardingState?: OnboardingState }).onboardingState;
    if (isOnboardingAppUnlocked(state)) return;
    router.replace("/onboarding-setup");
  }, [
    bizLoading,
    roleLoading,
    exempt,
    currentBusiness,
    isDemoAccount,
    role,
    biz,
    router,
  ]);

  return <>{children}</>;
}
