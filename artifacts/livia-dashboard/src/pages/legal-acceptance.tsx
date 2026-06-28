import { useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { getMyBusinesses } from "@workspace/api-client-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LiviaLogoLink } from "@/components/brand/livia-logo-link";
import { apiFetch } from "@/lib/api-fetch";
import { legalUrl } from "@/lib/surface-urls";
import { Loader2 } from "lucide-react";
import {
  ownedSessionBusinesses,
  filterSessionBusinesses,
  resolvePostLegalDestination,
  platformLegalAcceptanceBullets,
  platformLegalAcceptanceCheckboxLabel,
  platformLegalAcceptanceContinueCta,
  platformLegalAcceptanceDescription,
  platformLegalAcceptanceFootnote,
  platformLegalAcceptanceTitle,
  type OnboardingState,
} from "@workspace/policy";
import {
  clearOnboardingMigrationIntent,
  writeOnboardingFreshSession,
} from "@/lib/onboarding-migration-intent";
import { resolveStaffInviteLandingForUser } from "@/lib/staff-invite-landing";

const TOS_URL = legalUrl("tos");
const PRIVACY_URL = legalUrl("privacy");
const DPA_URL = legalUrl("dpa");

type BusinessRow = {
  id: string;
  slug: string;
  ownerId?: string;
  vertical?: string | null;
  onboardingState?: OnboardingState | null;
};

export default function LegalAcceptancePage() {
  const [, navigate] = useLocation();
  const fromStaffInvite =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("from") === "staff-invite";
  const queryClient = useQueryClient();
  const { user } = useUser();
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
      await queryClient.invalidateQueries({ queryKey: ["/me/businesses"] });

      const clerkUserId = user?.id ?? "";
      const email = user?.primaryEmailAddress?.emailAddress ?? null;

      if (fromStaffInvite) {
        const path = await resolveStaffInviteLandingForUser({
          surface: "web",
          clerkEmail: email,
        });
        navigate(path);
        return;
      }

      let destination: "/onboarding" | "/dashboard" = "/onboarding";
      try {
        const businesses = (await queryClient.fetchQuery({
          queryKey: ["/me/businesses"],
          queryFn: () => getMyBusinesses(),
        })) as BusinessRow[];
        destination = resolvePostLegalDestination({
          businesses,
          clerkUserId,
          email,
        });
        if (destination === "/onboarding") {
          const owned = ownedSessionBusinesses(
            filterSessionBusinesses(businesses, email),
            clerkUserId,
          );
          if (owned.length === 0) {
            clearOnboardingMigrationIntent();
            writeOnboardingFreshSession();
          }
          navigate("/onboarding");
          return;
        }
      } catch {
        destination = "/onboarding";
      }

      if (destination === "/onboarding") {
        clearOnboardingMigrationIntent();
        writeOnboardingFreshSession();
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
        <LiviaLogoLink size="md" home="marketing" />
      </header>
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 pb-16">
        <Card className="w-full max-w-lg border-primary/10">
          <CardHeader>
            <CardTitle className="font-serif text-2xl">{platformLegalAcceptanceTitle()}</CardTitle>
            <CardDescription>{platformLegalAcceptanceDescription()}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-5">
              {platformLegalAcceptanceBullets().map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>

            <div className="flex flex-wrap gap-3 text-sm">
              <a href={TOS_URL} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Terms of service
              </a>
              <a
                href={PRIVACY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Privacy policy
              </a>
              <a href={DPA_URL} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Data processing (DPA)
              </a>
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox checked={agreed} onCheckedChange={(v) => setAgreed(v === true)} />
              <span className="text-sm leading-relaxed">{platformLegalAcceptanceCheckboxLabel()}</span>
            </label>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <Button className="w-full" disabled={!agreed || saving} onClick={() => void submit()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : platformLegalAcceptanceContinueCta()}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              {platformLegalAcceptanceFootnote()}
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
