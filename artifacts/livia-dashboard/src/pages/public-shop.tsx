import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { useSearch } from "wouter";
import { useGuestBookTokenRoute } from "@/lib/use-guest-book-slug";
import {
  warmPublicGuestSurfaceTheme,
  clearPublicGuestSurfaceTheme,
  type PublicGuestExperienceSkin,
} from "@/lib/apply-public-guest-theme";
import { formatCurrency } from "@/lib/format";
import { parsePublicApiError } from "@/lib/public-booking-helpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, Loader2, CheckCircle2 } from "lucide-react";
import {
  PublicSurfaceFooter,
  PublicSurfaceLoading,
  PublicSurfaceNotFound,
} from "@/components/public/public-surface-chrome";
import { usePublicGuestPwa } from "@/lib/public-guest-pwa";
import { parsePublicShopPath } from "@/lib/public-guest-route-params";
import {
  guestRetailFulfillmentLabel,
  type GuestRetailFulfillmentMode,
} from "@workspace/policy";

type ShopLine = {
  id: string;
  productId: string;
  productName: string;
  productDescription: string | null;
  productImageUrl: string | null;
  quantity: number;
  unitPriceMinor: number;
  lineTotalMinor: number;
  currency: string;
};

type ShopPayload = {
  orderId: string;
  status: string;
  quantity: number;
  amountMinor: number;
  currency: string;
  productName: string;
  productDescription: string | null;
  productImageUrl?: string | null;
  lines?: ShopLine[];
  lineCount?: number;
  businessName: string;
  slug: string;
  vertical: string | null;
  logoUrl: string | null;
  checkoutAvailable: boolean;
  fulfillmentMode?: string | null;
  fulfillmentDetail?: string | null;
  experienceSkin?: PublicGuestExperienceSkin;
};

