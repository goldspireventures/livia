import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetLivSetupGuidedFlowQueryKey,
  useGetDashboardSummary,
  useGetLivSetupGuidedFlow,
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
  const { data: guidedFlow, refetch: refetchFlow, isLoading } = useGetLivSetupGuidedFlow(bid, {
    query: { enabled: !!bid && isOwnerOrAdmin } as never,
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

  const advanceBeat = useCallback(async () => {
    await refetchFlow();
    void qc.invalidateQueries({ queryKey: getGetLivSetupGuidedFlowQueryKey(bid) });
  }, [refetchFlow, qc, bid]);

  return {
    suppressDuplicateSetupBanners,
    isConductorActive,
    dismiss,
    advanceBeat,
    flow,
    currentPhase,
    stepIndex,
    totalSteps,
    isLoading: isLoading && !guidedFlow,
    sacredMetricMet: dashboard?.activation?.sacredMetricMet === true,
  };
}

export { PLATFORM_TOUR_EVENT };
