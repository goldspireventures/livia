import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { useSearch } from "wouter";
import { useGuestBookTokenRoute } from "@/lib/use-guest-book-slug";
import {
  warmPublicGuestSurfaceTheme,
  clearPublicGuestSurfaceTheme,
  type PublicGuestExperienceSkin,
} from "@/lib/apply-public-guest-theme";
import { formatDateTime } from "@/lib/format";
import { parsePublicApiError } from "@/lib/public-booking-helpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GuestMoneyBreakdown } from "@/components/public-booking/guest-money-breakdown";
import { Button } from "@/components/ui/button";
import { CreditCard, Loader2, CheckCircle2, Shield } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import {
  PublicSurfaceFooter,
  PublicSurfaceLoading,
  PublicSurfaceNotFound,
} from "@/components/public/public-surface-chrome";
import { usePublicGuestPwa } from "@/lib/public-guest-pwa";

type PayPayload = {
  bookingId: string;
  businessName: string;
  slug: string;
  status: string;
  startAt: string;
  serviceName: string;
  staffDisplayName: string | null;
  currency: string;
  priceMinor: number;
  depositPaidMinor: number;
  depositDueMinor: number;
  depositPercent: number;
  depositRequired: boolean;
  checkoutAvailable: boolean;
  logoUrl: string | null;
  vertical: string | null;
  experienceSkin?: PublicGuestExperienceSkin;
};

export default function PublicPayPage() {
  const { slug, token } = useGuestBookTokenRoute("pay");
  const search = useSearch();
  const params = new URLSearchParams(search);
  const statusHint = params.get("status");

  const [data, setData] = useState<PayPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [payBusy, setPayBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  usePublicGuestPwa(slug);

  useLayoutEffect(() => {
    if (!slug) return;
    void warmPublicGuestSurfaceTheme({ slug });
    return () => clearPublicGuestSurfaceTheme();
  }, [slug]);

  const load = useCallback(async () => {
    if (!slug || !token) return;
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch(`/api/public/b/${slug}/pay/${token}`);
      if (!r.ok) throw new Error("not found");
      const d = (await r.json()) as PayPayload;
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
    } else if (statusHint === "cancel") {
      setFlash("Checkout cancelled — you can try again when ready.");
    }
  }, [statusHint, load]);

  async function startCheckout() {
    if (!slug || !token) return;
    setPayBusy(true);
    setErr(null);
    setFlash(null);
    try {
      const r = await fetch(`/api/public/b/${slug}/pay/${token}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const j = (await r.json()) as {
        mode?: string;
        checkoutUrl?: string;
        message?: string;
        error?: string;
      };
      if (!r.ok) {
        throw new Error(j.error ?? "Could not start checkout");
      }
      if (j.mode === "stripe" && j.checkoutUrl) {
        window.location.href = j.checkoutUrl;
        return;
      }
      if (j.mode === "dev") {
        setFlash(j.message ?? "Deposit recorded.");
        await load();
        return;
      }
      throw new Error("Unexpected checkout response");
    } catch (e) {
      setErr(parsePublicApiError(e, "Try again"));
    } finally {
      setPayBusy(false);
    }
  }

  if (loading) return <PublicSurfaceLoading />;
  if (!data) {
    return (
      <PublicSurfaceNotFound
        title="Link not found"
        detail="This payment link is invalid or expired."
      />
    );
  }

  const paid = data.depositDueMinor <= 0;

  return (
    <div
      className="min-h-screen bg-background public-booking-shell has-sticky-cta"
      data-testid="guest-pay-page"
    >
      <div className="max-w-md mx-auto px-4 py-10 pb-28 space-y-6">
        <div className="text-center space-y-2" data-testid="guest-pay-hero">
          {data.logoUrl ? (
            <img src={data.logoUrl} alt="" className="h-12 mx-auto object-contain rounded-lg" />
          ) : null}
          <p className="text-[10px] uppercase tracking-widest font-mono text-primary flex items-center justify-center gap-1">
            <Shield className="h-3 w-3" aria-hidden />
            Secure deposit
          </p>
          <h1 className="text-2xl font-serif">{data.businessName}</h1>
        </div>

        {flash ? (
          <p className="text-sm text-center text-primary bg-primary/10 rounded-lg px-3 py-2">{flash}</p>
        ) : null}
        {err ? <p className="text-sm text-center text-destructive">{err}</p> : null}

        <Card className="border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{data.serviceName}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-muted-foreground">{formatDateTime(data.startAt)}</p>
            {data.staffDisplayName ? (
              <p className="text-muted-foreground">With {data.staffDisplayName}</p>
            ) : null}
            <GuestMoneyBreakdown
              priceMinor={data.priceMinor}
              currency={data.currency}
              depositPercent={data.depositPercent}
              depositDueMinor={data.depositDueMinor}
              depositPaidMinor={data.depositPaidMinor}
              depositRequired={data.depositRequired}
              dueLabel="Pay by card to hold your appointment time."
            />
          </CardContent>
        </Card>

        {paid ? (
          <div
            className="flex items-center gap-2 justify-center text-primary text-sm"
            data-testid="guest-pay-complete"
          >
            <CheckCircle2 className="h-5 w-5" />
            Deposit received — you&apos;re all set.
          </div>
        ) : null}

        <PublicSurfaceFooter />
      </div>

      {!paid && data.checkoutAvailable ? (
        <div
          className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/80 bg-background/95 backdrop-blur-md px-4 py-3"
          data-testid="guest-pay-sticky-cta"
        >
          <div className="max-w-md mx-auto">
            <Button
              className="w-full min-h-[48px]"
              size="lg"
              disabled={payBusy}
              data-testid="guest-pay-checkout"
              onClick={() => void startCheckout()}
            >
              {payBusy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Pay {formatCurrency(data.depositDueMinor, data.currency)}
                </>
              )}
            </Button>
          </div>
        </div>
      ) : !paid ? (
        <Card className="max-w-md mx-auto border-dashed mx-4">
          <CardContent className="py-4 text-center text-sm text-muted-foreground">
            Card checkout is not available for this shop yet — they may confirm by SMS or in person.
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
