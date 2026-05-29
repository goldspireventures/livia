import { useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LiviaWordmark } from "@/components/brand/LiviaMark";
import { apiFetch } from "@/lib/api-fetch";
import { legalUrl } from "@/lib/surface-urls";
import { Loader2 } from "lucide-react";

const TOS_URL = legalUrl("tos");
const PRIVACY_URL = legalUrl("privacy");
const DPA_URL = legalUrl("dpa");

type MeLegal = {
  platformLegalAccepted?: boolean;
};

type BusinessRow = { id: string };

export default function LegalAcceptancePage() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [agreed, setAgreed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!agreed) return;
    setSaving(true);
    setError(null);
    try {
      await apiFetch("/me/platform-legal", {
        method: "POST",
        body: JSON.stringify({ accept: true }),
      });
      await queryClient.invalidateQueries({ queryKey: ["me-legal"] });

      let destination = "/onboarding";
      try {
        const businesses = await apiFetch<BusinessRow[]>("/me/businesses");
        if (businesses.length > 0) {
          destination = "/dashboard";
        }
      } catch {
        // Fall back to onboarding if businesses list is unavailable
      }

      navigate(destination);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not save acceptance";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-background">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute left-1/2 top-1/3 h-[640px] w-[640px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-aurora-cyan/10 blur-[140px]" />
      </div>
      <header className="relative z-10 px-6 py-6">
        <LiviaWordmark size="md" />
      </header>
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 pb-16">
        <Card className="w-full max-w-lg border-primary/10">
          <CardHeader>
            <CardTitle className="font-serif text-2xl">Before you set up your shop</CardTitle>
            <CardDescription>
              Livia is a business platform for salons, studios, and clinics — not a personal consumer app.
              You need to accept our platform terms to create a location. Same path whether you signed up
              with email or Google.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-5">
              <li>
                <strong className="text-foreground font-medium">No KYB in closed beta</strong> — we do not
                verify Companies Registration, VAT, or licences in-product yet. You attest that you operate a
                legitimate business when you create your shop.
              </li>
              <li>
                You remain responsible for your own client-facing policies, insurance, and sector rules (e.g.
                medspa, tattoo, financial promotions).
              </li>
              <li>
                Legal pages are beta scaffolds — counsel review before public launch is tracked in{" "}
                <code className="text-xs">docs/legal/</code>.
              </li>
            </ul>

            <div className="flex flex-wrap gap-3 text-sm">
              <a href={TOS_URL} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Terms of service
              </a>
              <a
                href={PRIVACY_URL}
                target="_blank" rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Privacy policy
              </a>
              <a href={DPA_URL} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                DPA (processor)
              </a>
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox checked={agreed} onCheckedChange={(v) => setAgreed(v === true)} />
              <span className="text-sm leading-relaxed">
                I agree to the Livia Terms of Service and Privacy Policy on behalf of the business I am setting
                up, and I confirm I am authorised to do so.
              </span>
            </label>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <Button className="w-full" disabled={!agreed || saving} onClick={() => void submit()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue to setup"}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Opening a demo shop? Use <strong className="text-foreground">Continue to setup</strong> above — you
              will land on your dashboard if that business is already provisioned.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
