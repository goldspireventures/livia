import { useBusiness } from "@/contexts/BusinessContext";
import { useTenantPresentation } from "@/contexts/PresentationThemeContext";
import {
  beautyNativeMorphForVertical,
  wellnessNativeMorphForVertical,
} from "@/lib/presentation-layout";
import type { PresentationLayoutMorph } from "@workspace/policy";

export function usePresentationMorph(): {
  vertical: string | null;
  cssPreset: string | null;
  morph: PresentationLayoutMorph;
  beautyMorph: PresentationLayoutMorph | null;
  wellnessMorph: PresentationLayoutMorph | null;
  isConstellation: boolean;
  nativeMorph: PresentationLayoutMorph | null;
} {
  const { currentBusiness } = useBusiness();
  const presentation = useTenantPresentation();
  const vertical = (currentBusiness as { vertical?: string } | undefined)?.vertical ?? null;
  const morph = presentation.layoutMorph;
  const beautyMorph = beautyNativeMorphForVertical(vertical, morph);
  const wellnessMorph = wellnessNativeMorphForVertical(vertical, morph);
  const isConstellation =
    presentation.isConstellation && !beautyMorph && !wellnessMorph;
  const nativeMorph = beautyMorph ?? wellnessMorph ?? (isConstellation ? "constellation" : null);

  return {
    vertical,
    cssPreset: presentation.cssPreset,
    morph,
    beautyMorph,
    wellnessMorph,
    isConstellation,
    nativeMorph,
  };
}
