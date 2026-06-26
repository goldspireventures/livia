import { useEffect, useState } from "react";
import { Link } from "wouter";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronUp, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLivArrival } from "@/hooks/use-liv-arrival";
import { useBusiness } from "@/lib/business-context";
import {
  GO_LIVE_RIBBON_COPY,
  LIV_ARRIVAL_COPY,
  readLivArrivalIntroduced,
  writeLivArrivalIntroduced,
} from "@workspace/policy";
import { publicBookingUrl } from "@/lib/surface-urls";
import { useToast } from "@/hooks/use-toast";
import { LivArrivalOrb } from "@/components/liv/liv-arrival-orb";

const SPRING_PANEL = { type: "spring" as const, stiffness: 380, damping: 32, mass: 0.85 };
const EASE_OUT = [0.22, 1, 0.36, 1] as const;

const panelShell =
  "fixed bottom-[calc(4.25rem+env(safe-area-inset-bottom))] left-3 right-3 z-[60] md:bottom-6 md:left-auto md:right-6 md:w-[min(100%,420px)]";

/** Single Liv-guided conductor — genie emergence after platform tour. */
export function LivArrivalConductor() {
  const { toast } = useToast();
  const { business } = useBusiness();
  const reduce = useReducedMotion();
  const {
    isConductorActive,
    dismiss,
    advanceBeat,
    flow,
    currentPhase,
    stepIndex,
    totalSteps,
    isLoading,
  } = useLivArrival();
  const [minimized, setMinimized] = useState(false);
  const bid = business?.id ?? "";
  const [firstEmerge] = useState(() => (bid ? !readLivArrivalIntroduced(bid) : false));
  const [showIntro, setShowIntro] = useState(firstEmerge);
  const skipEnterAnimation = !firstEmerge || !!reduce;

  useEffect(() => {
    if (!isConductorActive || !bid || !firstEmerge) return;
    writeLivArrivalIntroduced(bid);
    const fadeIntro = window.setTimeout(() => setShowIntro(false), 4800);
    return () => window.clearTimeout(fadeIntro);
  }, [isConductorActive, bid, firstEmerge]);

  if (!isConductorActive || !currentPhase) return null;

  const publicUrl =
    flow.publicPath && business?.slug ? publicBookingUrl(business.slug) : null;
  const showShare =
    (flow.currentPhaseId === "publish" || flow.currentPhaseId === "first_booking") && publicUrl;
  const headline = currentPhase.headline || (isLoading ? "Loading…" : "");

  async function copyLink() {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      toast({ title: GO_LIVE_RIBBON_COPY.copied });
    } catch {
      toast({ title: "Could not copy link", variant: "destructive" });
    }
  }

  function clearIntro() {
    setShowIntro(false);
  }

  return (
    <AnimatePresence mode="wait">
      {minimized ? (
        <motion.button
          key="minimized"
          type="button"
          className={cn(
            panelShell,
            "flex w-auto max-w-none items-center gap-2.5 rounded-full border border-primary/30 bg-card/95 px-4 py-2.5 text-sm font-medium shadow-lg backdrop-blur-md md:left-auto md:right-6",
          )}
          data-testid="liv-arrival-minimized"
          onClick={() => setMinimized(false)}
          initial={skipEnterAnimation ? false : { opacity: 0, y: 16, scale: 0.94 }}
          animate={skipEnterAnimation ? undefined : { opacity: 1, y: 0, scale: 1 }}
          exit={reduce ? undefined : { opacity: 0, y: 8, scale: 0.96 }}
          transition={{ duration: 0.22, ease: EASE_OUT }}
        >
          <LivArrivalOrb size="sm" static />
          <span>{LIV_ARRIVAL_COPY.minimizedLabel(stepIndex, totalSteps)}</span>
          <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
        </motion.button>
      ) : (
        <motion.aside
          key="expanded"
          className={cn(panelShell, "origin-bottom-right")}
          data-testid="liv-arrival-conductor"
          aria-label="Liv setup guide"
          initial={
            skipEnterAnimation
              ? false
              : { opacity: 0, y: 56, scale: 0.88, transformOrigin: "bottom right" }
          }
          animate={skipEnterAnimation ? undefined : { opacity: 1, y: 0, scale: 1 }}
          exit={reduce ? undefined : { opacity: 0, y: 24, scale: 0.94 }}
          transition={SPRING_PANEL}
        >
          <div className="relative rounded-xl border border-primary/30 bg-card/95 p-4 shadow-xl backdrop-blur-md">
            <div
              className="pointer-events-none absolute -top-12 -right-8 h-28 w-28 rounded-full bg-primary/12 blur-3xl"
              aria-hidden
            />

            <div className="relative flex gap-3 items-start">
              <LivArrivalOrb emerge={firstEmerge} static={!firstEmerge} className="mt-0.5" />

              <div className="min-w-0 flex-1 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1 space-y-1">
                    <AnimatePresence mode="wait">
                      {showIntro ? (
                        <motion.div
                          key="intro"
                          initial={reduce ? false : { opacity: 0, y: 8 }}
                          animate={reduce ? undefined : { opacity: 1, y: 0 }}
                          exit={reduce ? undefined : { opacity: 0, y: -4 }}
                          transition={{ duration: 0.35, ease: EASE_OUT }}
                          className="space-y-1"
                          data-testid="liv-arrival-intro"
                        >
                          <p
                            className="text-base font-serif leading-snug text-foreground"
                            style={{ fontFamily: "var(--app-font-serif)" }}
                          >
                            {LIV_ARRIVAL_COPY.introHeadline}
                          </p>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {LIV_ARRIVAL_COPY.introSubline}
                          </p>
                        </motion.div>
                      ) : (
                        <motion.div
                          key={`beat-${currentPhase.id}`}
                          initial={reduce ? false : { opacity: 0, y: 6 }}
                          animate={reduce ? undefined : { opacity: 1, y: 0 }}
                          exit={reduce ? undefined : { opacity: 0, y: -4 }}
                          transition={{ duration: 0.28, ease: EASE_OUT }}
                          className="space-y-1"
                        >
                          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-primary">
                            {LIV_ARRIVAL_COPY.eyebrow}
                            <span className="text-muted-foreground font-normal normal-case tracking-normal">
                              {" "}
                              · {LIV_ARRIVAL_COPY.stepOf(stepIndex, totalSteps)}
                            </span>
                          </p>
                          <p className="text-sm font-semibold leading-snug">{currentPhase.label}</p>
                          <p className="text-xs text-muted-foreground leading-relaxed">{headline}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5 -mt-0.5">
                    <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" asChild>
                      <Link href="/settings?tab=liv">{GO_LIVE_RIBBON_COPY.askLiv}</Link>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-muted-foreground"
                      onClick={() => setMinimized(true)}
                    >
                      Minimize
                    </Button>
                  </div>
                </div>

                {showShare ? (
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <code className="rounded bg-muted px-2 py-1 font-mono truncate max-w-[min(100%,220px)]">
                      {publicUrl}
                    </code>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => void copyLink()}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      {GO_LIVE_RIBBON_COPY.copyLink}
                    </Button>
                    <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
                      <a href={publicUrl ?? flow.publicPath ?? "#"} target="_blank" rel="noopener noreferrer">
                        {GO_LIVE_RIBBON_COPY.preview}
                        <ExternalLink className="ml-1 h-3 w-3" />
                      </a>
                    </Button>
                  </div>
                ) : null}

                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" asChild data-testid="liv-arrival-show-me">
                    <Link href={currentPhase.href} onClick={clearIntro}>
                      {LIV_ARRIVAL_COPY.showMe}
                    </Link>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    data-testid="liv-arrival-done-next"
                    onClick={() => {
                      clearIntro();
                      void advanceBeat();
                    }}
                  >
                    {LIV_ARRIVAL_COPY.doneNext}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-muted-foreground"
                    data-testid="liv-arrival-dismiss"
                    onClick={dismiss}
                  >
                    {LIV_ARRIVAL_COPY.exploreAlone}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
