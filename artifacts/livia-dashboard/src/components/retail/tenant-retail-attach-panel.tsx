import { useState } from "react";
import { Link } from "wouter";
import { apiFetch } from "@/lib/api-fetch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  buildTenantRetailPaySms,
  resolveTenantRetailPack,
  tenantRetailOwnerRoute,
} from "@workspace/policy";
import { Package } from "lucide-react";

type ProductOption = { id: string; name: string; priceMinor: number; currency: string };

export function TenantRetailAttachPanel({
  businessId,
  businessName,
  businessVertical,
  guestFirstName,
  products,
  enabled,
}: {
  businessId: string;
  businessName: string;
  businessVertical?: string | null;
  guestFirstName?: string | null;
  products: ProductOption[];
  enabled?: boolean;
}) {
  const { toast } = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [lastLink, setLastLink] = useState<string | null>(null);
  const pack = resolveTenantRetailPack(businessVertical);

  if (!enabled || products.length === 0) return null;

  async function sendLink(productId: string) {
    setBusy(productId);
    try {
      const r = await apiFetch<{ payUrl: string; productName: string }>(
        `/api/businesses/${businessId}/retail/pay-link`,
        {
          method: "POST",
          body: JSON.stringify({ productId, guestName: guestFirstName ?? undefined }),
        },
      );
      setLastLink(r.payUrl);
      const sms = buildTenantRetailPaySms({
        businessName,
        productName: r.productName,
        payUrl: r.payUrl,
        guestFirstName,
      });
      await navigator.clipboard.writeText(sms);
      toast({ title: "Pay link copied", description: "Paste into Inbox or SMS to the guest." });
    } catch {
      toast({ title: "Could not create pay link", variant: "destructive" });
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card data-testid="tenant-retail-attach-panel">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Package className="h-4 w-4 text-primary" aria-hidden />
          {pack?.attachTitle ?? "Shop"}
        </CardTitle>
        <CardDescription>{pack?.attachDescription ?? "Generate a pay link to text after the visit."}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <ul className="space-y-2">
          {products.slice(0, 4).map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-2 text-sm">
              <span className="truncate">{p.name}</span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={busy === p.id}
                onClick={() => void sendLink(p.id)}
              >
                {busy === p.id ? "…" : "Copy link"}
              </Button>
            </li>
          ))}
        </ul>
        {lastLink ? (
          <p className="text-[11px] text-muted-foreground break-all">Last link: {lastLink}</p>
        ) : null}
        <Button asChild size="sm" variant="ghost" className="px-0">
          <Link href={tenantRetailOwnerRoute()}>Manage store</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

/** @deprecated use TenantRetailAttachPanel */
export const BeautyRetailAttachPanel = TenantRetailAttachPanel;
