import { useCallback, useEffect, useRef, useState } from "react";
import { Maximize2, Minus, Plus, RotateCcw, X } from "lucide-react";
import {
  SKIN_PREVIEW_BODY_ZONES,
  SKIN_PREVIEW_DISCLAIMER,
  SKIN_PREVIEW_TONE_HEX,
  SKIN_PREVIEW_TONE_LABEL,
  SKIN_PREVIEW_ZONE_LABEL,
  type SkinPreviewBodyZone,
  type SkinPreviewTone,
} from "@workspace/policy";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  BodyZoneFigure,
  ZONE_STAGE_ASPECT,
  ZONE_TATTOO_PLACEMENT,
} from "@/components/body-art/body-zone-figures";

const FALLBACK_ART = "/body-art/demo-proofs/serpent-bloom.svg";

export type SkinPreviewState = {
  zone: SkinPreviewBodyZone;
  tone: SkinPreviewTone;
  healed: boolean;
  tattooRotate: number;
};

function SkinPreviewStage({
  imageUrl,
  zone,
  tone,
  healed,
  tattooRotate = 0,
  viewTilt = 0,
  showExpandHint = false,
  className,
  onClick,
}: {
  imageUrl: string;
  zone: SkinPreviewBodyZone;
  tone: SkinPreviewTone;
  healed: boolean;
  tattooRotate?: number;
  viewTilt?: number;
  showExpandHint?: boolean;
  className?: string;
  onClick?: () => void;
}) {
  const placement = ZONE_TATTOO_PLACEMENT[zone];
  const rotate = placement.rotate + tattooRotate;

  const inner = (
    <>
      <div
        className="absolute inset-0 flex items-center justify-center p-3 sm:p-5"
        style={{ perspective: "900px" }}
      >
        <div
          className="relative h-full w-full max-w-[min(100%,20rem)]"
          style={{ transform: `rotateY(${viewTilt}deg)` }}
        >
          <BodyZoneFigure zone={zone} tone={tone} className="h-full w-full" />
          <img
            src={imageUrl}
            alt=""
            className="absolute object-contain pointer-events-none mix-blend-multiply"
            style={{
              top: placement.top,
              left: placement.left,
              width: placement.width,
              height: placement.height,
              transform: `rotate(${rotate}deg)`,
              opacity: healed ? 0.8 : 0.92,
              filter: healed
                ? "saturate(0.78) contrast(0.92) brightness(0.98)"
                : "saturate(0.95) contrast(1.02)",
            }}
            onError={(e) => {
              e.currentTarget.src = FALLBACK_ART;
            }}
          />
        </div>
      </div>
      {onClick ? (
        <span
          className={cn(
            "absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-background/90 px-2 py-1 text-[0.6rem] text-muted-foreground border border-border/60 transition-opacity",
            showExpandHint ? "opacity-80" : "opacity-0 group-hover:opacity-100",
          )}
        >
          <Maximize2 className="h-3 w-3" />
          Expand
        </span>
      ) : null}
    </>
  );

  const shellClass = cn(
    "relative w-full overflow-hidden rounded-lg border border-border/60 bg-card group",
    ZONE_STAGE_ASPECT[zone],
    onClick && "cursor-zoom-in hover:border-primary/40 transition-colors",
    className,
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={shellClass} data-testid="skin-preview-stage">
        {inner}
      </button>
    );
  }

  return (
    <div className={shellClass} data-testid="skin-preview-stage">
      {inner}
    </div>
  );
}

