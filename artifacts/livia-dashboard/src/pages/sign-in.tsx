import { useEffect, useState } from "react";
import { Link } from "wouter";
import { SignIn } from "@clerk/clerk-react";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";
import { LiviaWordmark } from "@/components/brand/LiviaMark";
import { DemoPasswordSignIn } from "@/components/demo-password-sign-in";
import { fetchDemoCatalog } from "@/lib/demo-portal";
import { isDemoLoginEnabled } from "@/lib/persona";

export default function SignInPage() {
  const { theme } = useTheme();
  const [devPassword, setDevPassword] = useState<string | undefined>();

  useEffect(() => {
    if (!isDemoLoginEnabled) return;
    fetchDemoCatalog()
      .then((c) => setDevPassword(c.devPassword))
      .catch(() => undefined);
  }, []);

  return (
    <div className="relative flex min-h-[100dvh] w-full flex-col overflow-hidden bg-background text-foreground">
      {/* Single soft cyan halo — matches livia.io canvas treatment */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/3 h-[640px] w-[640px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-aurora-cyan/10 blur-[140px]" />
      </div>

      <header className="relative z-10 flex items-center justify-between px-6 py-6">
        <LiviaWordmark size="md" />
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-md">
          <div className="mb-10 text-center">
            <h1 className="font-serif text-4xl md:text-5xl font-normal leading-[1.1] tracking-tight text-left sm:text-center">
              Your day,
              <span className="block mt-1 italic text-muted-foreground/90">already handled.</span>
            </h1>
            <p className="mt-3 text-sm text-aurum-champagne/80 font-serif italic text-left sm:text-center">
              Her name is Liv.
            </p>
            <p className="mt-4 text-sm text-muted-foreground text-left sm:text-center">
              Sign in to your command center.
            </p>
          </div>
          <SignIn
            appearance={{
              baseTheme: theme === "dark" ? dark : undefined,
              elements: {
                formButtonPrimary:
                  "bg-primary hover:bg-primary/90 text-primary-foreground",
                card: "bg-card/80 backdrop-blur-xl border border-border shadow-xl",
              },
            }}
            routing="path"
            path="/sign-in"
            signUpUrl="/sign-up"
            fallbackRedirectUrl="/dashboard"
          />
          <p className="mt-5 text-center text-xs text-muted-foreground">
            New here? Use{" "}
            <span className="font-medium text-foreground">Continue with Google</span>{" "}
            for the fastest sign-up — or{" "}
            <a href="/sign-up" className="font-medium text-primary underline underline-offset-2 hover:text-primary/90">
              create a password account
            </a>
            .
          </p>
          <p className="mt-1 text-center text-xs text-muted-foreground/70">
            Tip: if you signed up with Google, sign in with Google — that account has no password.
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
                  <Link href="/demo" className="text-primary font-medium underline underline-offset-2 hover:text-primary/90">
                    /demo
                  </Link>
                  . Per business: <code className="text-xs">owner-&#123;short&#125;@livia.io</code> (e.g.{" "}
                  <code className="text-xs">owner-clarity@livia.io</code>) — or use{" "}
                  <Link href="/demo" className="text-primary underline underline-offset-2 hover:text-primary/90">
                    /demo → Open as owner
                  </Link>
                  .
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
