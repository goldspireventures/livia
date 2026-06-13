import type { WedgeDemoBeat } from "@workspace/policy";
import { cn } from "@/lib/utils";

/** Event-vendor G2 mini UI — consult-first, not salon booking chrome. */
export function WedgeConsultFirstPreview({ beat }: { beat: WedgeDemoBeat }) {
  return (
    <div
      className="wedge-consult-preview overflow-hidden rounded-xl border border-amber-500/20 bg-gradient-to-b from-[#14100c] to-[#08090e] text-left"
      data-testid={`wedge-consult-preview-${beat.cropHint}`}
    >
      {previewBody(beat.cropHint)}
    </div>
  );
}

function previewBody(hint: WedgeDemoBeat["cropHint"]) {
  switch (hint) {
    case "inbox":
      return (
        <div className="p-3 space-y-2">
          <p className="text-[9px] font-mono uppercase tracking-widest text-amber-200/50">Inbox</p>
          <div className="rounded-lg border border-violet-500/25 bg-violet-500/10 px-2.5 py-2">
            <p className="text-[11px] font-medium text-white/90">Sarah Murphy</p>
            <p className="text-[10px] text-white/55 mt-0.5">Birthday quote — tweak centrepieces?</p>
          </div>
          <div className="rounded-lg border border-white/8 bg-white/[0.03] px-2.5 py-2 opacity-80">
            <p className="text-[11px] text-white/75">Aoife Brennan</p>
            <p className="text-[10px] text-white/45 mt-0.5">Wedding draping — call requested</p>
          </div>
        </div>
      );
    case "public-book":
      return (
        <div className="relative min-h-[7.5rem]">
          <img
            src="/event-vendor-media/wedding-reception.jpg"
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-40"
            loading="lazy"
          />
          <div className="relative p-3 space-y-2">
            <p className="text-[9px] font-mono uppercase tracking-widest text-amber-100/70">
              /e/atelier-decor-dublin
            </p>
            <p className="font-serif text-sm text-amber-50/95">Enquire for your celebration</p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {["Wedding", "Birthday", "Christening"].map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-amber-200/25 bg-amber-950/50 px-2 py-0.5 text-[9px] text-amber-100/80"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      );
    case "today":
      return (
        <div className="p-3 space-y-2">
          <p className="text-[9px] font-mono uppercase tracking-widest text-sky-200/50">Pipeline</p>
          {[
            { label: "New", value: "2", tone: "text-white/70" },
            { label: "Quoted", value: "1", tone: "text-amber-200/90" },
            { label: "Booked", value: "1", tone: "text-emerald-300/90" },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between text-[10px]">
              <span className={cn("font-medium", row.tone)}>{row.label}</span>
              <span className="font-mono text-white/40">{row.value}</span>
            </div>
          ))}
          <p className="text-[9px] text-white/35 pt-1 border-t border-white/8">
            Deposit milestone · balance before event day
          </p>
        </div>
      );
    default:
      return <div className="p-3 text-[10px] text-white/50">Preview</div>;
  }
}
