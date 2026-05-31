import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { uploadImageFile } from "@/lib/upload-media";
import { useBusiness } from "@/lib/business-context";
import { useToast } from "@/hooks/use-toast";
import { customFetch, getGetBusinessQueryKey, useUpdateBusiness } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, ExternalLink, Palette, Smartphone } from "lucide-react";
import { applyPresentationTheme } from "@/lib/experience-theme";
import { accentMeetsWcagAa } from "@/lib/brand-contrast";
import { cn } from "@/lib/utils";

type PresentationPreset = {
  id: string;
  label: string;
  description: string;
  cssPreset: string;
};

type PresentationPayload = {
  presetId: string;
  preset: PresentationPreset;
  brandAccentHex: string | null;
  presetsEnabled: boolean;
  availablePresets: PresentationPreset[];
};

export function presentationPresetsUiEnabled(): boolean {
  if (import.meta.env.DEV) return true;
  if (import.meta.env.VITE_PRESENTATION_PRESETS === "true") return true;
  if (typeof window !== "undefined" && window.location.hostname.includes("staging")) return true;
  return false;
}

type BrandFields = {
  logoUrl: string;
  coverImageUrl: string;
};

type Props = {
  editable?: boolean;
  brandFields: BrandFields;
  onBrandFieldsChange: (fields: BrandFields) => void;
};

