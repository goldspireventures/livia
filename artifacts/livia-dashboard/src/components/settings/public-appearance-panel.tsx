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
import { Copy, ExternalLink, LayoutDashboard, Palette, Smartphone } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { resolvePresentationColorMode } from "@/lib/experience-theme";
import { accentMeetsWcagAa } from "@/lib/brand-contrast";
import { cn } from "@/lib/utils";
import { useTenantExperience } from "@/lib/tenant-experience-api";
import { clientGuestBookAbsoluteUrl, clientGuestBookHref } from "@/lib/guest-book-url";
import { publicEventVendorSiteUrl } from "@/lib/surface-urls";
import {
  resolvePresentationLayoutMorph,
  resolvePresetPickerMeta,
  beautyLayoutMorphLabel,
  listPresentationPresetsForTenantPicker,
  type BusinessVertical,
} from "@workspace/policy";
import {
  presetCardSwatch,
  isBeautyVertical,
  isWellnessVertical,
  isBodyArtVertical,
} from "@/lib/presentation-layout";
import { layoutMorphLabel } from "@/lib/presentation-surface";
import { appearancePreviewDashboardPath } from "@/lib/appearance-preview-mode";

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
  /** When false, preview iframes stay unloaded (avoids work on other settings tabs). */
  appearanceTabActive?: boolean;
};

