import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-fetch";
import type { TenantExperience, TenantExperiencePublicAppearance } from "@workspace/policy";

export type TenantPresentation = {
  presetId: string;
  cssPreset: string;
  label: string;
  brandAccentHex: string | null;
  presetsEnabled: boolean;
  tokens: {
    colorMode: string;
    density: string;
    display: string;
    layout: string;
    shell: string;
    radius: string;
    motion: string;
  };
};

export type TenantExperienceResponse = TenantExperience & {
  presentation?: TenantPresentation;
  publicAppearance?: TenantExperiencePublicAppearance;
};

export function fetchTenantExperience(businessId: string) {
  return apiFetch<TenantExperienceResponse>(
    `/me/tenant-experience?businessId=${encodeURIComponent(businessId)}`,
  );
}

export function useTenantExperience(businessId: string | undefined) {
  return useQuery({
    queryKey: ["tenant-experience", businessId],
    queryFn: () => fetchTenantExperience(businessId!),
    enabled: !!businessId,
    staleTime: 60_000,
  });
}
