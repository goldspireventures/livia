import { useCallback, useEffect, useMemo, useState } from "react";
import { useBusiness } from "@/lib/business-context";
import { apiFetch, ApiFetchError } from "@/lib/api-fetch";
import { OperationalPageShell } from "@/components/layout/operational-page-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { clientGuestBookAbsoluteUrl } from "@/lib/guest-book-url";
import { formatCurrency, majorFromMinor, minorFromMajor } from "@/lib/format";
import {
  TENANT_RETAIL_PROGRAM,
  buildPostSessionLivPreview,
  defaultTenantRetailStoreSettings,
  formatRetailInventoryLabel,
  isTenantRetailVisibleOnPublicBook,
  resolveTenantRetailPack,
  tenantRetailPreviewExample,
  verticalSupportsRetail,
  type TenantRetailStoreSettings,
} from "@workspace/policy";
import { FeatureUnlockGate } from "@/components/billing/feature-unlock-panel";
import { useOperationalChrome } from "@/lib/operational-chrome";
import { beautyPrimaryButton } from "@/lib/beauty-operational-ui";
import { cn } from "@/lib/utils";
import { Link } from "wouter";
import { Package, Pencil, Sparkles } from "lucide-react";
import { RetailProductImageField } from "@/components/beauty/retail-product-image-field";
import {
  BeautyRetailProductEditor,
  type RetailProductEditRow,
} from "@/components/beauty/beauty-retail-product-editor";

type RetailProductRow = RetailProductEditRow & {
  sortOrder?: number;
};

function apiErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiFetchError) return err.message || fallback;
  if (err instanceof Error) return err.message;
  return fallback;
}