export function PublicAppearancePanel({ editable = true, brandFields, onBrandFieldsChange }: Props) {
  const { business } = useBusiness();
  const { toast } = useToast();
  const qc = useQueryClient();
  const bid = business?.id ?? "";
  const slug = business?.slug ?? "";
  const updateBusiness = useUpdateBusiness();

  const [data, setData] = useState<PresentationPayload | null>(null);
  const [presetId, setPresetId] = useState("");
  const [accent, setAccent] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState<"logo" | "cover" | null>(null);
  const [previewKey, setPreviewKey] = useState(0);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const previewUrl = slug ? `/b/${slug}` : "";
  const contrastOk = accentMeetsWcagAa(accent);

  useEffect(() => {
    if (!bid || !presentationPresetsUiEnabled()) return;
    void customFetch<PresentationPayload>(`/api/businesses/${bid}/presentation`)
      .then((d) => {
        setData(d);
        setPresetId(d.presetId);
        setAccent(d.brandAccentHex ?? "");
        applyPresentationTheme({ cssPreset: d.preset.cssPreset, brandAccentHex: d.brandAccentHex });
      })
      .catch(() => setData(null));
  }, [bid]);

  const refreshPreview = useCallback(() => {
    setPreviewKey((k) => k + 1);
  }, []);

  const persist = useCallback(
    async (next: {
      presentationPresetId?: string;
      brandAccentHex?: string | null;
      logoUrl?: string;
      coverImageUrl?: string;
    }) => {
      if (!bid || !editable) return;
      setBusy(true);
      try {
        if (next.presentationPresetId !== undefined || next.brandAccentHex !== undefined) {
          const updated = await customFetch<PresentationPayload>(`/api/businesses/${bid}/presentation`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              presentationPresetId: next.presentationPresetId,
              brandAccentHex: next.brandAccentHex,
            }),
          });
          setData(updated);
          setPresetId(updated.presetId);
          setAccent(updated.brandAccentHex ?? "");
          applyPresentationTheme({
            cssPreset: updated.preset.cssPreset,
            brandAccentHex: updated.brandAccentHex,
          });
        }
        const brandPatch: Record<string, string | null> = {};
        if (next.logoUrl !== undefined) brandPatch.logoUrl = next.logoUrl.trim() || null;
        if (next.coverImageUrl !== undefined) brandPatch.coverImageUrl = next.coverImageUrl.trim() || null;
        if (Object.keys(brandPatch).length > 0) {
          await updateBusiness.mutateAsync({ businessId: bid, data: brandPatch as never });
          await qc.invalidateQueries({ queryKey: getGetBusinessQueryKey(bid) });
        }
        refreshPreview();
      } catch {
        toast({ title: "Could not save appearance", variant: "destructive" });
      } finally {
        setBusy(false);
      }
    },
    [bid, editable, qc, refreshPreview, toast, updateBusiness],
  );

  const scheduleSave = useCallback(
    (patch: Parameters<typeof persist>[0]) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        void persist(patch);
      }, 300);
    },
    [persist],
  );

  const selectedPresetMeta = data?.availablePresets.find((p) => p.id === presetId);

  const previewIframeSrc = useMemo(() => {
    if (!previewUrl) return "";
    const params = new URLSearchParams({ preview: "1", v: String(previewKey) });
    const cssPreset = selectedPresetMeta?.cssPreset ?? presetId;
    if (cssPreset) params.set("preset", cssPreset);
    if (accent.trim()) params.set("accent", accent.trim());
    return `${previewUrl}?${params.toString()}`;
  }, [previewUrl, previewKey, selectedPresetMeta?.cssPreset, presetId, accent]);

  function selectPreset(id: string) {
    setPresetId(id);
    const preset = data?.availablePresets.find((p) => p.id === id);
    if (preset) {
      applyPresentationTheme({
        cssPreset: preset.cssPreset,
        brandAccentHex: accent.trim() || null,
      });
      refreshPreview();
    }
    scheduleSave({ presentationPresetId: id, brandAccentHex: accent.trim() || null });
  }

  function onAccentChange(value: string) {
    setAccent(value);
    if (value.trim() && !accentMeetsWcagAa(value)) return;
    applyPresentationTheme({
      cssPreset: selectedPresetMeta?.cssPreset ?? undefined,
      brandAccentHex: value.trim() || null,
    });
    refreshPreview();
    scheduleSave({ presentationPresetId: presetId, brandAccentHex: value.trim() || null });
  }

  async function uploadBrandImage(kind: "logo" | "cover", file: File) {
    if (!bid || !editable) return;
    setUploading(kind);
    try {
      const { url } = await uploadImageFile(bid, file, { entityType: "business" });
      if (kind === "logo") {
        onBrandFieldsChange({ ...brandFields, logoUrl: url });
        await persist({ logoUrl: url });
      } else {
        onBrandFieldsChange({ ...brandFields, coverImageUrl: url });
        await persist({ coverImageUrl: url });
      }
      toast({ title: kind === "logo" ? "Logo uploaded" : "Cover uploaded" });
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploading(null);
    }
  }

  function copyLink() {
    if (!previewUrl) return;
    const full = `${window.location.origin}${previewUrl}`;
    void navigator.clipboard.writeText(full);
    toast({ title: "Booking link copied" });
  }

  if (!presentationPresetsUiEnabled() || !data?.presetsEnabled) {
    return (
      <Card data-testid="public-appearance-panel">
        <CardHeader>
          <CardTitle className="text-base">Public appearance</CardTitle>
          <CardDescription>
            Preset picker rolls out with presentation presets promotion. Your `/b` page uses your vertical template today.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-8" data-testid="public-appearance-panel">
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            Live preview
          </CardTitle>
          <CardDescription>
            Updates as you change preset or accent — same `/b` page your clients book on.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center pb-8">
          <div
            className="w-full max-w-[440px] rounded-[2rem] border-[10px] border-foreground/10 bg-background shadow-2xl overflow-hidden motion-preview-crossfade"
            data-testid="public-b-preview-frame"
          >
            <div className="h-[min(85vh,920px)] w-full bg-muted">
              {previewIframeSrc ? (
                <iframe
                  key={previewIframeSrc}
                  title="Public booking preview"
                  src={previewIframeSrc}
                  className="h-full w-full border-0 bg-background"
                  data-testid="public-b-preview-iframe"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground p-6 text-center">
                  Save a slug to preview your public page.
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Public appearance
            </CardTitle>
            <CardDescription>
              What customers see on `/b/{slug}` — preset morph + brand. Changes save automatically and refresh the preview.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>Preset</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {data.availablePresets.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    disabled={!editable || busy}
                    data-testid={`preset-card-${p.id}`}
                    onClick={() => selectPreset(p.id)}
                    className={cn(
                      "rounded-lg border p-3 text-left transition-colors",
                      presetId === p.id
                        ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                        : "border-border hover:border-primary/40",
                    )}
                  >
                    <p className="text-sm font-medium">{p.label}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Logo</Label>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void uploadBrandImage("logo", file);
                  e.target.value = "";
                }}
              />
              <div className="flex flex-wrap items-center gap-3">
                {brandFields.logoUrl ? (
                  <img
                    src={brandFields.logoUrl}
                    alt=""
                    className="h-12 w-12 rounded-lg object-contain bg-muted border"
                  />
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!editable || uploading === "logo"}
                  data-testid="appearance-logo-upload"
                  onClick={() => logoInputRef.current?.click()}
                >
                  {uploading === "logo" ? "Uploading…" : "Upload logo"}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Cover image</Label>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void uploadBrandImage("cover", file);
                  e.target.value = "";
                }}
              />
              <div className="flex flex-wrap items-center gap-3">
                {brandFields.coverImageUrl ? (
                  <img
                    src={brandFields.coverImageUrl}
                    alt=""
                    className="h-14 w-24 rounded-lg object-cover bg-muted border"
                  />
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!editable || uploading === "cover"}
                  data-testid="appearance-cover-upload"
                  onClick={() => coverInputRef.current?.click()}
                >
                  {uploading === "cover" ? "Uploading…" : "Upload cover"}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="appearance-accent">Brand accent</Label>
              <Input
                id="appearance-accent"
                value={accent}
                disabled={!editable}
                data-testid="presentation-accent-input"
                placeholder="#D4A72C"
                onChange={(e) => onAccentChange(e.target.value)}
              />
              {!contrastOk && accent.trim() ? (
                <p className="text-xs text-destructive" data-testid="accent-contrast-warning">
                  Accent doesn&apos;t meet contrast on white — pick a darker colour.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">Used on buttons and links on your public page.</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Public link</Label>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-muted rounded-md px-3 py-2 text-sm font-mono truncate">
                  {previewUrl || "—"}
                </div>
                <Button type="button" variant="outline" size="icon" aria-label="Copy link" onClick={copyLink}>
                  <Copy className="h-4 w-4" />
                </Button>
                {previewUrl ? (
                  <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                    <Button type="button" variant="outline" size="icon" aria-label="Open public page">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </a>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/** @deprecated use PublicAppearancePanel */
export function PresentationPresetControls() {
  return (
    <PublicAppearancePanel
      brandFields={{ logoUrl: "", coverImageUrl: "" }}
      onBrandFieldsChange={() => undefined}
      editable={false}
    />
  );
}
