import { Link } from "wouter";
import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { usePersonaBriefing } from "@/hooks/use-persona-briefing";
import { PERSONA_ACCENT, PERSONA_LABEL, type PersonaKind } from "@/lib/persona";
import { cn } from "@/lib/utils";

type Props = {
  /** Override ritual title (e.g. when page is secondary to home) */
  title?: string;
  subtitle?: string;
  greeting?: string;
  livLine?: string;
  /** `home` = compact Today hero; `page` = title row for feature screens */
  variant?: "home" | "page";
  /** Home surfaces show quick actions */
  showActions?: boolean;
  showAlert?: boolean;
  /** @deprecated use variant="page" */
  pageHeader?: boolean;
  className?: string;
  children?: React.ReactNode;
};

export function PersonaRitualHeader({
  title,
  subtitle,
  greeting: greetingOverride,
  livLine: livLineOverride,
  variant,
  showActions = true,
  showAlert = true,
  pageHeader = false,
  className,
  children,
}: Props) {
  const { persona, ritual, greeting, livLine, livPulse, livSource, isLoading, homeSubtitle } =
    usePersonaBriefing();
  const isPage = variant === "page" || pageHeader || variant !== "home";
  const displayGreeting = isPage ? greetingOverride : (greetingOverride ?? greeting);
  const displayLivLine = isPage ? livLineOverride : (livLineOverride ?? livLine);
  const accent = PERSONA_ACCENT[persona];
  const resolvedSubtitle = subtitle ?? homeSubtitle ?? ritual.homeSubtitle;
  const showSubtitleUnderLiv =
    !isPage &&
    resolvedSubtitle &&
    (!displayLivLine || resolvedSubtitle.trim() !== String(displayLivLine).trim());

  if (isPage) {
    return (
      <header className={cn("mb-3 md:mb-4", className)} data-testid={`page-header-${persona}`}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground mb-0.5">
              {PERSONA_LABEL[persona]}
            </p>
            <h1
              className="font-serif text-xl md:text-2xl tracking-tight"
              style={{ fontFamily: "var(--app-font-serif)" }}
            >
              {title ?? ritual.homeTitle}
            </h1>
            {resolvedSubtitle ? (
              <p className="text-sm text-muted-foreground mt-0.5 max-w-2xl leading-snug">
                {resolvedSubtitle}
              </p>
            ) : null}
          </div>
          {children}
        </div>
      </header>
    );
  }

  return (
    <header
      className={cn("relative rounded-xl border overflow-hidden mb-4", className)}
      style={{
        borderColor: `${accent}33`,
        background: `linear-gradient(135deg, ${accent}0a 0%, transparent 60%)`,
      }}
      data-testid={`ritual-header-${persona}`}
    >
      <div
        className="absolute inset-y-0 left-0 w-0.5"
        style={{ backgroundColor: accent }}
        aria-hidden
      />
      <div className="px-4 py-3 pl-5 md:px-5 md:py-4 md:pl-6">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-1">
          {showAlert && ritual.alertLabel ? (
            <Badge
              variant="outline"
              className="text-[9px] uppercase tracking-wider font-mono h-5 px-1.5"
              style={{ borderColor: `${accent}55`, color: accent }}
            >
              {ritual.alertLabel}
            </Badge>
          ) : (
            <PersonaBadge persona={persona} />
          )}
          {displayGreeting ? (
            isLoading ? (
              <Skeleton className="h-4 w-48" />
            ) : (
              <p className="text-xs text-muted-foreground truncate">{displayGreeting}</p>
            )
          ) : null}
        </div>

        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h1
            className="font-serif text-xl md:text-2xl tracking-tight"
            style={{ fontFamily: "var(--app-font-serif)" }}
          >
            {title ?? ritual.homeTitle}
          </h1>
          {showActions && (ritual.primaryAction || ritual.secondaryAction) ? (
            <div className="flex flex-wrap gap-1.5 shrink-0">
              {ritual.primaryAction ? (
                <Link href={ritual.primaryAction.href}>
                  <Button size="sm" className="h-8 gap-1 text-xs">
                    {ritual.primaryAction.label}
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              ) : null}
              {ritual.secondaryAction ? (
                <Link href={ritual.secondaryAction.href}>
                  <Button size="sm" variant="outline" className="h-8 text-xs">
                    {ritual.secondaryAction.label}
                  </Button>
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>

        {displayLivLine ? (
          <div className="mt-2 flex gap-2 items-start text-sm leading-snug">
            <Sparkles className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: accent }} aria-hidden />
            <p className="text-foreground/90 min-w-0">
              {isLoading ? (
                <Skeleton className="h-4 w-full max-w-lg inline-block" />
              ) : (
                <>
                  <span className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground mr-1.5">
                    Liv
                    {livPulse === "act" ? (
                      <span className="text-destructive font-semibold"> · needs you</span>
                    ) : livPulse === "watch" ? (
                      <span className="text-amber-600 dark:text-amber-400"> · watch</span>
                    ) : livSource === "liv" ? (
                      <span className="text-primary/80"> · live</span>
                    ) : null}
                  </span>
                  {displayLivLine}
                </>
              )}
            </p>
          </div>
        ) : showSubtitleUnderLiv ? (
          <p className="text-xs text-muted-foreground mt-1 leading-snug max-w-2xl">{resolvedSubtitle}</p>
        ) : null}

        {children}
      </div>
    </header>
  );
}

function PersonaBadge({ persona }: { persona: PersonaKind }) {
  return (
    <span className="text-[9px] uppercase tracking-wider font-mono text-muted-foreground">
      {PERSONA_LABEL[persona]}
    </span>
  );
}
