import {
  ArrowRight,
  Calendar,
  ClipboardCheck,
  ImageIcon,
  Inbox,
  Loader2,
  MessageSquare,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { Link } from "wouter";
import { GatewayBackLink } from "@/components/gateway/gateway-back-link";
import type { DemoRosterEntry } from "@/lib/demo-portal";
import { demoOpenPersonaUrl } from "@/lib/demo-portal";
import { DemoGuestClientShortcut } from "@/components/demo/demo-guest-client-shortcut";
import { DemoConsultFirstGuestShortcut } from "@/components/demo/demo-consult-first-guest-shortcut";
import { cn } from "@/lib/utils";

export const WEDGE_BEAT_CROP_META: Record<
  string,
  { label: string; icon: LucideIcon; chip: string; ring: string }
> = {
  inbox: {
    label: "Inbox",
    icon: Inbox,
    chip: "bg-violet-500/15 text-violet-300",
    ring: "border-violet-500/30",
  },
  "public-book": {
    label: "Book",
    icon: Calendar,
    chip: "bg-cyan-500/15 text-cyan-300",
    ring: "border-cyan-500/30",
  },
  proof: {
    label: "Proof",
    icon: ImageIcon,
    chip: "bg-amber-500/15 text-amber-300",
    ring: "border-amber-500/30",
  },
  consent: {
    label: "Consent",
    icon: ClipboardCheck,
    chip: "bg-rose-500/15 text-rose-300",
    ring: "border-rose-500/30",
  },
  sms: {
    label: "SMS",
    icon: MessageSquare,
    chip: "bg-emerald-500/15 text-emerald-300",
    ring: "border-emerald-500/30",
  },
  today: {
    label: "Today",
    icon: Sparkles,
    chip: "bg-sky-500/15 text-sky-300",
    ring: "border-sky-500/30",
  },
};

type EnterProps = {
  tradeLabel: string;
  businessName: string;
  roster: DemoRosterEntry[];
  disabled?: boolean;
  backHref?: string;
  backLabel?: string;
  guestOpenHref: string;
  /** Consult-first demos use public enquire — not My Livia. */
  guestShortcut?: "my-livia" | "public-enquire";
  onBack: () => void;
};

/** G3 — persona / role selector (tap role → demo sign-in). */
export function GatewayDemoEnterStage({
  tradeLabel,
  businessName,
  roster,
  disabled,
  backHref = "/demo",
  backLabel = "← Worlds",
  guestOpenHref,
  guestShortcut = "my-livia",
  onBack,
}: EnterProps) {
  return (
    <article
      className="rounded-3xl border-2 border-[#d9b97a]/45 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-1 shadow-[0_0_60px_-20px_rgba(217,185,122,0.28)]"
      data-testid="gateway-demo-card-stage"
    >
      <div className="rounded-[1.35rem] border border-primary/25 bg-[#0a0c12]/90 p-4 sm:p-5">
        <GatewayBackLink
          href={backHref}
          className="inline-flex min-h-[44px] items-center rounded-full border border-[#d9b97a]/35 bg-[#d9b97a]/10 px-3.5 text-sm text-[#e6d0a5] transition hover:border-[#d9b97a]/55"
          data-testid="gateway-demo-back-worlds"
        >
          {backLabel}
        </GatewayBackLink>
        <div className="mt-4 space-y-1">
          <p className="font-serif text-lg text-[#e6d0a5]/95">{tradeLabel}</p>
          <p className="text-base font-medium text-foreground">{businessName}</p>
          <p className="text-sm text-muted-foreground">
            Each role opens in its own tab — keep this screen to try more.
          </p>
        </div>

        <div className="mt-5 space-y-4">
          {guestShortcut === "public-enquire" ? (
            <DemoConsultFirstGuestShortcut openHref={guestOpenHref} embedded />
          ) : (
            <DemoGuestClientShortcut openHref={guestOpenHref} embedded />
          )}

          <div data-testid="gateway-demo-enter-roles">
            <p className="mb-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              Staff roles
            </p>
            <div className="grid grid-cols-2 gap-2">
              {roster.map((entry) => {
                const primary = entry.role === "owner";
                const href = demoOpenPersonaUrl({ email: entry.email });
                return (
                  <a
                    key={entry.email}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-disabled={disabled}
                    className={cn(
                      "rounded-xl border px-3 py-2.5 text-left transition hover:-translate-y-px",
                      primary
                        ? "border-primary/50 bg-primary/15 hover:border-primary/70"
                        : "border-white/15 bg-white/5 hover:border-white/30",
                      disabled && "opacity-60 pointer-events-none",
                    )}
                  >
                    <span className="flex items-center justify-between gap-1">
                      <span className="text-sm font-medium">{entry.label.split(" · ").pop()}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-primary" />
                    </span>
                    <span className="mt-0.5 block truncate text-[9px] font-mono text-muted-foreground">
                      {entry.email}
                    </span>
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        <button
          type="button"
          className="mx-auto mt-4 block text-sm text-muted-foreground hover:text-foreground"
          onClick={onBack}
        >
          ← Back to brief
        </button>
      </div>
    </article>
  );
}

/** Two-step progress: brief → enter. */
export function GatewaySlideDots({
  slide,
  className,
}: {
  slide: "story" | "enter";
  className?: string;
}) {
  const index = slide === "story" ? 0 : 1;
  return (
    <div
      className={cn("flex justify-center gap-2", className)}
      aria-label={slide === "story" ? "Studio brief" : "Choose role"}
    >
      {(["story", "enter"] as const).map((s, i) => (
        <span
          key={s}
          className={cn(
            "h-2.5 w-2.5 rounded-full transition-colors",
            i <= index ? "bg-primary" : "bg-primary/25",
          )}
        />
      ))}
    </div>
  );
}

export function GatewayBusyOverlay({ label }: { label: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-[#0c0e14] px-4 py-3 text-sm">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        {label}
      </div>
    </div>
  );
}
