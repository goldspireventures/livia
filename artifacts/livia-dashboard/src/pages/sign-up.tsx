import { SignUp } from "@clerk/clerk-react";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";
import { LiviaWordmark } from "@/components/brand/LiviaMark";
import { getMarketingOrigin } from "@/lib/surface-urls";

const signUpRedirect = `${window.location.origin}/legal-acceptance`;

export default function SignUpPage() {
  const { theme } = useTheme();

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
          <div className="mb-10 text-left sm:text-center">
            <h1 className="font-serif text-4xl md:text-5xl font-normal leading-[1.1] tracking-tight">
              Start booking
              <span className="block mt-1 italic text-muted-foreground/90">smarter.</span>
            </h1>
            <p className="mt-3 text-sm text-aurum-champagne/80 font-serif italic">
              Her name is Liv.
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              Create your account in under a minute — email or Google. Next you accept platform terms, then
              set up your shop.
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Closed beta may be invite-only — see{" "}
              <a href={`${getMarketingOrigin()}/#waitlist`} className="text-primary hover:underline">
                {getMarketingOrigin().replace(/^https?:\/\//, "")} waitlist
              </a>
              .
            </p>
          </div>
          <SignUp
            appearance={{
              baseTheme: theme === "dark" ? dark : undefined,
              elements: {
                formButtonPrimary:
                  "bg-primary hover:bg-primary/90 text-primary-foreground",
                card: "bg-card/80 backdrop-blur-xl border border-border shadow-xl",
              },
            }}
            routing="path"
            path="/sign-up"
            signInUrl="/sign-in"
            forceRedirectUrl={signUpRedirect}
            fallbackRedirectUrl="/legal-acceptance"
          />
        </div>
      </main>
    </div>
  );
}
