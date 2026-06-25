import { MarketingLayout } from "@/components/marketing-layout";
import { ConstellationInnerPage } from "@/components/constellation/constellation-inner-page";
import { ConstellationGlassCard } from "@/components/constellation/constellation-spine";
import { dashboardSignUpUrl } from "@/lib/marketing-links";
import { Link } from "wouter";
import { ArrowRight, Check } from "lucide-react";

const STEPS = [
  "Create your account — name, email, and password.",
  "Pick your trade and name your shop.",
  "Walk through setup: hours, services, team, and your public booking link.",
  "Share your link — first booking is the goal.",
  "Turn on SMS and phone receptionist in Settings when you're ready (included on Solo & Studio).",
] as const;

const INCLUDED = [
  "Bookings, clients, and your branded booking page",
  "Liv on Today and Inbox — vertical copy, not generic chat",
  "Guest hub so returning clients manage visits without calling",
  "Import from your previous tool via spreadsheet",
] as const;

export default function GetStartedPage() {
  const signUpHref = dashboardSignUpUrl;

  return (
    <MarketingLayout active="Get started">
      <ConstellationInnerPage narrow>
        <header className="mb-10">
          <p className="cst-section-label">Start on Livia</p>
          <h1 className="cst-page-section__title font-serif text-4xl sm:text-5xl tracking-tight">
            Register your shop{" "}
            <em className="text-[#d9c39a] not-italic">in minutes</em>
          </h1>
          <p className="text-muted-foreground mt-4 max-w-xl leading-relaxed">
            Create your account, set up your shop, and share your booking link. Most owners are live within
            an afternoon.
          </p>
        </header>

        <ConstellationGlassCard className="p-6 sm:p-8 mb-8 space-y-4">
          <h2 className="font-serif text-xl text-white">What happens next</h2>
          <ol className="space-y-3 text-sm text-muted-foreground">
            {STEPS.map((step, i) => (
              <li key={step} className="flex gap-3">
                <span className="font-mono text-[#d9c39a]/80 shrink-0">{String(i + 1).padStart(2, "0")}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <a
            href={signUpHref}
            className="inline-flex items-center gap-2 rounded-sm bg-[#d9c39a] px-5 py-3 text-sm font-medium text-black hover:bg-[#e8d4b0] transition-colors min-h-[44px]"
            data-testid="marketing-get-started-sign-up"
          >
            Create your account
            <ArrowRight className="h-4 w-4" />
          </a>
          <p className="text-xs text-muted-foreground">
            Already have an account?{" "}
            <a href={signUpHref.replace(/\/sign-up\/?$/, "/sign-in")} className="text-[#d9c39a] hover:underline">
              Sign in
            </a>
          </p>
        </ConstellationGlassCard>

        <section className="mb-10 max-w-xl">
          <h2 className="font-serif text-lg text-white mb-3">Included on every paid plan</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {INCLUDED.map((item) => (
              <li key={item} className="flex gap-2">
                <Check className="h-4 w-4 text-[#d9c39a] shrink-0 mt-0.5" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <p className="text-sm text-muted-foreground max-w-xl">
          Questions first?{" "}
          <Link href="/contact" className="text-[#d9c39a] hover:underline">
            Get in touch
          </Link>
          {" "}or{" "}
          <Link href="/#waitlist" className="text-[#d9c39a] hover:underline">
            join the waitlist
          </Link>
          . Retail and Event Operator add-ons unlock from Billing after you&apos;re live — see{" "}
          <Link href="/pricing" className="text-[#d9c39a] hover:underline">
            pricing
          </Link>
          .
        </p>
      </ConstellationInnerPage>
    </MarketingLayout>
  );
}