export function SkinPreviewViewer({
  open,
  onOpenChange,
  imageUrl,
  state,
  onStateChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  state: SkinPreviewState;
  onStateChange: (patch: Partial<SkinPreviewState>) => void;
}) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [viewTilt, setViewTilt] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  useEffect(() => {
    if (!open) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setViewTilt(0);
    }
  }, [open]);

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((z) => Math.min(3, Math.max(1, z + (e.deltaY < 0 ? 0.12 : -0.12))));
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    if (zoom <= 1) return;
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    setPan({
      x: dragStart.current.panX + (e.clientX - dragStart.current.x),
      y: dragStart.current.panY + (e.clientY - dragStart.current.y),
    });
  };

  const onPointerUp = () => setDragging(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[min(96vw,42rem)] w-full p-0 gap-0 overflow-hidden border-border/80"
        data-testid="skin-preview-viewer"
      >
        <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
          <p className="text-sm font-medium">On-skin preview</p>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="px-4 pt-3 space-y-2">
          <div className="flex flex-wrap gap-1">
            {SKIN_PREVIEW_BODY_ZONES.map((z) => (
              <button
                key={z}
                type="button"
                onClick={() => onStateChange({ zone: z })}
                className={cn(
                  "rounded-full border px-2.5 py-0.5 text-xs font-medium",
                  state.zone === z
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/70",
                )}
              >
                {SKIN_PREVIEW_ZONE_LABEL[z]}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="text-muted-foreground">Skin</span>
            {(["light", "medium", "deep", "rich"] as const).map((t) => (
              <button
                key={t}
                type="button"
                title={SKIN_PREVIEW_TONE_LABEL[t]}
                onClick={() => onStateChange({ tone: t })}
                className={cn(
                  "h-6 w-6 rounded-full border-2",
                  state.tone === t ? "border-primary scale-110" : "border-transparent",
                )}
                style={{ backgroundColor: SKIN_PREVIEW_TONE_HEX[t] }}
              />
            ))}
            <button
              type="button"
              onClick={() => onStateChange({ healed: !state.healed })}
              className={cn(
                "rounded-full border px-2 py-0.5",
                state.healed ? "border-primary bg-primary/10 text-primary" : "border-border/70",
              )}
            >
              {state.healed ? "Healed" : "Fresh"}
            </button>
          </div>
        </div>

        <div
          className="relative mx-4 my-3 rounded-xl border border-border/60 bg-muted/20 overflow-hidden touch-none"
          style={{ height: "min(52vh, 22rem)" }}
          onWheel={onWheel}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          <div
            className="absolute inset-0 flex items-center justify-center transition-transform duration-75"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              cursor: zoom > 1 ? (dragging ? "grabbing" : "grab") : "default",
            }}
          >
            <div className="w-[min(78%,18rem)]" style={{ perspective: "1000px" }}>
              <SkinPreviewStage
                imageUrl={imageUrl}
                zone={state.zone}
                tone={state.tone}
                healed={state.healed}
                tattooRotate={state.tattooRotate}
                viewTilt={viewTilt}
                className="!aspect-auto h-[min(48vh,20rem)] w-full"
              />
            </div>
          </div>
        </div>

        <div className="px-4 pb-4 space-y-3 border-t border-border/60 pt-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5 text-xs">
              <span className="text-muted-foreground flex items-center justify-between">
                Tattoo angle
                <span className="tabular-nums">{state.tattooRotate}°</span>
              </span>
              <input
                type="range"
                min={-28}
                max={28}
                value={state.tattooRotate}
                onChange={(e) => onStateChange({ tattooRotate: Number(e.target.value) })}
                className="w-full accent-primary"
              />
            </label>
            <label className="space-y-1.5 text-xs">
              <span className="text-muted-foreground flex items-center justify-between">
                View tilt
                <span className="tabular-nums">{viewTilt}°</span>
              </span>
              <input
                type="range"
                min={-18}
                max={18}
                value={viewTilt}
                onChange={(e) => setViewTilt(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </label>
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-1">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setZoom((z) => Math.max(1, z - 0.25))}
              >
                <Minus className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  setZoom(1);
                  setPan({ x: 0, y: 0 });
                  setViewTilt(0);
                  onStateChange({ tattooRotate: 0 });
                }}
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            </div>
            <span className="text-[0.65rem] text-muted-foreground tabular-nums">{Math.round(zoom * 100)}%</span>
          </div>
          <p className="text-[0.62rem] text-muted-foreground leading-relaxed">{SKIN_PREVIEW_DISCLAIMER}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function useSkinPreviewControls(initialZone: SkinPreviewBodyZone = "forearm") {
  const [state, setState] = useState<SkinPreviewState>({
    zone: initialZone,
    tone: "medium",
    healed: false,
    tattooRotate: 0,
  });
  const patch = useCallback((p: Partial<SkinPreviewState>) => {
    setState((s) => ({ ...s, ...p }));
  }, []);
  return { state, patch };
}

export { SkinPreviewStage };