export default function TenantStorePage() {
  const { business } = useBusiness();
  const { toast } = useToast();
  const bid = business?.id ?? "";
  const vertical = (business as { vertical?: string; subverticalProfileId?: string | null } | null)?.vertical;
  const subverticalProfileId = (business as { subverticalProfileId?: string | null } | null)?.subverticalProfileId;
  const retailPack = resolveTenantRetailPack(vertical, subverticalProfileId);
  const op = useOperationalChrome(vertical);
  const [settings, setSettings] = useState<TenantRetailStoreSettings | null>(null);
  const [products, setProducts] = useState<RetailProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState({
    name: "",
    description: "",
    priceMajor: "",
    sku: "",
    category: retailPack?.categories[0] ?? "Other",
    imageUrl: null as string | null,
    stockQuantity: "",
  });
  const [editingProduct, setEditingProduct] = useState<RetailProductRow | null>(null);

  const previewExample = useMemo(() => tenantRetailPreviewExample(vertical), [vertical]);

  const livPreview = useMemo(
    () =>
      buildPostSessionLivPreview({
        vertical,
        businessName: business?.name ?? "Your studio",
        serviceName: previewExample.serviceName,
        serviceCategory: previewExample.serviceCategory,
        products: products.map((p) => ({
          id: p.id,
          name: p.name,
          category: p.category,
          linkedServiceCategory: (p as { linkedServiceCategory?: string | null }).linkedServiceCategory,
          isActive: p.isActive,
        })),
      }),
    [business?.name, previewExample.serviceCategory, previewExample.serviceName, products, vertical],
  );

  const load = useCallback(async () => {
    if (!bid) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const bundle = await apiFetch<{ settings: TenantRetailStoreSettings; products: RetailProductRow[] }>(
        `/api/businesses/${bid}/retail/store`,
      );
      setSettings(bundle.settings);
      setProducts(bundle.products ?? []);
    } catch (err) {
      setSettings(null);
      setProducts([]);
      setLoadError(apiErrorMessage(err, "Could not load store"));
    } finally {
      setLoading(false);
    }
  }, [bid]);

  useEffect(() => {
    void load();
  }, [load]);

  async function patchSettings(patch: Partial<TenantRetailStoreSettings>) {
    if (!bid || !settings) return;
    setBusy(true);
    try {
      const next = await apiFetch<TenantRetailStoreSettings>(`/api/businesses/${bid}/retail/settings`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      setSettings(next);
      toast({ title: "Store settings saved" });
    } catch (err) {
      toast({
        title: "Could not save settings",
        description: apiErrorMessage(err, "Try again in a moment."),
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  async function addProduct() {
    if (!bid || !draft.name.trim() || !draft.priceMajor) return;
    setBusy(true);
    try {
      await apiFetch(`/api/businesses/${bid}/retail/products`, {
        method: "POST",
        body: JSON.stringify({
          name: draft.name.trim(),
          description: draft.description.trim() || undefined,
          priceMinor: minorFromMajor(Number(draft.priceMajor)),
          sku: draft.sku.trim() || undefined,
          category: draft.category,
          imageUrl: draft.imageUrl ?? undefined,
          stockQuantity: draft.stockQuantity.trim() === "" ? null : Number(draft.stockQuantity),
        }),
      });
      setDraft({
        name: "",
        description: "",
        priceMajor: "",
        sku: "",
        category: "Aftercare",
        imageUrl: null,
        stockQuantity: "",
      });
      toast({ title: "Product added" });
      await load();
    } catch (err) {
      toast({
        title: "Could not add product",
        description: apiErrorMessage(err, "Check your connection and try again."),
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  async function seedTemplates() {
    if (!bid) return;
    setBusy(true);
    try {
      const r = await apiFetch<{ seeded: number }>(`/api/businesses/${bid}/retail/seed-templates`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      toast({ title: r.seeded ? `Added ${r.seeded} products` : "Catalog already has products" });
      await load();
    } catch (err) {
      toast({
        title: "Could not seed templates",
        description: apiErrorMessage(err, "Try again in a moment."),
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  async function saveProduct(
    productId: string,
    patch: {
      name: string;
      description?: string;
      priceMinor: number;
      sku?: string;
      category?: string;
      imageUrl?: string | null;
      stockQuantity?: number | null;
    },
  ) {
    if (!bid) return;
    setBusy(true);
    try {
      await apiFetch(`/api/businesses/${bid}/retail/products/${productId}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      toast({ title: "Product updated" });
      await load();
    } catch (err) {
      toast({
        title: "Could not update product",
        description: apiErrorMessage(err, "Try again in a moment."),
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  async function toggleProduct(p: RetailProductRow) {
    if (!bid) return;
    try {
      await apiFetch(`/api/businesses/${bid}/retail/products/${p.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !p.isActive }),
      });
      await load();
    } catch (err) {
      toast({
        title: "Could not update product",
        description: apiErrorMessage(err, "Try again in a moment."),
        variant: "destructive",
      });
    }
  }

  const settingsReady = settings ?? defaultTenantRetailStoreSettings(vertical);
  const activeProductCount = products.filter((p) => p.isActive !== false).length;
  const visibleOnPublicBook = isTenantRetailVisibleOnPublicBook(settingsReady, activeProductCount);
  const categories = retailPack?.categories ?? ["Other"];
  const templates = retailPack?.templates ?? [];

  if (!verticalSupportsRetail(vertical)) {
    return (
      <OperationalPageShell title="Shop" subtitle="Retail is not available for this business type." width="lg">
        <p className="text-sm text-muted-foreground">Switch to a retail-enabled tenant or contact support.</p>
      </OperationalPageShell>
    );
  }

  return (
    <FeatureUnlockGate featureId="take_home_retail">
      <OperationalPageShell
      title={retailPack?.ownerTitle ?? "Shop"}
      subtitle={retailPack?.ownerSubtitle ?? ""}
      width="lg"
      data-testid="tenant-store-page"
    >
      <Card className={cn(op.beauty && "beauty-operational-panel")}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" aria-hidden />
            Store settings
          </CardTitle>
          <CardDescription>Control whether products appear on your public book page.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : loadError ? (
            <div className="space-y-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm">
              <p className="text-destructive">{loadError}</p>
              <p className="text-xs text-muted-foreground">
                If this persists, contact support — your retail add-on may need to be enabled on this shop.
              </p>
              <Button type="button" size="sm" variant="outline" onClick={() => void load()}>
                Retry
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">Show on public booking page</p>
                  <p className="text-xs text-muted-foreground">
                    Guests browse and buy aftercare on your public book page
                  </p>
                </div>
                <Switch
                  checked={settingsReady.enabled}
                  disabled={busy}
                  onCheckedChange={(v) => void patchSettings({ enabled: v })}
                />
              </div>
              {settingsReady.enabled ? (
                visibleOnPublicBook ? (
                  <p className="text-xs text-primary">
                    Live on your booking page with {activeProductCount} product{activeProductCount === 1 ? "" : "s"}
                  </p>
                ) : (
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    Turned on — add at least one product below for guests to see the section
                  </p>
                )
              ) : (
                <p className="text-xs text-muted-foreground">
                  Off — staff can still use pay links if &quot;Suggest after sessions&quot; is on
                </p>
              )}
              <div className="space-y-2">
                <Label htmlFor="store-title">Section title on booking page</Label>
                <Input
                  id="store-title"
                  value={settingsReady.title}
                  disabled={busy || !settingsReady.enabled}
                  onChange={(e) => setSettings({ ...settingsReady, title: e.target.value })}
                  onBlur={() => void patchSettings({ title: settingsReady.title })}
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">Suggest after sessions</p>
                  <p className="text-xs text-muted-foreground">Staff can copy pay links from booking detail when on</p>
                </div>
                <Switch
                  checked={settingsReady.postSessionSuggest}
                  disabled={busy}
                  onCheckedChange={(v) => void patchSettings({ postSessionSuggest: v })}
                />
              </div>
              {business?.slug ? (
                <p className="text-xs text-muted-foreground">
                  Preview on{" "}
                  <a
                    href={clientGuestBookAbsoluteUrl(business.slug)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {clientGuestBookAbsoluteUrl(business.slug).replace(/^https?:\/\//, "")}
                  </a>
                  <span className="text-muted-foreground/80"> (opens in new tab)</span>
                </p>
              ) : null}
              {vertical === "body-art" ? (
                <p className="text-xs text-muted-foreground">
                  Approved proofs appear on your guest book page under flash & custom work. Manage artwork in{" "}
                  <Link href="/design-proofs" className="text-primary hover:underline">
                    Design proofs
                  </Link>
                  .
                </p>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>

      <Card className={cn(op.beauty && "beauty-operational-panel")}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Products</CardTitle>
          <CardDescription>
            Up to {TENANT_RETAIL_PROGRAM.maxActiveProducts} items — {TENANT_RETAIL_PROGRAM.inventoryHint}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadError ? (
            <p className="text-sm text-muted-foreground">Fix the store load error above to manage products.</p>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="outline" disabled={busy || loading} onClick={() => void seedTemplates()}>
                  <Sparkles className="h-3.5 w-3.5 mr-1" aria-hidden />
                  {retailPack?.templateSeedLabel ?? "Load templates"}
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 pb-1">
                {templates.map((t) => (
                  <Button
                    key={t.name}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    disabled={busy}
                    onClick={() =>
                      setDraft({
                        name: t.name,
                        description: t.description ?? "",
                        priceMajor: String(majorFromMinor(t.priceMinor)),
                        sku: t.sku ?? "",
                        category: t.category,
                        imageUrl: null,
                        stockQuantity: "",
                      })
                    }
                  >
                    {t.name}
                  </Button>
                ))}
              </div>
              <div className="grid gap-3 sm:grid-cols-2 border-t border-border/60 pt-4">
                {bid ? (
                  <div className="sm:col-span-2">
                    <RetailProductImageField
                      businessId={bid}
                      imageUrl={draft.imageUrl}
                      disabled={busy}
                      onChange={(url) => setDraft({ ...draft, imageUrl: url })}
                    />
                  </div>
                ) : null}
                <div className="space-y-2 sm:col-span-2">
                  <Label>Name</Label>
                  <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Description</Label>
                  <Textarea
                    value={draft.description}
                    rows={2}
                    onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Price ({business?.currency ?? "EUR"})</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={draft.priceMajor}
                    onChange={(e) => setDraft({ ...draft, priceMajor: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>In stock</Label>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    placeholder="Unlimited"
                    value={draft.stockQuantity}
                    onChange={(e) => setDraft({ ...draft, stockQuantity: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                    value={draft.category}
                    onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>SKU (optional)</Label>
                  <Input value={draft.sku} onChange={(e) => setDraft({ ...draft, sku: e.target.value })} />
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    className={beautyPrimaryButton(op.beauty)}
                    disabled={busy || loading}
                    onClick={() => void addProduct()}
                  >
                    Add product
                  </Button>
                </div>
              </div>
              <ul className="divide-y text-sm" data-testid="tenant-store-product-list">
                {products.map((p) => (
                  <li key={p.id} className="flex justify-between gap-3 py-2.5 first:pt-0">
                    <div className="flex gap-3 min-w-0">
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md border border-border/80 bg-muted/40">
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt="" className="h-full w-full object-cover" />
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <p className={cn("font-medium", p.isActive === false && "text-muted-foreground line-through")}>
                          {p.name}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p>
                        {formatRetailInventoryLabel(p) ? (
                          <span
                            className="inline-flex mt-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground tabular-nums"
                            data-testid={`retail-inventory-${p.id}`}
                          >
                            {formatRetailInventoryLabel(p)}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="tabular-nums text-xs sm:text-sm">{formatCurrency(p.priceMinor, p.currency)}</span>
                      <Button type="button" size="sm" variant="ghost" onClick={() => setEditingProduct(p)}>
                        <Pencil className="h-3.5 w-3.5" aria-hidden />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button type="button" size="sm" variant="ghost" onClick={() => void toggleProduct(p)}>
                        {p.isActive === false ? "Activate" : "Hide"}
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
              <BeautyRetailProductEditor
                open={!!editingProduct}
                product={editingProduct}
                businessId={bid}
                currency={business?.currency ?? "EUR"}
                categories={categories}
                busy={busy}
                onOpenChange={(open) => {
                  if (!open) setEditingProduct(null);
                }}
                onSave={async (patch) => {
                  if (!editingProduct) return;
                  await saveProduct(editingProduct.id, patch);
                }}
              />
            </>
          )}
        </CardContent>
      </Card>

      <Card data-testid="beauty-store-liv-preview">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">How Liv follows up after sessions</CardTitle>
          <CardDescription>
            You control gates in Settings → Guest care (auto-send vs draft). Liv writes from the real
            treatment — this is an example only.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-xs text-muted-foreground">{livPreview.caption}</p>
          {livPreview.matchedProduct ? (
            <p className="text-xs text-primary">
              Matched SKU for this example: {livPreview.matchedProduct}
            </p>
          ) : null}
          <pre
            className="whitespace-pre-wrap rounded-lg border border-border/80 bg-muted/30 p-3 text-xs leading-relaxed font-sans"
            data-testid="beauty-store-liv-preview-body"
          >
            {livPreview.body}
          </pre>
          <Button type="button" size="sm" variant="outline" asChild>
            <Link href="/settings?tab=policy">Guest care settings</Link>
          </Button>
        </CardContent>
      </Card>
    </OperationalPageShell>
    </FeatureUnlockGate>
  );
}
