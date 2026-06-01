import { cn } from "@/lib/utils";
import { readCssPresentation } from "@/lib/presentation-layout";
import { NoirDuskBloomDrawing } from "@/components/brand/noir-dusk-bloom-drawing";

/**
 * W4 beauty sidebar watermark — noir-dusk uses vector botanical art;
 * other beauty presets use a lighter generic SVG.
 */
export function SidebarBeautyBloom({ className }: { className?: string }) {
  const preset = readCssPresentation();
  const isNoirDusk = preset === "noir-dusk";

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 left-0 bottom-0 w-full max-w-none",
        className,
      )}
      aria-hidden
      data-testid="sidebar-beauty-bloom"
      data-bloom-source={isNoirDusk ? "vector" : "svg"}
    >
      <div className="absolute inset-0 beauty-sidebar-bloom-glow" aria-hidden />
      {isNoirDusk ? (
        <NoirDuskBloomDrawing />
      ) : (
        <GenericBeautyBloomSvg />
      )}
    </div>
  );
}

function GenericBeautyBloomSvg() {
  return (
    <svg
      viewBox="0 0 180 220"
      className="absolute inset-0 h-full w-full beauty-sidebar-bloom-svg"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M52 218 C48 170 44 130 58 95 C62 82 70 72 78 62"
        stroke="hsl(330 35% 55% / 0.45)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <ellipse cx="88" cy="52" rx="24" ry="20" fill="hsl(330 40% 60% / 0.22)" />
    </svg>
  );
}
