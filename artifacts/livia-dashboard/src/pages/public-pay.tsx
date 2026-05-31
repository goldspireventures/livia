import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { applyVerticalTheme } from "@/lib/vertical-theme";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, Loader2, CheckCircle2 } from "lucide-react";
import {
  PublicSurfaceFooter,
  PublicSurfaceLoading,
  PublicSurfaceNotFound,
} from "@/components/public/public-surface-chrome";

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
};

export default function PublicPayPage() {
  const { slug, token } = useParams<{ slug: string; token: string }>();
  const [data, setData] = useState<PayPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug || !token) return;
    setLoading(true);
    fetch(`/api/public/b/${slug}/pay/${token}`)
      .then(async (r) => {
        if (!r.ok) throw new Error("not found");
        return r.json() as Promise<PayPayload>;
      })
      .then((d) => {
        setData(d);
        applyVerticalTheme(d.vertical, null);
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
    return () => {
      document.documentElement.removeAttribute("data-vertical");
    };
  }, [slug, token]);

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
    <div className="min-h-screen bg-background public-booking-shell" data-testid="guest-pay-page">
      <div className="max-w-md mx-auto px-4 py-10 space-y-6">
        <div className="text-center space-y-2">
          {data.logoUrl ? (
            <img src={data.logoUrl} alt="" className="h-12 mx-auto object-contain" />
          ) : null}
          <p className="text-[10px] uppercase tracking-widest font-mono text-primary">Secure deposit</p>
          <h1 className="text-2xl font-serif">{data.businessName}</h1>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{data.serviceName}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-muted-foreground">{formatDateTime(data.startAt)}</p>
            {data.staffDisplayName ? (
              <p className="text-muted-foreground">With {data.staffDisplayName}</p>
            ) : null}
            <div className="border-t pt-3 space-y-1">
              <div className="flex justify-between">
                <span>Service total</span>
                <span>{formatCurrency(data.priceMinor, data.currency)}</span>
              </div>
              {data.depositRequired ? (
                <>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Deposit ({data.depositPercent}%)</span>
                    <span>
                      {formatCurrency(
                        Math.round((data.priceMinor * data.depositPercent) / 100),
                        data.currency,
                      )}
                    </span>
                  </div>
                  {data.depositPaidMinor > 0 ? (
                    <div className="flex justify-between text-primary">
                      <span>Paid</span>
                      <span>{formatCurrency(data.depositPaidMinor, data.currency)}</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between font-medium text-lg pt-1">
                    <span>Due now</span>
                    <span>{formatCurrency(data.depositDueMinor, data.currency)}</span>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground">No deposit required for this booking.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {paid ? (
          <div className="flex items-center gap-2 justify-center text-primary text-sm">
            <CheckCircle2 className="h-5 w-5" />
            Deposit received — you&apos;re all set.
          </div>
        ) : data.checkoutAvailable ? (
          <Button className="w-full" size="lg">
            <CreditCard className="h-4 w-4 mr-2" />
            Pay deposit
          </Button>
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-4 text-center text-sm text-muted-foreground space-y-2">
              <p>
                Card checkout is rolling out — your shop may confirm by SMS or take payment in person.
              </p>
              <p className="text-xs">Booking ref {data.bookingId.slice(0, 8)}</p>
            </CardContent>
          </Card>
        )}

        <PublicSurfaceFooter />
      </div>
    </div>
  );
}
