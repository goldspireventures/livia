import { cn } from "@/lib/utils";
import { MOTION } from "@/lib/motion";

/** Frosted cockpit glimpse for A12 — "your day is loading". */
export function OnboardingCockpitTease({ readyCount }: { readyCount: number }) {
  const cards = [
    { label: "Today", value: "—" },
    { label: "Inbox", value: "Liv" },
    { label: "Bookings", value: "—" },
  ];
  return (
    <div
      className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-violet-500/5 p-4"
      data-testid="onboarding-cockpit-tease"
    >
      <p className="text-xs text-muted-foreground mb-3">Your cockpit wakes up when you finish</p>
      <div className="grid grid-cols-3 gap-2 opacity-90">
        {cards.map((c, i) => (
          <div
            key={c.label}
            className={cn(
              "rounded-lg border bg-background/80 px-3 py-2 transition-all duration-500",
              i < readyCount ? "border-primary/30 translate-y-0 opacity-100" : "opacity-40 translate-y-1",
              MOTION.listItem,
            )}
          >
            <p className="text-[10px] text-muted-foreground">{c.label}</p>
            <p className="text-sm font-medium">{c.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
