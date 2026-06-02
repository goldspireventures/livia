import type { WedgeDemoBeat } from "@workspace/policy";
import { cn } from "@/lib/utils";
import { WEDGE_BEAT_CROP_META } from "./gateway-demo-card-stage";

/** Mini platform UI crops for G2 wedge story — real surfaces, not placeholders. */
export function WedgeFeaturePreview({ beat }: { beat: WedgeDemoBeat }) {
  const meta = WEDGE_BEAT_CROP_META[beat.cropHint] ?? WEDGE_BEAT_CROP_META.inbox;

  return (
    <div
      className={cn(
        "wedge-feature-preview overflow-hidden rounded-lg border bg-[#060810] text-left",
        meta.ring,
      )}
      data-testid={`wedge-feature-preview-${beat.cropHint}`}
    >
      <div className="flex items-center gap-1.5 border-b border-white/[0.06] px-2 py-1.5">
        <meta.icon className="h-3 w-3 text-[#d9b97a]" aria-hidden />
        <span className="text-[9px] font-mono uppercase tracking-widest text-[#d9b97a]/90">
          {meta.label}
        </span>
      </div>
      <div className="p-2">{previewBody(beat.cropHint)}</div>
    </div>
  );
}

function previewBody(hint: WedgeDemoBeat["cropHint"]) {
  switch (hint) {
    case "inbox":
      return (
        <ul className="space-y-1.5 text-[10px] leading-tight">
          <li className="flex items-start gap-1.5 rounded-md bg-violet-500/10 px-1.5 py-1">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" aria-hidden />
            <span>
              <span className="font-medium text-white/90">Emma</span>
              <span className="text-white/45"> · patch test reply</span>
              <span className="float-right text-[9px] text-white/35">2m</span>
            </span>
          </li>
          <li className="flex items-start gap-1.5 px-1.5 py-0.5 text-white/55">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-white/20" aria-hidden />
            <span>James · balayage consult</span>
          </li>
        </ul>
      );
    case "public-book":
      return (
        <div className="space-y-1.5 text-[10px]">
          <p className="font-medium text-cyan-200/90">Lash fill · 45 min</p>
          <div className="flex gap-1">
            {["Thu 14:00", "15:00", "16:30"].map((slot, i) => (
              <span
                key={slot}
                className={cn(
                  "rounded px-1.5 py-0.5 font-mono text-[9px]",
                  i === 0
                    ? "border border-cyan-400/50 bg-cyan-500/15 text-cyan-100"
                    : "border border-white/10 text-white/40",
                )}
              >
                {slot}
              </span>
            ))}
          </div>
          <p className="text-[9px] text-white/40">Guest books on /b — intake saved</p>
        </div>
      );
    case "sms":
      return (
        <div className="rounded-md border border-emerald-500/20 bg-emerald-950/30 px-2 py-1.5 text-[10px]">
          <p className="text-emerald-100/85">Reminder · tomorrow 2pm</p>
          <p className="mt-0.5 text-white/45">Tap to confirm or reschedule →</p>
        </div>
      );
    case "today":
      return (
        <ul className="space-y-1 text-[10px]">
          <li className="flex justify-between gap-2 text-white/85">
            <span>14:00 · Emma</span>
            <span className="font-mono text-[9px] text-sky-300/80">Stn 2</span>
          </li>
          <li className="flex justify-between gap-2 text-white/50">
            <span>15:30 · Walk-in</span>
            <span className="font-mono text-[9px] text-white/35">Queue</span>
          </li>
        </ul>
      );
    case "proof":
      return (
        <div className="flex gap-2">
          <div className="h-10 w-10 rounded border border-amber-500/30 bg-amber-950/40" />
          <div className="text-[10px] text-white/55">
            <p className="text-amber-200/90">Design proof</p>
            <p className="text-[9px]">Guest approves on phone</p>
          </div>
        </div>
      );
    case "consent":
      return (
        <div className="space-y-1 text-[10px]">
          <p className="text-rose-200/90">Treatment consent</p>
          <p className="rounded border border-rose-500/25 bg-rose-950/30 px-1.5 py-1 text-[9px] text-white/50">
            Signed on /b · audit trail
          </p>
        </div>
      );
    default:
      return null;
  }
}
