import { useEffect, useState } from "react";
import { Link } from "wouter";
import { SignIn } from "@clerk/clerk-react";
import { useTheme } from "next-themes";
import { LiviaWordmark } from "@/components/brand/LiviaMark";
import { DemoPasswordSignIn } from "@/components/demo-password-sign-in";
import { fetchDemoCatalog } from "@/lib/demo-portal";
import { isDemoLoginEnabled } from "@/lib/persona";
import { clerkGatewayAppearance } from "@/lib/clerk-gateway-appearance";
import { getMarketingOrigin } from "@/lib/surface-urls";

export default function SignInPage() {
  const { theme } = useTheme();
  const [devPassword, setDevPassword] = useState<string | undefined>();
  const marketing = getMarketingOrigin();

  useEffect(() => {
    if (!isDemoLoginEnabled) return;
    fetchDemoCatalog()
      .then((c) => setDevPassword(c.devPassword))
      .catch(() => undefined);
  }, []);

  return (
    <div className="relative flex min-h-[100dvh] w-full flex-col overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/3 h-[640px] w-[640px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-aurora-cyan/10 blur-[140px]" />
      </div>

      <header className="relative z-10 flex items-center justify-between px-6 py-6">
        <a href={marketing} className="opacity-90 hover:opacity-100 transition-opacity">
          <LiviaWordmark size="md" />
        </a>
        <a
          href={`${marketing}/#waitlist`}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors min-h-[44px] inline-flex items-center"
        >
          Join beta
        </a>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center sm:text-left">
            <h1 className="font-serif text-4xl md:text-[2.75rem] font-normal leading-[1.08] tracking-tight">
              Your day,
              <span className="block mt-1 italic text-muted-foreground/90">already handled.</span>
            </h1>
            <p className="mt-3 text-sm text-aurum-champagne/80 font-serif italic">Her name is Liv.</p>
            <p className="mt-4 text-sm text-muted-foreground">
              Sign in with email and password — your command center for bookings, inbox, and Today.
            </p>
          </div>

          <SignIn
            appearance={clerkGatewayAppearance(theme)}
            routing="path"
            path="/sign-in"
            signUpUrl="/sign-up"
            fallbackRedirectUrl="/dashboard"
          />

          <p className="mt-5 text-center text-xs text-muted-foreground">
            New here?{" "}
            <a
              href="/sign-up"
              className="font-medium text-primary underline underline-offset-2 hover:text-primary/90"
            >
              Create an account
            </a>
            {" · "}
            <a href={marketing} className="hover:text-foreground transition-colors">
              {marketing.replace(/^https?:\/\//, "")}
            </a>
          </p>

          {isDemoLoginEnabled ? (
            <>
              <DemoPasswordSignIn devPasswordHint={devPassword} />
              <div className="mt-4 rounded-xl border border-border bg-muted/30 p-4 text-center">
                <p className="text-xs font-mono uppercase tracking-wide text-muted-foreground mb-2">
                  Full Livia demo
                </p>
                <p className="text-sm text-muted-foreground mb-3">
                  Provision once at{" "}
                  <Link href="/demo" className="text-primary font-medium underline underline-offset-2">
                    /demo
                  </Link>
                  , then open any vertical as owner.
                </p>
                <Link href="/guides">
                  <span className="text-xs text-primary hover:underline">E2E playbook →</span>
                </Link>
              </div>
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
}