export default function PublicShopPage() {
  const { slug: routeSlug, token: routeToken } = useGuestBookTokenRoute("shop");
  const pathParams = useMemo(
    () => parsePublicShopPath(typeof window !== "undefined" ? window.location.pathname : ""),
    [],
  );
  const slug = routeSlug ?? pathParams?.slug ?? "";
  const token = routeToken ?? pathParams?.token ?? "";
  const search = useSearch();
  const params = new URLSearchParams(search);
  const statusHint = params.get("status");

  const [data, setData] = useState<ShopPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [payBusy, setPayBusy] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  usePublicGuestPwa(slug);

  useLayoutEffect(() => {
    if (!slug) return;
    void warmPublicGuestSurfaceTheme({ slug });
    return () => clearPublicGuestSurfaceTheme();
  }, [slug]);

  const load = useCallback(async () => {
    if (!slug || !token) return;
    setLoading(true);
    try {
      const r = await fetch(`/api/public/b/${slug}/shop/${token}`);
      if (!r.ok) throw new Error("not found");
      const d = (await r.json()) as ShopPayload;
      setData(d);
      await warmPublicGuestSurfaceTheme({
        slug: d.slug ?? slug,
        vertical: d.vertical,
        experienceSkin: d.experienceSkin,
      });
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [slug, token]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (statusHint === "success") {
      setFlash("Payment received — thank you.");
      void load();
      const timer = window.setInterval(() => void load(), 2500);
      return () => window.clearInterval(timer);
    }
    if (statusHint === "cancel") {
      setFlash("Checkout cancelled — you can try again when ready.");
    }
    return undefined;
  }, [statusHint, load]);

  async function checkout() {
    if (!slug || !token) return;
    setPayBusy(true);
    setErr(null);
    setFlash(null);
    try {
      const r = await fetch(`/api/public/b/${slug}/shop/${token}/checkout`, { method: "POST" });
      const body = (await r.json()) as { checkoutUrl?: string; mode?: string; message?: string; error?: string };
      if (!r.ok) throw new Error(body.error ?? "Could not start checkout");
      if (body.checkoutUrl) {
        window.location.href = body.checkoutUrl;
        return;
      }
      if (body.mode === "dev") {
        setFlash(body.message ?? "Order recorded.");
        void load();
        return;
      }
      setFlash(body.message ?? "Checkout unavailable");
    } catch (e) {
      setErr(parsePublicApiError(e, "Could not start checkout"));
    } finally {
      setPayBusy(false);
    }
  }

  if (loading) return <PublicSurfaceLoading />;
  if (!data) {
    return (
      <PublicSurfaceNotFound
        title="Order not found"
        detail="This shop link is invalid or expired. Return to the studio book page and try again."
      />
    );
  }

  const paid = data.status === "PAID" || statusHint === "success";
  const lines = data.lines?.length ? data.lines : null;
  const showStickyPay = !paid && data.checkoutAvailable;

  return (
    <div
      className={`min-h-dvh flex flex-col bg-background ${showStickyPay ? "has-sticky-cta" : ""}`}
      data-testid="public-shop-page"
    >
      <main className="flex-1 px-4 py-8 max-w-md mx-auto w-full pb-28">
        {data.logoUrl ? (
          <img src={data.logoUrl} alt="" className="h-10 w-auto mb-6 object-contain" />
        ) : null}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-serif">{data.businessName}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {lines ? (
              <ul className="space-y-3" data-testid="public-shop-lines">
                {lines.map((line) => (
                  <li key={line.id} className="flex gap-3 border-b border-border/60 pb-3 last:border-0">
                    {line.productImageUrl ? (
                      <img
                        src={line.productImageUrl}
                        alt=""
                        className="h-14 w-14 rounded-md object-cover shrink-0"
                      />
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm">{line.productName}</p>
                      <p className="text-xs text-muted-foreground">
                        {line.quantity} × {formatCurrency(line.unitPriceMinor, line.currency)}
                      </p>
                    </div>
                    <p className="text-sm font-medium tabular-nums shrink-0">
                      {formatCurrency(line.lineTotalMinor, line.currency)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <>
                {data.productImageUrl ? (
                  <img
                    src={data.productImageUrl}
                    alt=""
                    className="w-full max-h-48 rounded-lg object-cover"
                  />
                ) : null}
                <div>
                  <p className="font-medium">{data.productName}</p>
                  {data.productDescription ? (
                    <p className="text-sm text-muted-foreground mt-1">{data.productDescription}</p>
                  ) : null}
                </div>
              </>
            )}
            <div className="flex items-center justify-between border-t border-border/60 pt-3 font-semibold">
              <span className="text-sm text-muted-foreground">Total due</span>
              <span className="text-lg text-primary tabular-nums">
                {formatCurrency(data.amountMinor, data.currency)}
              </span>
            </div>
            {data.fulfillmentMode ? (
              <p className="text-sm text-muted-foreground">
                {guestRetailFulfillmentLabel(data.fulfillmentMode as GuestRetailFulfillmentMode)}
                {data.fulfillmentDetail?.trim() ? ` · ${data.fulfillmentDetail.trim()}` : null}
              </p>
            ) : null}
            {flash ? <p className="text-sm text-primary">{flash}</p> : null}
            {err ? <p className="text-sm text-destructive">{err}</p> : null}
            {paid ? (
              <div className="flex items-center gap-2 text-sm text-[hsl(var(--chart-3))]">
                <CheckCircle2 className="h-4 w-4" aria-hidden />
                Paid — pick up at reception or await shipping note from the studio.
              </div>
            ) : !data.checkoutAvailable ? (
              <p className="text-sm text-muted-foreground">Checkout is not available right now.</p>
            ) : null}
          </CardContent>
        </Card>
      </main>

      {showStickyPay ? (
        <div
          className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/80 bg-background/95 backdrop-blur-md px-4 py-3"
          data-testid="public-shop-sticky-cta"
        >
          <div className="max-w-md mx-auto">
            <Button type="button" className="w-full min-h-[48px] gap-2" disabled={payBusy} onClick={() => void checkout()}>
              {payBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
              Pay {formatCurrency(data.amountMinor, data.currency)}
            </Button>
          </div>
        </div>
      ) : null}

      <PublicSurfaceFooter />
    </div>
  );
}
