import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "wouter";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronUp, Copy, ExternalLink, Layers } from "lucide-react";
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
import { LivArrivalOrb, type CeremonyPhase } from "@/components/liv/liv-arrival-orb";
import { LivArrivalScrim } from "@/components/liv/liv-arrival-scrim";

const SPRING_PANEL = { type: "spring" as const, stiffness: 320, damping: 30, mass: 0.92 };
const EASE_OUT = [0.22, 1, 0.36, 1] as const;
const CEREMONY_MS = 1400;

const panelShell =
  "fixed left-3 right-3 z-[60] md:left-auto md:right-6 md:w-[min(100%,420px)]";

/** Single Liv-guided conductor — genie emergence with dimmed dashboard. */
export function LivArrivalConductor() {
  const { toast } = useToast();
  const { business } = useBusiness();
  const reduce = useReducedMotion();
  const {
    isConductorActive,
    dismiss,
    advanceBeat,
    flow,
    capabilityBlockers,
    currentPhase,
    stepIndex,
    totalSteps,
    isLoading,
  } = useLivArrival();
  const [minimized, setMinimized] = useState(false);
  const [blockerIndex, setBlockerIndex] = useState(0);
  const [ceremonyPhase, setCeremonyPhase] = useState<CeremonyPhase>("enter");
  const [exiting, setExiting] = useState(false);
  const bid = business?.id ?? "";
  const [firstIntro] = useState(() => (bid ? !readLivArrivalIntroduced(bid) : false));
  const [showIntro, setShowIntro] = useState(firstIntro);

  useEffect(() => {
    if (!isConductorActive) return;
    setCeremonyPhase("enter");
    const settle = window.setTimeout(() => setCeremonyPhase("active"), CEREMONY_MS);
    return () => window.clearTimeout(settle);
  }, [isConductorActive]);

  useEffect(() => {
    if (!isConductorActive || !bid || !firstIntro) return;
    const mark = window.setTimeout(() => writeLivArrivalIntroduced(bid), CEREMONY_MS);
    const fadeIntro = window.setTimeout(() => setShowIntro(false), 5200);
    return () => {
      window.clearTimeout(mark);
      window.clearTimeout(fadeIntro);
    };
  }, [isConductorActive, bid, firstIntro]);

  const exitConductor = useCallback(() => {
    if (reduce) {
      dismiss();
      return;
    }
    setExiting(true);
    setCeremonyPhase("exit");
    window.setTimeout(() => {
      dismiss();
      setExiting(false);
    }, 420);
  }, [dismiss, reduce]);

  if ((!isConductorActive && !exiting) || !currentPhase) return null;

  const publicUrl =
    flow.publicPath && business?.slug ? publicBookingUrl(business.slug) : null;
  const showShare =
    (flow.currentPhaseId === "publish" || flow.currentPhaseId === "first_booking") && publicUrl;
  const hasBlockers = capabilityBlockers.length > 0;
  const activeBlocker = capabilityBlockers[blockerIndex] ?? capabilityBlockers[0];
  const headline = hasBlockers
    ? activeBlocker
      ? `${activeBlocker.capabilityName}: ${activeBlocker.blocker}`
      : currentPhase.headline || (isLoading ? "Loading…" : "")
    : currentPhase.headline || (isLoading ? "Loading…" : "");

  const ceremonyActive = ceremonyPhase === "enter" && !minimized;
  const panelBottom = ceremonyActive
    ? "bottom-[38vh]"
    : "bottom-[calc(4.25rem+env(safe-area-inset-bottom))] md:bottom-6";

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

  const content = (
    <>
      <LivArrivalScrim phase={ceremonyPhase} />
      <AnimatePresence mode="wait">
        {ceremonyActive ? (
          <motion.div
            key="hero-orb"
            className="fixed inset-x-0 bottom-[28vh] z-[58] flex flex-col items-center gap-3 pointer-events-none px-6"
            initial={reduce ? false : { opacity: 0 }}
            animate={reduce ? undefined : { opacity: 1 }}
            exit={reduce ? undefined : { opacity: 0, y: 24 }}
            transition={{ duration: 0.35, ease: EASE_OUT }}
            data-testid="liv-arrival-hero"
          >
            <LivArrivalOrb phase={ceremonyPhase} size="hero" />
            {showIntro ? (
              <motion.div
                className="text-center max-w-sm space-y-1"
                initial={reduce ? false : { opacity: 0, y: 12 }}
                animate={reduce ? undefined : { opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.45, ease: EASE_OUT }}
              >
                <p
                  className="text-lg font-serif text-foreground drop-shadow-sm"
                  style={{ fontFamily: "var(--app-font-serif)" }}
                >
                  {LIV_ARRIVAL_COPY.introHeadline}
                </p>
                <p className="text-sm text-muted-foreground">{LIV_ARRIVAL_COPY.introSubline}</p>
              </motion.div>
            ) : null}
          </motion.div>
        ) : null}

        {minimized ? (
          <motion.button
            key="minimized"
            type="button"
            className={cn(
              panelShell,
              panelBottom,
              "flex w-auto max-w-none items-center gap-2.5 rounded-full border border-primary/30 bg-card/95 px-4 py-2.5 text-sm font-medium shadow-lg backdrop-blur-md md:left-auto",
            )}
            data-testid="liv-arrival-minimized"
            onClick={() => setMinimized(false)}
            initial={{ opacity: 0, y: 16, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.22, ease: EASE_OUT }}
          >
            <LivArrivalOrb phase="active" size="sm" />
            <span>{LIV_ARRIVAL_COPY.minimizedLabel(stepIndex, totalSteps)}</span>
            <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
          </motion.button>
        ) : (
          <motion.aside
            key="expanded"
            className={cn(panelShell, panelBottom, "origin-bottom-right")}
            data-testid="liv-arrival-conductor"
            aria-label="Liv setup guide"
            initial={
              reduce
                ? false
                : {
                    opacity: 0,
                    y: ceremonyActive ? 40 : 72,
                    scale: ceremonyActive ? 0.92 : 0.86,
                    transformOrigin: "bottom right",
                  }
            }
            animate={
              reduce
                ? undefined
                : {
                    opacity: exiting ? 0 : 1,
                    y: exiting ? 56 : 0,
                    scale: exiting ? 0.88 : 1,
                  }
            }
            exit={{ opacity: 0, y: 32, scale: 0.9 }}
            transition={exiting ? { duration: 0.38, ease: EASE_OUT } : SPRING_PANEL}
          >
            <div className="relative rounded-xl border border-primary/35 bg-card/95 p-4 shadow-2xl backdrop-blur-md ring-1 ring-primary/10">
              <div
                className="pointer-events-none absolute -top-16 -right-10 h-32 w-32 rounded-full bg-primary/15 blur-3xl"
                aria-hidden
              />

              <div className="relative flex gap-3 items-start">
                {!ceremonyActive ? (
                  <LivArrivalOrb phase={ceremonyPhase} className="mt-0.5" />
                ) : (
                  <div className="w-11 shrink-0" aria-hidden />
                )}

                <div className="min-w-0 flex-1 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1 space-y-1">
                      <AnimatePresence mode="wait">
                        {showIntro && !ceremonyActive ? (
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
                            key={`beat-${currentPhase.id}-${blockerIndex}`}
                            initial={reduce ? false : { opacity: 0, y: 6 }}
                            animate={reduce ? undefined : { opacity: 1, y: 0 }}
                            exit={reduce ? undefined : { opacity: 0, y: -4 }}
                            transition={{ duration: 0.28, ease: EASE_OUT }}
                            className="space-y-1"
                          >
                            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-primary">
                              {hasBlockers ? "Needs attention" : LIV_ARRIVAL_COPY.eyebrow}
                              <span className="text-muted-foreground font-normal normal-case tracking-normal">
                                {" "}
                                ·{" "}
                                {hasBlockers
                                  ? `${blockerIndex + 1} of ${capabilityBlockers.length}`
                                  : LIV_ARRIVAL_COPY.stepOf(stepIndex, totalSteps)}
                              </span>
                            </p>
                            <p className="text-sm font-semibold leading-snug">
                              {hasBlockers
                                ? activeBlocker?.capabilityName ?? "Setup blockers"
                                : currentPhase.label}
                            </p>
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

                  {hasBlockers ? (
                    <div
                      className="rounded-md border border-amber-500/25 bg-amber-500/5 px-3 py-2 space-y-2"
                      data-testid="liv-arrival-blockers"
                    >
                      <p className="text-xs font-medium flex items-center gap-1.5 text-amber-800 dark:text-amber-200">
                        <Layers className="h-3 w-3" />
                        {capabilityBlockers.length} readiness blocker
                        {capabilityBlockers.length === 1 ? "" : "s"} — fix in order
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {capabilityBlockers.slice(0, 4).map((b, i) => (
                          <Button
                            key={`${b.capabilityId}-${b.blocker}`}
                            type="button"
                            size="sm"
                            variant={i === blockerIndex ? "secondary" : "outline"}
                            className="h-7 text-xs"
                            onClick={() => setBlockerIndex(i)}
                          >
                            {b.capabilityName}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {!ceremonyActive ? (
                    <div className="flex flex-wrap items-center gap-2">
                      {hasBlockers && activeBlocker ? (
                        <>
                          <Button size="sm" asChild data-testid="liv-arrival-blocker-fix">
                            <Link href={activeBlocker.href} onClick={clearIntro}>
                              Fix this
                            </Link>
                          </Button>
                          {capabilityBlockers.length > 1 ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={() =>
                                setBlockerIndex((i) => (i + 1) % capabilityBlockers.length)
                              }
                            >
                              Next blocker
                            </Button>
                          ) : null}
                        </>
                      ) : (
                        <>
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
                              void (async () => {
                                const result = await advanceBeat();
                                if (
                                  !result.sacredMetricMet &&
                                  flow.currentPhaseId === "first_booking"
                                ) {
                                  toast({
                                    title: "Still waiting on your first booking",
                                    description: LIV_ARRIVAL_COPY.noBookingYet,
                                  });
                                }
                              })();
                            }}
                          >
                            {LIV_ARRIVAL_COPY.doneNext}
                          </Button>
                        </>
                      )}
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="text-muted-foreground"
                        data-testid="liv-arrival-dismiss"
                        onClick={exitConductor}
                      >
                        {LIV_ARRIVAL_COPY.exploreAlone}
                      </Button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );

  if (typeof document === "undefined") return null;
  return createPortal(content, document.body);
}
