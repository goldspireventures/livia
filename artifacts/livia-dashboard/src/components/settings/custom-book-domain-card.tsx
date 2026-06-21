import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { customFetch } from "@workspace/api-client-react";
import { guestBookHostForSlug } from "@workspace/policy";

type Props = {
  businessId: string;
  slug: string;
  initialDomain?: string | null;
  initialVerified?: boolean;
};

export function CustomBookDomainCard({
  businessId,
  slug,
  initialDomain,
  initialVerified = false,
}: Props) {
  const { toast } = useToast();
  const [domain, setDomain] = useState(initialDomain ?? "");
  const [verified, setVerified] = useState(initialVerified);
  const [busy, setBusy] = useState(false);
  const cnameTarget = guestBookHostForSlug(slug, "livia-hq.com");

  useEffect(() => {
    setDomain(initialDomain ?? "");
    setVerified(initialVerified);
  }, [initialDomain, initialVerified]);

  async function save() {
    setBusy(true);
    try {
      const row = await customFetch<{
        customBookDomain?: string | null;
        customBookDomainVerified?: boolean;
      }>(`/api/businesses/${businessId}`, {
        method: "PATCH",
        body: JSON.stringify({
          customBookDomain: domain.trim() || null,
          customBookDomainVerified: verified && Boolean(domain.trim()) ? verified : false,
        }),
      });
      setDomain(row.customBookDomain ?? "");
      setVerified(Boolean(row.customBookDomainVerified));
      toast({ title: "Custom domain saved" });
    } catch {
      toast({ title: "Could not save domain", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  async function verifyDns() {
    if (!domain.trim()) return;
    setBusy(true);
    try {
      await save();
      const result = await customFetch<{
        verified: boolean;
        message: string;
        target?: string;
        customBookDomainVerified?: boolean;
      }>(`/api/businesses/${businessId}/custom-book-domain/verify`, {
        method: "POST",
      });
      setVerified(Boolean(result.verified || result.customBookDomainVerified));
      toast({
        title: result.verified ? "Domain verified" : "DNS not ready yet",
        description: result.message,
        variant: result.verified ? "default" : "destructive",
      });
    } catch (err: unknown) {
      const body = err as { message?: string; verified?: boolean };
      toast({
        title: "Verification failed",
        description: body.message ?? "Add the CNAME record and try again.",
        variant: "destructive",
      });
      setVerified(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-border/50 bg-background/50 p-4" data-testid="custom-book-domain-card">
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium">Custom book domain</p>
        {verified && domain ? (
          <Badge variant="outline" className="text-[10px]">
            Verified
          </Badge>
        ) : null}
      </div>
      <p className="text-xs text-muted-foreground">
        Branded URL instead of <code>{slug}.livia-hq.com</code>. Point a CNAME at{" "}
        <code>{cnameTarget}</code>, then verify DNS.
      </p>
      <div className="space-y-2">
        <Label className="text-xs">Domain</Label>
        <Input
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="book.yourstudio.ie"
          className="font-mono text-xs"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="secondary" disabled={busy} onClick={() => void save()}>
          Save
        </Button>
        <Button type="button" size="sm" disabled={busy || !domain.trim()} onClick={() => void verifyDns()}>
          Verify DNS
        </Button>
      </div>
    </div>
  );
}
