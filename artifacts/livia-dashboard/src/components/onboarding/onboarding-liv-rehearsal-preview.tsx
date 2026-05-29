import { useEffect, useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const TONE_INTROS: Record<string, string> = {
  FRIENDLY: "Happy to help!",
  PROFESSIONAL: "How may I assist you?",
  PLAYFUL: "Let's get you booked!",
};

type Props = {
  businessName: string;
  greeting: string;
  tone: string;
  className?: string;
};

export function OnboardingLivRehearsalPreview({
  businessName,
  greeting,
  tone,
  className,
}: Props) {
  const [typing, setTyping] = useState(false);

  const livLine = useMemo(() => {
    const g = greeting.trim();
    if (g) return g;
    const shop = businessName.trim() || "your shop";
    return `Hi! I'm Liv at ${shop} — how can I help you book today?`;
  }, [greeting, businessName]);

  useEffect(() => {
    setTyping(true);
    const t = window.setTimeout(() => setTyping(false), 520);
    return () => window.clearTimeout(t);
  }, [livLine, tone]);

  return (
    <div
      className={cn(
        "rounded-2xl border border-primary/20 bg-gradient-to-b from-violet-500/10 to-cyan-500/5 p-4",
        className,
      )}
      data-testid="onboarding-liv-rehearsal-preview"
    >
      <p className="text-xs font-medium text-muted-foreground mb-3">Live preview — what clients see</p>
      <div className="mx-auto w-full max-w-[220px] rounded-[1.75rem] border-2 border-border/80 bg-zinc-950 p-3 shadow-lg">
        <div className="flex items-center gap-2 mb-3">
          <span
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-primary",
              typing && "animate-pulse",
            )}
          >
            <Sparkles className="h-3.5 w-3.5" />
          </span>
          <span className="text-xs font-semibold text-zinc-100">Liv</span>
          {typing ? (
            <span className="text-[10px] text-zinc-500 ml-auto animate-pulse">typing…</span>
          ) : null}
        </div>
        <div
          className={cn(
            "rounded-xl bg-cyan-500/20 px-3 py-2 text-xs leading-relaxed text-zinc-100 transition-opacity duration-300",
            typing ? "opacity-40" : "opacity-100",
          )}
        >
          {livLine}
        </div>
        <div className="mt-2 rounded-xl bg-zinc-800/80 px-3 py-2 text-[11px] text-zinc-400">
          {TONE_INTROS[tone] ?? TONE_INTROS.FRIENDLY} Cut and colour next week?
        </div>
      </div>
    </div>
  );
}
