import { useEffect, useMemo, useState } from "react";
import { Link, Redirect } from "wouter";
import { SignIn } from "@clerk/clerk-react";
import { useTheme } from "next-themes";
import { ChevronDown, ArrowRight } from "lucide-react";
import { LiviaLogoLink } from "@/components/brand/livia-logo-link";
import { DemoPasswordSignIn } from "@/components/demo-password-sign-in";
import { GatewaySignInStory } from "@/components/gateway/gateway-sign-in-story";
import { fetchDemoCatalog } from "@/lib/demo-portal";
import { isDemoLoginEnabled } from "@/lib/persona";
import { isSignedOutLanding } from "@/lib/auth-routes";
import { clerkGatewayAppearance } from "@/lib/clerk-gateway-appearance";
import { getMarketingOrigin } from "@/lib/surface-urls";
import {
  getMarketingDemoConciergeUrl,
  hasMarketingDemoGateKey,
} from "@/lib/marketing-demo-gate";
import { Button } from "@/components/ui/button";
import { SignInTenantPreview } from "@/components/sign-in-tenant-preview";
import {
  useDebouncedClerkIdentifierEmail,
  useSignInAppearanceHint,
} from "@/lib/sign-in-appearance-hint";

function useBetaSignInMode(): boolean {
  return useMemo(() => {
    if (typeof window === "undefined") return false;
    const params = new URLSearchParams(window.location.search);
    return params.get("beta") === "1" || params.get("real") === "1";
  }, []);
}

export default function SignInPage() {
  const { theme } = useTheme();
  const [devPassword, setDevPassword] = useState<string | undefined>();
  const marketing = getMarketingOrigin();
  const betaMode = useBetaSignInMode();
  const clerkEmail = useDebouncedClerkIdentifierEmail();
  const { hint: appearanceHint, loading: appearanceLoading } = useSignInAppearanceHint(clerkEmail);

  useEffect(() => {
    if (!isDemoLoginEnabled) return;
    fetchDemoCatalog()
      .then((c) => setDevPassword(c.sharedPassword ?? c.devPassword))
      .catch(() => undefined);
  }, []);

  if (isDemoLoginEnabled && !betaMode && !isSignedOutLanding()) {
    return <Redirect to="/demo" />;
  }

  const showProductionStory = !isDemoLoginEnabled;
  const invitedDemo = isSignedOutLanding() || hasMarketingDemoGateKey();
  const invitedDemoUrl = getMarketingDemoConciergeUrl();

  return (
    <div className="relative flex min-h-[100dvh] w-full flex-col overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[18%] h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-aurora-cyan/10 blur-[120px] lg:left-[28%] lg:top-1/3 lg:h-[640px] lg:w-[640px] lg:blur-[140px]" />
        <div className="absolute bottom-0 right-0 h-[280px] w-[280px] translate-x-1/4 translate-y-1/4 rounded-full bg-aurum-champagne/5 blur-[100px] lg:hidden" />
      </div>

      <header className="relative z-10 flex shrink-0 items-center justify-between px-5 py-5 sm:px-6 sm:py-6">
        <LiviaLogoLink size="md" home="marketing" />
        {isDemoLoginEnabled ? (
          invitedDemo ? (
            <a
              href={invitedDemoUrl}
              className="inline-flex min-h-[44px] items-center gap-1 text-xs text-primary transition-colors hover:text-primary/80"
            >
              Invited guest demo
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          ) : (
            <Link href="/demo">
              <span className="inline-flex min-h-[44px] items-center gap-1 text-xs text-primary transition-colors hover:text-primary/80">
                Demo launcher
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          )
        ) : (
          <a
            href={`${marketing}/#waitlist`}
            className="inline-flex min-h-[44px] items-center text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Join beta
          </a>
        )}
      </header>

      <main className="relative z-10 flex flex-1 flex-col lg:flex-row lg:items-stretch">
        {showProductionStory ? (
          <section className="flex shrink-0 flex-col justify-center px-5 pb-2 pt-2 sm:px-8 lg:w-[min(52%,560px)] lg:max-w-none lg:px-12 lg:pb-16 lg:pt-8 xl:px-16">
            <GatewaySignInStory />
          </section>
        ) : null}

        <section className="flex flex-1 flex-col justify-center px-4 pb-10 pt-2 sm:px-6 lg:px-10 lg:pb-16 xl:px-14">
          <div className="mx-auto w-full max-w-md">
            {isSignedOutLanding() ? (
              <p className="mb-6 rounded-xl border border-border/60 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                You&apos;re signed out.{" "}
                <a href={invitedDemoUrl} className="font-medium text-primary underline underline-offset-2">
                  Return to invited guest demo
                </a>{" "}
                to pick another business, or sign in with your beta account below.
              </p>
            ) : null}

            {isDemoLoginEnabled ? (
              <div className="mb-8 text-center sm:text-left">
                <h1 className="font-serif text-3xl font-normal leading-[1.08] tracking-tight sm:text-4xl">
                  Real beta account
                </h1>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  For internal staging demos, use the{" "}
                  <Link href="/demo" className="text-primary underline underline-offset-2">
                    demo launcher
                  </Link>{" "}
                  — one-click logins for every role. This page is for real Clerk beta accounts only.
                </p>
              </div>
            ) : null}

            {isDemoLoginEnabled ? (
              <div className="mb-6 rounded-xl border border-primary/30 bg-primary/5 p-4">
                <p className="mb-3 text-sm text-foreground">
                  {invitedDemo ? "Staging team? Use the internal G1 launcher." : "Staging team? Skip this form."}
                </p>
                <Button asChild className="w-full" variant={invitedDemo ? "outline" : "default"}>
                  <Link href="/demo">Open internal demo launcher (G1)</Link>
                </Button>
                {invitedDemo ? (
                  <Button asChild className="w-full mt-2">
                    <a href={invitedDemoUrl}>Return to invited guest demo</a>
                  </Button>
                ) : null}
              </div>
            ) : null}

            <SignInTenantPreview hint={appearanceHint} loading={appearanceLoading}>
              <SignIn
                appearance={clerkGatewayAppearance(theme)}
                routing="path"
                path="/sign-in"
                signUpUrl="/sign-up"
                fallbackRedirectUrl="/dashboard"
              />
            </SignInTenantPreview>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              New here?{" "}
              <a href="/sign-up" className="font-medium text-primary underline underline-offset-2">
                Create an account
              </a>
            </p>

            {isDemoLoginEnabled ? (
              <details className="group mt-6 rounded-xl border border-dashed border-border/70 bg-muted/10 open:bg-muted/20 transition-colors">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground [&::-webkit-details-marker]:hidden">
                  <span>Manual demo email + password</span>
                  <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" />
                </summary>
                <div className="border-t border-border/40 px-4 pb-4 pt-3">
                  <DemoPasswordSignIn devPasswordHint={devPassword} embedded />
                </div>
              </details>
            ) : null}
          </div>
        </section>
      </main>
    </div>
  );
}
