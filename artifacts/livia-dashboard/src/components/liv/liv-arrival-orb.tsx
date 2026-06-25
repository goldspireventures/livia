import { motion, useReducedMotion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const SPRING = { type: "spring" as const, stiffness: 420, damping: 28, mass: 0.75 };

type Props = {
  className?: string;
  /** First emergence — brief glow ring */
  emerge?: boolean;
  size?: "sm" | "md";
};

export function LivArrivalOrb({ className, emerge = false, size = "md" }: Props) {
  const reduce = useReducedMotion();
  const dim = size === "sm" ? "h-9 w-9" : "h-11 w-11";
  const icon = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  if (reduce) {
    return (
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full border border-primary/35 bg-gradient-to-br from-primary/20 to-primary/5 text-primary shadow-[0_0_24px_hsl(var(--primary)/0.25)]",
          dim,
          className,
        )}
        aria-hidden
      >
        <Sparkles className={icon} />
      </div>
    );
  }

  return (
    <motion.div
      className={cn("relative shrink-0", className)}
      initial={{ scale: 0.12, y: 36, opacity: 0 }}
      animate={{ scale: 1, y: 0, opacity: 1 }}
      transition={SPRING}
      aria-hidden
    >
      {emerge ? (
        <span className="pointer-events-none absolute inset-0 rounded-full motion-glow-success" />
      ) : null}
      <div
        className={cn(
          "relative flex items-center justify-center rounded-full border border-primary/35 bg-gradient-to-br from-primary/25 via-primary/10 to-[hsl(var(--chart-1))]/15 text-primary shadow-[0_8px_32px_hsl(var(--primary)/0.22)]",
          dim,
          emerge && "motion-liv-pulse",
        )}
      >
        <Sparkles className={icon} />
      </div>
    </motion.div>
  );
}
