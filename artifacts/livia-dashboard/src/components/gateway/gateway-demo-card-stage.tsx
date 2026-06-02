import {
  Calendar,
  ClipboardCheck,
  ImageIcon,
  Inbox,
  Loader2,
  MessageSquare,
  Sparkles,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { Link } from "wouter";
import type { WedgeDemoBeat } from "@workspace/policy";
import type { DemoRosterEntry } from "@/lib/demo-portal";
import { WedgeFeaturePreview } from "@/components/gateway/wedge-feature-preview";
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

type StoryProps = {
  beats: WedgeDemoBeat[];
  disabled?: boolean;
  backHref?: string;
  backLabel?: string;
  onContinue: () => void;
};

/** G2 — four platform surfaces on one card (inbox, book, SMS, today, …). */
export function GatewayDemoStoryBeats({
  beats,
  disabled,
  backHref = "/demo",
  backLabel = "← Worlds",
  onContinue,
}: StoryProps) {
  return (
    <article
      className="rounded-3xl border-2 border-[#d9b97a]/45 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-1 shadow-[0_0_60px_-20px_rgba(217,185,122,0.28)]"
      data-testid="gateway-demo-card-stage"
    >
      <div className="rounded-[1.35rem] border border-primary/25 bg-[#0a0c12]/90 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <Link
            href={backHref}
            className="inline-flex min-h-[44px] items-center rounded-full border border-[#d9b97a]/35 bg-[#d9b97a]/10 px-3.5 text-sm text-[#e6d0a5] transition hover:border-[#d9b97a]/55 hover:bg-[#d9b97a]/15"
            data-testid="gateway-demo-back-worlds"
          >
            {backLabel}
          </Link>
          <div
            className="max-w-[11rem] rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-2 text-right sm:max-w-[200px]"
            data-testid="gateway-sign-in-liv-briefing"
          >
            <p className="text-[10px] font-medium text-[#d9b97a]">Liv · briefing</p>
            <p className="mt-0.5 text-[11px] leading-snug text-foreground/85">Patch test due — Emma, 2pm.</p>
          </div>
        </div>

        <div
          className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2"
          data-testid="gateway-demo-beats-grid"
        >
          {beats.map((beat, i) => (
            <div
              key={`${beat.cropHint}-${i}`}
              className="rounded-xl border border-[#d9b97a]/20 bg-white/[0.03] p-3"
              data-testid={`gateway-demo-beat-${beat.cropHint}`}
            >
              <WedgeFeaturePreview beat={beat} />
              <p className="mt-2.5 text-sm font-medium leading-snug text-foreground">{beat.headline}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{beat.detail}</p>
            </div>
          ))}
        </div>

        <button
          type="button"
          disabled={disabled}
          onClick={onContinue}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
          data-testid="gateway-demo-continue"
        >
          Continue
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}

type EnterProps = {
  tradeLabel: string;
  businessName: string;
  roster: DemoRosterEntry[];
  busy: string | null;
  disabled?: boolean;
  backHref?: string;
  backLabel?: string;
  onSelectRole: (email: string) => void;
  onBack: () => void;
};

/** G3 — persona / role selector (tap role → demo sign-in). */
export function GatewayDemoEnterStage({
  tradeLabel,
  businessName,
  roster,
  busy,
  disabled,
  backHref = "/demo",
  backLabel = "← Worlds",
  onSelectRole,
  onBack,
}: EnterProps) {
  return (
    <article
      className="rounded-3xl border-2 border-[#d9b97a]/45 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-1 shadow-[0_0_60px_-20px_rgba(217,185,122,0.28)]"
      data-testid="gateway-demo-card-stage"
    >
      <div className="rounded-[1.35rem] border border-primary/25 bg-[#0a0c12]/90 p-4 sm:p-5">
        <Link
          href={backHref}
          className="inline-flex min-h-[44px] items-center rounded-full border border-[#d9b97a]/35 bg-[#d9b97a]/10 px-3.5 text-sm text-[#e6d0a5] transition hover:border-[#d9b97a]/55"
          data-testid="gateway-demo-back-worlds"
        >
          {backLabel}
        </Link>
        <div className="mt-4 space-y-1">
          <p className="font-serif text-lg text-[#e6d0a5]/95">{tradeLabel}</p>
          <p className="text-base font-medium text-foreground">{businessName}</p>
          <p className="text-sm text-muted-foreground">Tap a role to walk into the live demo.</p>
        </div>

        <div className="mt-5" data-testid="gateway-demo-enter-roles">
          <div className="grid grid-cols-2 gap-2">
            {roster.map((entry) => {
              const loading = busy === entry.email;
              const primary = entry.role === "owner";
              return (
                <button
                  key={entry.email}
                  type="button"
                  disabled={!!busy || disabled}
                  onClick={() => onSelectRole(entry.email)}
                  className={cn(
                    "rounded-xl border px-3 py-2.5 text-left transition disabled:opacity-60",
                    primary
                      ? "border-primary/50 bg-primary/15 hover:border-primary/70"
                      : "border-white/15 bg-white/5 hover:border-white/30",
                  )}
                >
                  <span className="flex items-center justify-between gap-1">
                    <span className="text-sm font-medium">
                      {loading ? "Signing in…" : entry.label.split(" · ").pop()}
                    </span>
                    {!loading ? <ArrowRight className="h-3.5 w-3.5 text-primary" /> : null}
                  </span>
                  <span className="mt-0.5 block truncate text-[9px] font-mono text-muted-foreground">
                    {entry.email}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          className="mx-auto mt-4 block text-sm text-muted-foreground hover:text-foreground"
          onClick={onBack}
        >
          ← Back to story
        </button>
      </div>
    </article>
  );
}

/** Two-step progress: story → enter. */
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
      aria-label={slide === "story" ? "Story" : "Choose role"}
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
