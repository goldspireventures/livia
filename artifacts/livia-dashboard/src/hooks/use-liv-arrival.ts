import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  getDashboardSummary,
  getGetDashboardSummaryQueryKey,
  getGetLivSetupGuidedFlowQueryKey,
  useGetDashboardSummary,
  useGetLivSetupGuidedFlow,
  type LivSetupGuidedFlow,
} from "@workspace/api-client-react";
import {
  buildSetupGuidedFlow,
  isPlatformTourDismissed,
  readLivArrivalDismissed,
  shouldShowLivArrivalConductor,
  shouldSuppressDuplicateSetupBanners,
  writeLivArrivalDismissed,
  type OnboardingState,
} from "@workspace/policy";
import { useBusiness } from "@/lib/business-context";
import { useMembership } from "@/lib/membership-context";
import { isDemoTenantSlug } from "@/lib/demo-tenant";

const PLATFORM_TOUR_EVENT = "livia:platform-tour-dismissed";

export function useLivArrival() {
  const { business } = useBusiness();
  const { effectiveRole } = useMembership();
  const qc = useQueryClient();
  const [location] = useLocation();
  const bid = business?.id ?? "";
  const isOwnerOrAdmin = ["OWNER", "ADMIN"].includes(effectiveRole ?? "");
  const isDemo = business?.slug ? isDemoTenantSlug(business.slug) : false;
  const raw = (business as { onboardingState?: OnboardingState } | null)?.onboardingState;

  const [tourDismissed, setTourDismissed] = useState(() =>
    typeof window === "undefined" ? false : isPlatformTourDismissed(),
  );
  const [arrivalDismissed, setArrivalDismissed] = useState(() =>
    bid ? readLivArrivalDismissed(bid) : false,
  );

  useEffect(() => {
    if (!bid) return;
    setArrivalDismissed(readLivArrivalDismissed(bid));
  }, [bid]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const syncTour = () => setTourDismissed(isPlatformTourDismissed());
    syncTour();
    window.addEventListener(PLATFORM_TOUR_EVENT, syncTour);
    window.addEventListener("storage", syncTour);
    return () => {
      window.removeEventListener(PLATFORM_TOUR_EVENT, syncTour);
      window.removeEventListener("storage", syncTour);
    };
  }, []);

  const { data: dashboard } = useGetDashboardSummary(bid, {
    query: { enabled: !!bid && isOwnerOrAdmin } as never,
  });
  const { data: guidedFlow, refetch: refetchFlow, isPending, isFetching } = useGetLivSetupGuidedFlow(bid, {
    query: {
      enabled: !!bid && isOwnerOrAdmin,
      staleTime: 60_000,
      placeholderData: (prev: LivSetupGuidedFlow | undefined) => prev,
    } as never,
  });

  const gateArgs = useMemo(
    () => ({
      activation: dashboard?.activation,
      onboardingState: raw,
      vertical: (business as { vertical?: string } | null)?.vertical,
      slug: business?.slug,
      isDemoTenant: isDemo,
      isOwnerOrAdmin,
      arrivalDismissed,
      platformTourDismissed: tourDismissed,
    }),
    [dashboard?.activation, raw, business, isDemo, isOwnerOrAdmin, arrivalDismissed, tourDismissed],
  );

  const suppressDuplicateSetupBanners = shouldSuppressDuplicateSetupBanners(gateArgs);
  const isConductorActive = shouldShowLivArrivalConductor(gateArgs);

  const flow =
    guidedFlow ??
    buildSetupGuidedFlow({
      onboardingState: raw,
      vertical: (business as { vertical?: string } | null)?.vertical,
      slug: business?.slug,
      sacredMetricMet: dashboard?.activation?.sacredMetricMet === true,
    });

  const currentPhase = flow.phases.find((p) => p.current) ?? flow.phases[0];
  const stepIndex = currentPhase ? flow.phases.findIndex((p) => p.id === currentPhase.id) + 1 : 1;
  const totalSteps = flow.phases.length;

  const dismiss = useCallback(() => {
    if (!bid) return;
    writeLivArrivalDismissed(bid);
    setArrivalDismissed(true);
  }, [bid]);

  const advanceBeat = useCallback(async (): Promise<{ sacredMetricMet: boolean }> => {
    await refetchFlow();
    await qc.invalidateQueries({ queryKey: getGetLivSetupGuidedFlowQueryKey(bid) });
    const summary = await qc.fetchQuery({
      queryKey: getGetDashboardSummaryQueryKey(bid),
      queryFn: () => getDashboardSummary(bid),
    });
    return { sacredMetricMet: summary.activation?.sacredMetricMet === true };
  }, [refetchFlow, qc, bid]);

  const locationRef = useRef(location);

  // Refetch beat when owner returns from a "Show me" screen — not on first mount.
  useEffect(() => {
    if (!isConductorActive || !bid) return;
    if (locationRef.current === location) return;
    locationRef.current = location;
    void advanceBeat();
  }, [location, isConductorActive, bid, advanceBeat]);

  useEffect(() => {
    if (!isConductorActive || typeof window === "undefined") return;
    const onFocus = () => void advanceBeat();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [isConductorActive, advanceBeat]);

  return {
    suppressDuplicateSetupBanners,
    isConductorActive,
    dismiss,
    advanceBeat,
    flow,
    capabilityBlockers: guidedFlow?.capabilityBlockers ?? [],
    currentPhase,
    stepIndex,
    totalSteps,
    isRefreshing: isFetching && !!guidedFlow,
    isLoading: isPending && !guidedFlow,
    sacredMetricMet: dashboard?.activation?.sacredMetricMet === true,
  };
}

export { PLATFORM_TOUR_EVENT };
