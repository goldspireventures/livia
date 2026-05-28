/** Customer (P7) — outside the org. Warm, trust-first, no tenant chrome. */

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
}: {
  businessName: string;
  city?: string | null;
  step: PublicRitualStep;
  aiGreeting?: string | null;
  /** e.g. "Medspa & aesthetics" */
  verticalLabel?: string | null;
  logoUrl?: string | null;
  description?: string | null;
  /** First pill — e.g. Treatment, Session, Groom */
  serviceStepLabel?: string;
  /** Medspa (and future regulated flows) */
  includeConsentStep?: boolean;
  /** Overrides default subhead when no aiGreeting */
  tagline?: string | null;
}) {
  const steps = buildSteps(serviceStepLabel, includeConsentStep);
  const stepIndex = Math.max(
    0,
    steps.findIndex((s) => s.key === step),
  );

  const subhead =
    aiGreeting ??
    tagline ??
    "Pick a service, choose a time, and you're booked — Liv can answer questions while you go.";

  return (
    <header className="mb-8">
      <p className="text-[10px] uppercase tracking-widest font-mono text-primary text-center mb-3">
        {verticalLabel ? `${verticalLabel} · ` : ""}Book with {businessName}
      </p>
      {logoUrl ? (
        <img
          src={logoUrl}
          alt=""
          className="h-14 w-14 mx-auto mb-3 rounded-xl object-contain border border-border/40 bg-card shadow-sm"
        />
      ) : null}
      <h1
        className="text-2xl md:text-3xl font-serif text-center tracking-tight"
        style={{ fontFamily: "var(--app-font-serif)" }}
        data-testid="text-business-name"
      >
        {businessName}
      </h1>
      {city ? (
        <p className="text-center text-sm text-muted-foreground mt-1 flex items-center justify-center gap-1">
          <span className="sr-only">Location: </span>
          {city}
        </p>
      ) : null}
      {description ? (
        <p className="text-center text-sm text-muted-foreground/90 mt-3 max-w-md mx-auto leading-relaxed px-2">
          {description}
        </p>
      ) : null}
      <p className="text-center text-sm text-muted-foreground/90 mt-4 max-w-md mx-auto leading-relaxed px-2">
        {aiGreeting ? (
          <span className="italic">{subhead}</span>
        ) : (
          subhead
        )}
      </p>
      <nav
        className="flex justify-center gap-2 mt-6 flex-wrap"
        aria-label="Booking progress"
      >
        {steps.map((s, i) => {
          const active = i === stepIndex;
          const done = i < stepIndex;
          return (
            <span
              key={s.key}
              aria-current={active ? "step" : undefined}
              className={`text-[10px] font-mono uppercase tracking-wide px-2.5 py-1 rounded-full border ${
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
    </header>
  );
}
