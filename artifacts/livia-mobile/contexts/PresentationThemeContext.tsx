import React, { createContext, useContext, useMemo, type ReactNode } from "react";
import { useBusiness } from "@/contexts/BusinessContext";
import { useTenantExperience } from "@/hooks/useTenantExperience";
import {
  resolvePresentationMobileColors,
  type PresentationColorOverrides,
} from "@/lib/presentation-preset-colors";

const PresentationThemeContext = createContext<PresentationColorOverrides | null>(null);

export function PresentationThemeProvider({ children }: { children: ReactNode }) {
  const { currentBusiness } = useBusiness();
  const bid = currentBusiness?.id;
  const { data: raw } = useTenantExperience(bid);
  const presentation = (
    raw as {
      presentation?: { cssPreset?: string; brandAccentHex?: string | null };
      publicAppearance?: { brandAccentHex?: string | null };
    } | null | undefined
  )?.presentation;

  const overrides = useMemo(
    () =>
      resolvePresentationMobileColors(
        presentation?.cssPreset,
        presentation?.brandAccentHex ??
          (raw as { publicAppearance?: { brandAccentHex?: string | null } } | null)?.publicAppearance
            ?.brandAccentHex,
      ),
    [presentation?.cssPreset, presentation?.brandAccentHex, raw],
  );

  const hasOverrides = Object.keys(overrides).length > 0;

  return (
    <PresentationThemeContext.Provider value={hasOverrides ? overrides : null}>
      {children}
    </PresentationThemeContext.Provider>
  );
}

export function usePresentationColorOverrides(): PresentationColorOverrides | null {
  return useContext(PresentationThemeContext);
}
