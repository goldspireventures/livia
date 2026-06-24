import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { customFetch } from "@workspace/api-client-react";
import { applyTenantPresentationSurface, resolvePresentationColorMode } from "@/lib/experience-theme";
import { presentationPresetsUiEnabled } from "@/components/settings/public-appearance-panel";
import { useBusiness } from "@/lib/business-context";
import {
  presetCardSwatch,
  isBeautyVertical,
  isWellnessVertical,
} from "@/lib/presentation-layout";
import { layoutMorphLabel } from "@/lib/presentation-surface";
import {
  resolvePresentationLayoutMorph,
  resolveBeautyPickerMeta,
  beautyLayoutMorphLabel,
  listPresentationPresetsForTenantPicker,
  type BusinessVertical,
} from "@workspace/policy";
import { cn } from "@/lib/utils";
import { Palette } from "lucide-react";

type Preset = { id: string; label: string; description: string; cssPreset: string };

type PresentationPayload = {
  presetId: string;
  preset: Preset;
  availablePresets: Preset[];
  brandAccentHex: string | null;
};

type Props = {
  businessId: string;
  onReviewed?: () => void;
};

export function OnboardingPresentationPick({ businessId, onReviewed }: Props) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { business } = useBusiness();
  const [data, setData] = useState<PresentationPayload | null>(null);
  const [busy, setBusy] = useState(false);
  const vertical = (business as { vertical?: string } | null)?.vertical ?? null;

  useEffect(() => {
    if (!businessId || !presentationPresetsUiEnabled()) return;
    void customFetch<PresentationPayload>(`/api/businesses/${businessId}/presentation`)
      .then((d) => {
        setData(d);
        applyTenantPresentationSurface({
          vertical,
          cssPreset: d.preset.cssPreset,
          brandAccentHex: d.brandAccentHex,
          colorMode: resolvePresentationColorMode(d.preset.cssPreset),
        });
      })
      .catch(() => setData(null));
  }, [businessId, vertical]);

  const beautyAppearance = isBeautyVertical(vertical);
  const wellnessAppearance = isWellnessVertical(vertical);

  const pickerPresets = useMemo((): Preset[] => {
    if (vertical && (beautyAppearance || wellnessAppearance)) {
      return listPresentationPresetsForTenantPicker(vertical as BusinessVertical).map((p) => ({
        id: p.id,
        label: p.label,
        description: p.description,
        cssPreset: p.cssPreset,
      }));
    }
    return data?.availablePresets ?? [];
  }, [vertical, beautyAppearance, wellnessAppearance, data?.availablePresets]);

  if (!presentationPresetsUiEnabled() || pickerPresets.length === 0 || !data) return null;

  async function pickPreset(id: string) {
    setBusy(true);
    try {
      const next = await customFetch<PresentationPayload>(`/api/businesses/${businessId}/presentation`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ presentationPresetId: id }),
      });
      setData(next);
      applyTenantPresentationSurface({
        vertical,
        cssPreset: next.preset.cssPreset,
        brandAccentHex: next.brandAccentHex,
        colorMode: resolvePresentationColorMode(next.preset.cssPreset),
      });
      await qc.invalidateQueries({ queryKey: ["tenant-experience", businessId] });
      onReviewed?.();
      toast({ title: "Look updated", description: next.preset.label });
    } catch {
      toast({ title: "Could not save preset", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3"
      data-testid="onboarding-presentation-pick"
    >
      <div className="flex items-center gap-2">
        <Palette className="h-4 w-4 text-primary" aria-hidden />
        <Label className="text-sm font-medium">How customers see your booking page</Label>
      </div>
      <p className="text-xs text-muted-foreground">
        Each preset changes layout and colours for your app and booking link — pick what fits your studio.
        Change anytime under Settings → Appearance.
      </p>
      <div
        className={cn(
          "grid gap-2",
          pickerPresets.length <= 3 ? "sm:grid-cols-3" : "sm:grid-cols-2",
        )}
      >
        {pickerPresets.map((p) => {
          const swatch = presetCardSwatch(p.cssPreset, vertical);
          const morph =
            vertical && (beautyAppearance || wellnessAppearance)
              ? resolvePresentationLayoutMorph(vertical as BusinessVertical, p.id)
              : null;
          const beautyMeta = beautyAppearance ? resolveBeautyPickerMeta(p.id) : null;
          const morphLabel = beautyAppearance
            ? beautyLayoutMorphLabel(morph)
            : morph
              ? layoutMorphLabel(morph)
              : null;
          return (
            <Button
              key={p.id}
              type="button"
              variant={data.presetId === p.id ? "default" : "outline"}
              disabled={busy}
              className={cn("h-auto py-3 text-left justify-start flex-col items-start")}
              data-testid={`onboarding-preset-${p.id}`}
              onClick={() => void pickPreset(p.id)}
            >
              {swatch ? (
                <div
                  className="h-6 w-full rounded-md mb-2"
                  style={{
                    background: `linear-gradient(135deg, hsl(${swatch.a}) 0%, hsl(${swatch.b}) 100%)`,
                  }}
                  aria-hidden
                />
              ) : null}
              <span className="font-medium text-sm">{p.label}</span>
              {morphLabel ? (
                <span className="text-[10px] font-semibold uppercase tracking-wider opacity-80 mt-0.5">
                  {morphLabel}
                </span>
              ) : null}
              {beautyMeta ? (
                <span className="text-[11px] text-muted-foreground font-normal mt-0.5 line-clamp-2">
                  {beautyMeta.whenToPick}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground font-normal">{p.description}</span>
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
