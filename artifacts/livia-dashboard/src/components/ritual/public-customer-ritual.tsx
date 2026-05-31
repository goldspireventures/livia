/** Customer (P7) — outside the org. Warm, trust-first, no tenant chrome. */

import { Instagram, MapPin, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PublicSocialProof } from "@/components/public-booking/public-social-proof";

const BASE_STEPS = [
  { key: "services", label: "Service" },
  { key: "slots", label: "Time" },
  { key: "details", label: "Details" },
] as const;

const DONE_STEP = { key: "confirmed", label: "Done" } as const;

export type PublicRitualStep =
  | (typeof BASE_STEPS)[number]["key"]
  | "consent"
  | typeof DONE_STEP.key;

function buildSteps(
  serviceStepLabel: string,
  includeConsent: boolean,
): { key: PublicRitualStep; label: string }[] {
  const steps: { key: PublicRitualStep; label: string }[] = [
    { key: "services", label: serviceStepLabel },
    { key: "slots", label: "Time" },
    { key: "details", label: "Details" },
  ];
  if (includeConsent) {
    steps.push({ key: "consent", label: "Consent" });
  }
  steps.push(DONE_STEP);
  return steps;
}

function Stepper({
  steps,
  stepIndex,
}: {
  steps: { key: PublicRitualStep; label: string }[];
  stepIndex: number;
}) {
  return (
    <nav
      className="flex justify-center gap-1.5 flex-wrap"
      aria-label="Booking progress"
    >
      {steps.map((s, i) => {
        const active = i === stepIndex;
        const done = i < stepIndex;
        return (
          <span
            key={s.key}
            aria-current={active ? "step" : undefined}
            className={`text-[10px] font-mono uppercase tracking-wide px-2 py-0.5 rounded-full border ${
              active
                ? "border-primary bg-primary/10 text-primary"
                : done
                  ? "border-border text-muted-foreground"
                  : "border-transparent text-muted-foreground/50"
            }`}
            data-testid={`ritual-step-${s.key}`}
          >
            {s.label}
          </span>
        );
      })}
    </nav>
  );
}

function SocialProofInline({ proof }: { proof?: PublicSocialProof | null }) {
  if (!proof || proof.reviewCount <= 0) return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-0.5" aria-hidden>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`h-3 w-3 ${i < Math.round(proof.rating) ? "fill-primary text-primary" : "text-muted-foreground/30"}`}
          />
        ))}
      </span>
      <span className="font-medium text-foreground">{proof.rating.toFixed(1)}</span>
      <span>({proof.reviewCount}+)</span>
    </span>
  );
}

export function PublicCustomerRitual({
  businessName,
  city,
  step,
  aiGreeting,
  verticalLabel,
  logoUrl,
  description,
  serviceStepLabel = "Service",
  includeConsentStep = false,
  tagline,
  variant = "storefront",
  coverImageUrl,
  instagramHandle,
  publicAddress,
  socialProof,
  onScrollToServices,
  bookCta,
}: {
  businessName: string;
  city?: string | null;
  step: PublicRitualStep;
  aiGreeting?: string | null;
  verticalLabel?: string | null;
  logoUrl?: string | null;
  description?: string | null;
  serviceStepLabel?: string;
  includeConsentStep?: boolean;
  tagline?: string | null;
  /** Storefront = services landing; compact = in-flow steps */
  variant?: "storefront" | "compact";
  coverImageUrl?: string | null;
  instagramHandle?: string | null;
  publicAddress?: string | null;
  socialProof?: PublicSocialProof | null;
  onScrollToServices?: () => void;
  bookCta?: string;
}) {
  const steps = buildSteps(serviceStepLabel, includeConsentStep);
  const stepIndex = Math.max(
    0,
    steps.findIndex((s) => s.key === step),
  );

  const livLine =
    aiGreeting ??
    tagline ??
    "Pick a service and time — Liv can answer questions as you go.";

  const igUrl = instagramHandle
    ? `https://instagram.com/${instagramHandle.replace(/^@/, "")}`
    : null;

  if (variant === "compact") {
    return (
      <header className="mb-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-widest font-mono text-primary truncate">
              {verticalLabel ? `${verticalLabel} · ` : ""}
              {businessName}
            </p>
            {city ? (
              <p className="text-xs text-muted-foreground truncate">{city}</p>
            ) : null}
          </div>
          {logoUrl ? (
            <img
              src={logoUrl}
              alt=""
              className="h-9 w-9 shrink-0 rounded-lg object-contain border border-border/40 bg-card"
            />
          ) : null}
        </div>
        <Stepper steps={steps} stepIndex={stepIndex} />
      </header>
    );
  }

  return (
    <header className="mb-5" data-testid="public-booking-header">
      <section
        className="relative -mx-4 sm:-mx-0 overflow-hidden rounded-none sm:rounded-2xl border border-border/50 bg-card/30"
        data-testid="public-storefront-hero"
      >
        <div className="relative h-28 sm:h-32 bg-muted">
          {coverImageUrl ? (
            <img src={coverImageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-violet-500/10" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        </div>
        <div className="relative px-4 pb-3 -mt-8">
          <div className="flex items-end gap-3">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt=""
                className="h-14 w-14 rounded-xl border-2 border-background object-cover shadow-md bg-card"
              />
            ) : (
              <div className="h-14 w-14 rounded-xl border-2 border-background bg-primary/15 flex items-center justify-center text-lg font-serif">
                {businessName.charAt(0)}
              </div>
            )}
            <div className="min-w-0 flex-1 pb-0.5">
              <h1
                className="text-xl font-serif tracking-tight leading-tight truncate"
                style={{ fontFamily: "var(--app-font-serif)" }}
                data-testid="text-business-name"
              >
                {businessName}
              </h1>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                {city ? (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3 shrink-0" aria-hidden />
                    {city}
                  </p>
                ) : null}
                <SocialProofInline proof={socialProof} />
              </div>
            </div>
            {igUrl ? (
              <Button variant="outline" size="icon" className="shrink-0 h-9 w-9" asChild>
                <a href={igUrl} target="_blank" rel="noreferrer" aria-label="Instagram">
                  <Instagram className="h-4 w-4" aria-hidden />
                </a>
              </Button>
            ) : null}
          </div>

          {verticalLabel ? (
            <p className="text-[10px] uppercase tracking-widest font-mono text-primary mt-2">
              {verticalLabel}
            </p>
          ) : null}
          {description ? (
            <p className="text-sm text-muted-foreground mt-1.5 leading-snug line-clamp-2">{description}</p>
          ) : null}
          {publicAddress ? (
            <p className="text-xs text-muted-foreground mt-1.5 flex items-start gap-1.5 line-clamp-2">
              <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" aria-hidden />
              {publicAddress}
            </p>
          ) : null}
          <p className="text-xs text-muted-foreground/90 mt-2 leading-snug">
            {aiGreeting ? <span className="italic">{livLine}</span> : livLine}
          </p>
          {onScrollToServices && bookCta ? (
            <Button className="w-full mt-3 sm:hidden" size="sm" onClick={onScrollToServices}>
              {bookCta}
            </Button>
          ) : null}
        </div>
      </section>

      <div className="mt-4">
        <Stepper steps={steps} stepIndex={stepIndex} />
      </div>
    </header>
  );
}
