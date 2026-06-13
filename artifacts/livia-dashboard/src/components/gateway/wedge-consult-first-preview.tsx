import type { WedgeDemoBeat } from "@workspace/policy";
import { cn } from "@/lib/utils";

/** Event-vendor G2 mini UI — inbox, quote generator, catalogue. */
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
            <p className="text-[10px] text-white/55 mt-0.5">Birthday · blush & gold · 40 guests</p>
            <span className="mt-1 inline-block rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[8px] text-amber-200/90">
              Quote ready
            </span>
          </div>
          <div className="rounded-lg border border-white/8 bg-white/[0.03] px-2.5 py-2 opacity-80">
            <p className="text-[11px] text-white/75">Aoife Brennan</p>
            <p className="text-[10px] text-white/45 mt-0.5">Wedding draping — handoff to you</p>
          </div>
        </div>
      );
    case "quote-gen":
      return (
        <div className="p-3 space-y-2">
          <p className="text-[9px] font-mono uppercase tracking-widest text-amber-200/50">Quote generator</p>
          <p className="text-[10px] text-amber-100/80 font-medium">Birthday – standard template</p>
          <div className="space-y-1 rounded-lg border border-white/10 bg-black/30 p-2 text-[9px]">
            <div className="flex justify-between text-white/75">
              <span>Balloon garland × 1</span>
              <span className="font-mono">€280</span>
            </div>
            <div className="flex justify-between text-white/75">
              <span>Table centrepieces × 8</span>
              <span className="font-mono">€320</span>
            </div>
            <div className="flex justify-between text-white/75">
              <span>Setup & delivery × 1</span>
              <span className="font-mono">€95</span>
            </div>
            <div className="flex justify-between border-t border-white/10 pt-1 font-medium text-amber-200/90">
              <span>Deposit 30%</span>
              <span className="font-mono">€208</span>
            </div>
          </div>
          <p className="text-[8px] text-emerald-300/80">Generated from enquiry · 14s</p>
        </div>
      );
    case "catalogue":
      return (
        <div className="p-3 space-y-2">
          <p className="text-[9px] font-mono uppercase tracking-widest text-orange-200/50">Catalogue</p>
          {[
            { name: "Balloon garland", unit: "flat", price: "€280" },
            { name: "Table centrepieces", unit: "per table", price: "€40" },
            { name: "Chair covers & sashes", unit: "per guest", price: "€6" },
          ].map((row) => (
            <div
              key={row.name}
              className="flex items-center justify-between gap-2 rounded-md border border-white/8 bg-white/[0.03] px-2 py-1.5"
            >
              <span className="text-[10px] text-white/80 truncate">{row.name}</span>
              <span className="shrink-0 text-[8px] font-mono text-orange-200/70">{row.unit}</span>
              <span className="shrink-0 text-[9px] font-mono text-white/55">{row.price}</span>
            </div>
          ))}
          <p className="text-[8px] text-white/35">Units scale from guest count & tables</p>
        </div>
      );
    case "milestone-pay":
      return (
        <div className="p-3 space-y-2">
          <p className="text-[9px] font-mono uppercase tracking-widest text-emerald-200/50">Booked</p>
          <p className="text-[11px] font-medium text-white/90">Sarah accepted · deposit paid</p>
          <div className="space-y-1 text-[9px]">
            <div className="flex justify-between text-emerald-300/90">
              <span>Hold 25%</span>
              <span>Paid ✓</span>
            </div>
            <div className="flex justify-between text-white/60">
              <span>Balance 50% · T-30</span>
              <span>Due Aug</span>
            </div>
            <div className="flex justify-between text-white/40">
              <span>Final 25%</span>
              <span>Event day</span>
            </div>
          </div>
        </div>
      );
    default:
      return <div className="p-3 text-[10px] text-white/50">Preview</div>;
  }
}
