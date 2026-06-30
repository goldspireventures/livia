import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

export type CeremonyPhase = "enter" | "active" | "exit";

/** Full-viewport dim + blur while Liv conductor is in ceremony. */
export function LivArrivalScrim({
  phase,
  className,
}: {
  phase: CeremonyPhase;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (typeof document === "undefined") return null;

  const visible = phase !== "exit";
  const targetOpacity = phase === "enter" ? 0.62 : phase === "active" ? 0.52 : 0;

  // Only capture pointer events during the brief "enter" emergence flourish.
  // During the persistent "active" guidance phase the dashboard must stay
  // usable (Liv's panel floats above at a higher z-index), and on "exit" the
  // overlay animates to opacity 0 but lingers in the DOM until unmounted.
  // Keeping `pointer-events: auto` outside "enter" meant a full-viewport scrim
  // silently swallowed every click on the page (e.g. header action buttons).
  const pointerClass = phase === "enter" ? "pointer-events-auto" : "pointer-events-none";

  const body = reduce ? (
    visible ? (
      <div
        className={cn("fixed inset-0 z-[55] bg-black/50", pointerClass, className)}
        aria-hidden
        data-testid="liv-arrival-scrim"
      />
    ) : null
  ) : (
    <motion.div
      className={cn(
        "fixed inset-0 z-[55]",
        pointerClass,
        "bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.14)_0%,transparent_50%)]",
        className,
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: visible ? targetOpacity : 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: phase === "exit" ? 0.38 : 0.55, ease: EASE_OUT }}
      style={{ backdropFilter: visible ? "blur(6px)" : undefined }}
      aria-hidden
      data-testid="liv-arrival-scrim"
    />
  );

  return createPortal(body, document.body);
}
