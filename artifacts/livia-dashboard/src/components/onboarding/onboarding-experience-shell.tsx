import { useEffect, type ReactNode } from "react";
import { applyExperienceTheme, clearExperienceTheme } from "@/lib/experience-theme";
import type { BusinessVertical } from "@workspace/policy";

/** Applies vertical + market theme during onboarding (preview before business exists). */
export function OnboardingExperienceShell({
  vertical,
  country,
  children,
}: {
  vertical?: BusinessVertical | string | null;
  country?: string | null;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!vertical) {
      clearExperienceTheme();
      return;
    }
    applyExperienceTheme({ vertical, country, persona: "owner" });
    return () => clearExperienceTheme();
  }, [vertical, country]);

  return <>{children}</>;
}
