import type { QueryClient } from "@tanstack/react-query";
import {
  getGetActivityFeedQueryOptions,
  getGetDashboardSummaryQueryOptions,
  getGetMyBusinessesQueryOptions,
} from "@workspace/api-client-react";
import { applyTenantPresentationSurface, resolvePresentationColorMode } from "@/lib/experience-theme";
import {
  fetchTenantExperience,
  type TenantExperienceResponse,
} from "@/lib/tenant-experience-api";

export const tenantExperienceQueryKey = (businessId: string) =>
  ["tenant-experience", businessId] as const;

/** Warm React Query + document skin while the handoff veil is up. */
export async function prefetchTenantDashboardShell(
  queryClient: QueryClient,
  businessId: string | undefined,
): Promise<void> {
  if (!businessId) return;
  await Promise.allSettled([
    queryClient.prefetchQuery(getGetMyBusinessesQueryOptions()),
    queryClient.prefetchQuery({
      queryKey: tenantExperienceQueryKey(businessId),
      queryFn: () => fetchTenantExperience(businessId),
    }),
    queryClient.prefetchQuery(getGetDashboardSummaryQueryOptions(businessId)),
    queryClient.prefetchQuery(getGetActivityFeedQueryOptions(businessId, { limit: 12 })),
  ]);
}

/** Apply W4 presentation under an opaque handoff veil (avoids gateway flash). */
export function applyTenantShellFromCache(
  queryClient: QueryClient,
  businessId: string,
): boolean {
  const te = queryClient.getQueryData<TenantExperienceResponse>(
    tenantExperienceQueryKey(businessId),
  );
  if (!te) return false;

  const p = te.presentation;
  const colorMode =
    p?.tokens?.colorMode === "light" || p?.tokens?.colorMode === "dark"
      ? p.tokens.colorMode
      : resolvePresentationColorMode(p?.cssPreset);
  applyTenantPresentationSurface({
    vertical: te.vertical,
    cssPreset: p?.cssPreset ?? "platform-default",
    brandAccentHex: p?.brandAccentHex,
    colorMode: colorMode ?? null,
  });
  return true;
}
