import { SignUp } from "@clerk/clerk-react";
import { useTheme } from "next-themes";
import { LiviaWordmark } from "@/components/brand/LiviaMark";
import { clerkGatewayAppearance } from "@/lib/clerk-gateway-appearance";
import { getMarketingOrigin } from "@/lib/surface-urls";

const signUpRedirect = `${window.location.origin}/legal-acceptance`;

export default function SignUpPage() {
  const { theme } = useTheme();
  const marketing = getMarketingOrigin();

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
          href="/sign-in"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors min-h-[44px] inline-flex items-center"
        >
          Sign in
        </a>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-md">
          <div className="mb-8 text-left sm:text-center">
            <h1 className="font-serif text-4xl md:text-[2.75rem] font-normal leading-[1.08] tracking-tight">
              Start booking
              <span className="block mt-1 italic text-muted-foreground/90">smarter.</span>
            </h1>
            <p className="mt-3 text-sm text-aurum-champagne/80 font-serif italic">Her name is Liv.</p>
            <p className="mt-4 text-sm text-muted-foreground">
              Email and password only — then platform terms, then your shop setup.
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Closed beta may be invite-only —{" "}
              <a href={`${marketing}/#waitlist`} className="text-primary hover:underline">
                join the waitlist
              </a>
              .
            </p>
          </div>

          <SignUp
            appearance={clerkGatewayAppearance(theme)}
            routing="path"
            path="/sign-up"
            signInUrl="/sign-in"
            forceRedirectUrl={signUpRedirect}
            fallbackRedirectUrl="/legal-acceptance"
          />

          <p className="mt-5 text-center text-xs text-muted-foreground">
            Already have an account?{" "}
            <a href="/sign-in" className="font-medium text-primary underline underline-offset-2">
              Sign in
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