export function PublicAppearancePanel({
  editable = true,
  brandFields,
  onBrandFieldsChange,
  appearanceTabActive = true,
}: Props) {
  const { business } = useBusiness();
  const { toast } = useToast();
  const qc = useQueryClient();
  const bid = business?.id ?? "";
  const slug = business?.slug ?? "";
  const updateBusiness = useUpdateBusiness();

  const [data, setData] = useState<PresentationPayload | null>(null);
  const [presetId, setPresetId] = useState("");
  const [draftPresetId, setDraftPresetId] = useState("");
  const [accent, setAccent] = useState("");
  const [draftAccent, setDraftAccent] = useState("");
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState<"logo" | "cover" | null>(null);
  const [publicPreviewBust, setPublicPreviewBust] = useState(0);
  const [iframeLoading, setIframeLoading] = useState({ public: false, app: false });
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const loadedPreviewQuery = useRef<string | null>(null);

  const contrastOk = accentMeetsWcagAa(draftAccent);

  const { data: tenantXp } = useTenantExperience(bid || undefined);
  const tenantVertical = (tenantXp as { vertical?: string } | undefined)?.vertical ?? null;

  const isEventVendor = tenantVertical === "event-vendors";
  const beautyAppearance = isBeautyVertical(tenantVertical);
  const bodyArtAppearance = isBodyArtVertical(tenantVertical);
  const wellnessAppearance = isWellnessVertical(tenantVertical);

  const previewPath = slug
    ? isEventVendor
      ? `/e/${slug}`
      : clientGuestBookHref(slug)
    : "";
  const publicBookUrl = slug
    ? isEventVendor
      ? publicEventVendorSiteUrl(slug)
      : clientGuestBookAbsoluteUrl(slug)
    : "";

  useEffect(() => {
    if (!bid || !presentationPresetsUiEnabled()) return;
    void customFetch<PresentationPayload>(`/api/businesses/${bid}/presentation`)
      .then((d) => {
        setData(d);
        setPresetId(d.presetId);
        setDraftPresetId(d.presetId);
        setAccent(d.brandAccentHex ?? "");
        setDraftAccent(d.brandAccentHex ?? "");
        setDirty(false);
      })
      .catch(() => setData(null));
  }, [bid]);

  const refreshPreview = useCallback(() => {
    setPublicPreviewBust((k) => k + 1);
    loadedPreviewQuery.current = null;
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
          await qc.invalidateQueries({ queryKey: ["tenant-experience", bid] });
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

  const pickerPresets = useMemo((): PresentationPreset[] => {
    if (tenantVertical) {
      return listPresentationPresetsForTenantPicker(tenantVertical as BusinessVertical).map((p) => ({
        id: p.id,
        label: p.label,
        description: p.description,
        cssPreset: p.cssPreset,
      }));
    }
    return data?.availablePresets ?? [];
  }, [tenantVertical, data?.availablePresets]);

  const draftPresetMeta = pickerPresets.find((p) => p.id === draftPresetId);
  const draftPickerMeta = resolvePresetPickerMeta(
    tenantVertical as BusinessVertical | null,
    draftPresetId,
  );

  const previewQuery = useMemo(() => {
    const params = new URLSearchParams({ preview: "1" });
    const cssPreset = draftPresetMeta?.cssPreset ?? draftPresetId;
    if (cssPreset) params.set("preset", cssPreset);
    if (draftAccent.trim()) params.set("accent", draftAccent.trim());
    if (tenantVertical) params.set("vertical", tenantVertical);
    return params.toString();
  }, [draftPresetMeta?.cssPreset, draftPresetId, draftAccent, tenantVertical]);

  const publicPreviewQuery = useMemo(() => {
    if (isEventVendor) {
      const params = new URLSearchParams();
      if (publicPreviewBust > 0) params.set("v", String(publicPreviewBust));
      return params.toString();
    }
    const params = new URLSearchParams(previewQuery);
    if (publicPreviewBust > 0) params.set("v", String(publicPreviewBust));
    return params.toString();
  }, [previewQuery, publicPreviewBust, isEventVendor]);

  const previewIframeBg = useMemo(() => {
    const cssPreset = draftPresetMeta?.cssPreset ?? "platform-default";
    return resolvePresentationColorMode(cssPreset) === "light"
      ? "hsl(0 0% 99%)"
      : "hsl(240 10% 4%)";
  }, [draftPresetMeta?.cssPreset]);

  const previewIframeSrc =
    appearanceTabActive && previewPath ? `${previewPath}?${publicPreviewQuery}` : "";
  const dashboardPreviewIframeSrc = useMemo(
    () => (appearanceTabActive && bid ? appearancePreviewDashboardPath(previewQuery) : ""),
    [appearanceTabActive, bid, previewQuery],
  );

  useEffect(() => {
    if (!appearanceTabActive || !previewQuery) return;
    if (loadedPreviewQuery.current === previewQuery) return;
    loadedPreviewQuery.current = previewQuery;
    setIframeLoading({ public: true, app: true });
  }, [appearanceTabActive, previewQuery]);

  function selectPreset(id: string) {
    setDraftPresetId(id);
    setDirty(id !== presetId || draftAccent.trim() !== accent.trim());
  }

  function discardDraftAppearance() {
    if (!data) return;
    setDraftPresetId(presetId);
    setDraftAccent(accent);
    setDirty(false);
    refreshPreview();
  }

  function onAccentChange(value: string) {
    setDraftAccent(value);
    if (value.trim() && !accentMeetsWcagAa(value)) return;
    setDirty(draftPresetId !== presetId || value.trim() !== accent.trim());
  }

  async function applyDraftAppearance() {
    if (!bid || !editable) return;
    await persist({
      presentationPresetId: draftPresetId,
      brandAccentHex: draftAccent.trim() || null,
    });
    setPresetId(draftPresetId);
    setAccent(draftAccent);
    setDirty(false);
    toast({ title: "Store appearance updated" });
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
    if (!publicBookUrl) return;
    void navigator.clipboard.writeText(publicBookUrl);
    toast({ title: isEventVendor ? "Website link copied" : "Booking link copied" });
  }

  if (!presentationPresetsUiEnabled() || !data?.presetsEnabled) {
    return (
      <Card data-testid="public-appearance-panel">
        <CardHeader>
          <CardTitle className="text-base">Store appearance</CardTitle>
          <CardDescription>
            Preset picker rolls out with presentation presets promotion. Your guest book page uses your vertical template today.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const previewFrameClass =
    "preview-iframe-scroll-host relative h-[min(52vh,520px)] w-full bg-muted";

  return (
    <div
      className={cn(
        "space-y-5 appearance-settings-panel",
        beautyAppearance && "beauty-appearance-panel",
        bodyArtAppearance && "body-art-appearance-panel",
        wellnessAppearance && "wellness-appearance-panel",
      )}
      data-testid="public-appearance-panel"
    >
      <Card className="overflow-hidden">
        <CardHeader className="pb-3 space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Store appearance
              </CardTitle>
              <CardDescription className="mt-1">
                {isEventVendor
                  ? "Preset styles your Livia studio only — your client website is edited under Website. Preview both below."
                  : "One skin for your app and your book link — preview below, then apply."}
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Button
                type="button"
                size="sm"
                disabled={!editable || busy || !dirty}
                data-testid="appearance-apply"
                onClick={() => void applyDraftAppearance()}
              >
                {busy ? "Applying…" : isEventVendor ? "Apply to studio" : "Apply to shop"}
              </Button>
              {dirty ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={!editable || busy}
                  data-testid="appearance-discard-draft"
                  onClick={discardDraftAppearance}
                >
                  Discard preview
                </Button>
              ) : null}
            </div>
          </div>
          {dirty ? (
            <p className="text-xs text-muted-foreground" data-testid="appearance-draft-hint">
              Unsaved preview — your live app keeps the saved skin until you apply.
            </p>
          ) : null}
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0 bg-muted rounded-md px-3 py-2 text-sm font-mono truncate">
              {publicBookUrl || "—"}
            </div>
            <Button type="button" variant="outline" size="icon" aria-label="Copy link" onClick={copyLink}>
              <Copy className="h-4 w-4" />
            </Button>
            {publicBookUrl ? (
              <a href={publicBookUrl} target="_blank" rel="noopener noreferrer">
                <Button type="button" variant="outline" size="icon" aria-label="Open public page">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </a>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-5 pt-0">
          <Tabs defaultValue="public" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="public" className="gap-1.5 text-xs sm:text-sm">
                <Smartphone className="h-3.5 w-3.5" />
                {isEventVendor ? "Client website" : "Public booking page"}
              </TabsTrigger>
              <TabsTrigger value="app" className="gap-1.5 text-xs sm:text-sm">
                <LayoutDashboard className="h-3.5 w-3.5" />
                Your app
              </TabsTrigger>
            </TabsList>
            <TabsContent value="public" className="mt-3">
              <div className="flex justify-center">
                <div
                  className="w-full max-w-[360px] rounded-[2rem] border-[8px] border-foreground/10 bg-background shadow-xl overflow-hidden"
                  data-testid="public-b-preview-frame"
                >
                  <div
                    className={previewFrameClass}
                    style={{ backgroundColor: previewIframeBg }}
                    data-loading={iframeLoading.public ? "true" : "false"}
                  >
                    {previewIframeSrc ? (
                      <iframe
                        key={previewIframeSrc}
                        title="Public booking preview"
                        src={previewIframeSrc}
                        className="relative h-full w-full border-0 appearance-preview-iframe"
                        style={{ backgroundColor: previewIframeBg }}
                        data-testid="public-b-preview-iframe"
                        scrolling="yes"
                        onLoad={() => setIframeLoading((s) => ({ ...s, public: false }))}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-muted-foreground p-6 text-center">
                        {appearanceTabActive
                          ? "Save a slug to preview your public page."
                          : "Open this tab to load preview."}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="app" className="mt-3" data-testid="dashboard-appearance-preview">
              <div className="flex justify-center">
                <div
                  className="w-full max-w-[min(100%,720px)] rounded-xl border border-foreground/10 bg-background shadow-xl overflow-hidden"
                  data-testid="dashboard-app-preview-frame"
                >
                  <div
                    className={cn(previewFrameClass, "relative")}
                    style={{ backgroundColor: previewIframeBg }}
                    data-loading={iframeLoading.app ? "true" : "false"}
                  >
                    {dashboardPreviewIframeSrc ? (
                      <iframe
                        key={dashboardPreviewIframeSrc}
                        title="Owner app preview"
                        src={dashboardPreviewIframeSrc}
                        className="relative h-full w-full border-0 appearance-preview-iframe"
                        style={{ backgroundColor: previewIframeBg }}
                        data-testid="dashboard-app-preview-iframe"
                        scrolling="yes"
                        onLoad={() => setIframeLoading((s) => ({ ...s, app: false }))}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-muted-foreground p-6 text-center">
                        Select a business to preview your app.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="grid gap-5 lg:grid-cols-[1fr_minmax(0,14rem)]">
            <div className="space-y-2">
              <Label>Preset</Label>
              <div
                className={cn(
                  "grid gap-2",
                  pickerPresets.length <= 3
                    ? "grid-cols-1 sm:grid-cols-3"
                    : "grid-cols-2 xl:grid-cols-4",
                )}
              >
                {pickerPresets.map((p) => {
                  const swatch = presetCardSwatch(p.cssPreset, tenantVertical);
                  const morph = tenantVertical
                    ? resolvePresentationLayoutMorph(tenantVertical as BusinessVertical, p.id)
                    : null;
                  const pickerMeta = resolvePresetPickerMeta(tenantVertical as BusinessVertical, p.id);
                  const morphLabel = beautyAppearance
                    ? beautyLayoutMorphLabel(morph)
                    : morph
                      ? layoutMorphLabel(morph)
                      : pickerMeta?.morphLabel ?? null;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      disabled={!editable || busy}
                      data-testid={`preset-card-${p.id}`}
                      data-selected={draftPresetId === p.id ? "true" : "false"}
                      onClick={() => selectPreset(p.id)}
                      className={cn(
                        "rounded-lg border p-3 text-left transition-colors",
                        draftPresetId === p.id
                          ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                          : "border-border hover:border-primary/40",
                      )}
                    >
                      {swatch ? (
                        <div
                          className={cn(
                            "h-8 rounded-md mb-2 preset-card-swatch",
                            beautyAppearance && "beauty-preset-swatch",
                            wellnessAppearance && "wellness-preset-swatch",
                            bodyArtAppearance && "body-art-preset-swatch",
                          )}
                          style={{
                            background: `linear-gradient(135deg, hsl(${swatch.a}) 0%, hsl(${swatch.b}) 100%)`,
                          }}
                          aria-hidden
                        />
                      ) : null}
                      <p className="text-sm font-medium">{p.label}</p>
                      {morphLabel ? (
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-primary mt-1">
                          {morphLabel}
                        </p>
                      ) : null}
                      {pickerMeta ? (
                        <>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {pickerMeta.colorScheme}
                          </p>
                          <p className="text-[11px] text-muted-foreground/90 mt-1.5 line-clamp-2">
                            {pickerMeta.whenToPick}
                          </p>
                        </>
                      ) : (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.description}</p>
                      )}
                    </button>
                  );
                })}
              </div>
              {draftPickerMeta ? (
                <div
                  className="rounded-lg border border-border/80 bg-muted/30 p-3 space-y-2 text-xs"
                  data-testid="preset-picker-intent"
                >
                  <p className="font-medium text-sm text-foreground">{draftPickerMeta.label} experience</p>
                  <p className="text-muted-foreground">
                    <span className="font-semibold text-foreground/90">Your app:</span>{" "}
                    {draftPickerMeta.operatorIntent}
                  </p>
                  <p className="text-muted-foreground">
                    <span className="font-semibold text-foreground/90">
                      {isEventVendor ? "Client site:" : "Booking page:"}
                    </span>{" "}
                    {draftPickerMeta.guestIntent}
                  </p>
                </div>
              ) : null}
            </div>

            <div className="space-y-4">
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
              <div className="space-y-2">
                <Label>Logo</Label>
                <div className="flex items-center gap-2">
                  {brandFields.logoUrl ? (
                    <img
                      src={brandFields.logoUrl}
                      alt=""
                      className="h-10 w-10 rounded-lg object-contain bg-muted border shrink-0"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-lg bg-muted border shrink-0" aria-hidden />
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    disabled={!editable || uploading === "logo"}
                    data-testid="appearance-logo-upload"
                    onClick={() => logoInputRef.current?.click()}
                  >
                    {uploading === "logo" ? "Uploading…" : "Logo"}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Cover</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  disabled={!editable || uploading === "cover"}
                  data-testid="appearance-cover-upload"
                  onClick={() => coverInputRef.current?.click()}
                >
                  {uploading === "cover" ? "Uploading…" : brandFields.coverImageUrl ? "Change cover" : "Upload cover"}
                </Button>
              </div>
              <div className="space-y-2">
                <Label htmlFor="appearance-accent">Accent</Label>
                <Input
                  id="appearance-accent"
                  value={draftAccent}
                  disabled={!editable}
                  data-testid="presentation-accent-input"
                  placeholder="#D4A72C"
                  onChange={(e) => onAccentChange(e.target.value)}
                />
                {!contrastOk && draftAccent.trim() ? (
                  <p className="text-[11px] text-destructive" data-testid="accent-contrast-warning">
                    Low contrast — pick a darker colour.
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
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
