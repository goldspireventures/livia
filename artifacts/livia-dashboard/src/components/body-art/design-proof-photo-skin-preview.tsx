import { useCallback, useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, Sparkles, Upload } from "lucide-react";
import {
  SKIN_PREVIEW_AI_DISCLAIMER,
  SKIN_PREVIEW_PHOTO_DISCLAIMER,
  type SkinPreviewShipPhase,
} from "@workspace/policy";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { bodyArtSkinPreviewAiConfigured } from "@/lib/body-art-skin-preview-ship";

const FALLBACK_ART = "/body-art/demo-proofs/serpent-bloom.svg";

type Placement = {
  x: number;
  y: number;
  scale: number;
  rotate: number;
};

const DEFAULT_PLACEMENT: Placement = { x: 50, y: 48, scale: 0.42, rotate: 0 };

export function DesignProofPhotoSkinPreview({
  imageUrl,
  phase,
  compact = false,
  className,
}: {
  imageUrl?: string | null;
  phase: Extract<SkinPreviewShipPhase, "phase2" | "phase3">;
  compact?: boolean;
  className?: string;
}) {
  const art = imageUrl || FALLBACK_ART;
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [placement, setPlacement] = useState<Placement>(DEFAULT_PLACEMENT);
  const [dragging, setDragging] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const dragStart = useRef({ x: 0, y: 0, placement: DEFAULT_PLACEMENT });
  const stageRef = useRef<HTMLDivElement>(null);
  const aiConfigured = bodyArtSkinPreviewAiConfigured();

  useEffect(() => {
    return () => {
      if (photoUrl?.startsWith("blob:")) URL.revokeObjectURL(photoUrl);
    };
  }, [photoUrl]);

  const onPhotoPick = (file: File | null) => {
    if (!file) return;
    if (photoUrl?.startsWith("blob:")) URL.revokeObjectURL(photoUrl);
    setPhotoUrl(URL.createObjectURL(file));
    setPlacement(DEFAULT_PLACEMENT);
    setAiMessage(null);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (!photoUrl) return;
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, placement: { ...placement } };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging || !stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const dx = ((e.clientX - dragStart.current.x) / rect.width) * 100;
    const dy = ((e.clientY - dragStart.current.y) / rect.height) * 100;
    setPlacement({
      ...dragStart.current.placement,
      x: Math.min(92, Math.max(8, dragStart.current.placement.x + dx)),
      y: Math.min(92, Math.max(8, dragStart.current.placement.y + dy)),
    });
  };

  const onPointerUp = () => setDragging(false);

  const runAiEnhance = useCallback(async () => {
    if (!aiConfigured) {
      setAiMessage("Add VITE_LIVIA_BODY_ART_SKIN_AI_KEY to enable AI compositing.");
      return;
    }
    if (!photoUrl) {
      setAiMessage("Upload a placement photo first.");
      return;
    }
    setAiBusy(true);
    setAiMessage(null);
    try {
      // API route ships with Phase 3 — local scaffold until keys are wired.
      const res = await fetch("/api/body-art/skin-preview/composite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoUrl, designUrl: art, placement }),
      });
      if (!res.ok) throw new Error("AI preview not available yet");
      setAiMessage("AI compositing endpoint ready — wire model keys to enable.");
    } catch {
      setAiMessage("AI compositing isn't live yet. Manual placement preview works without keys.");
    } finally {
      setAiBusy(false);
    }
  }, [aiConfigured, art, photoUrl, placement]);

  const stageHeight = compact ? "min-h-[14rem] max-h-[18rem]" : "min-h-[16rem] max-h-[min(56vh,24rem)]";

  return (
    <div className={cn("space-y-2.5", className)} data-testid="design-proof-photo-skin-preview">
      <div className="flex flex-wrap items-center gap-2">
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border/70 px-2.5 py-1 text-[0.65rem] font-medium hover:border-primary/40 hover:bg-primary/5 transition-colors">
          <Upload className="h-3 w-3" />
          {photoUrl ? "Change photo" : "Upload placement photo"}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={(e) => onPhotoPick(e.target.files?.[0] ?? null)}
            data-testid="skin-preview-photo-input"
          />
        </label>
        {phase === "phase3" ? (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="h-7 text-[0.65rem]"
            disabled={aiBusy || !photoUrl}
            onClick={() => void runAiEnhance()}
            data-testid="skin-preview-ai-enhance"
          >
            {aiBusy ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Sparkles className="h-3 w-3 mr-1" />}
            AI enhance
          </Button>
        ) : null}
      </div>

      <div
        ref={stageRef}
        className={cn(
          "relative w-full overflow-hidden rounded-lg border border-border/60 bg-muted/30",
          stageHeight,
          photoUrl && "cursor-grab active:cursor-grabbing",
        )}
        data-testid="skin-preview-photo-stage"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        {photoUrl ? (
          <>
            <img src={photoUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <img
              src={art}
              alt=""
              className="absolute pointer-events-none mix-blend-multiply"
              style={{
                left: `${placement.x}%`,
                top: `${placement.y}%`,
                width: `${placement.scale * 100}%`,
                transform: `translate(-50%, -50%) rotate(${placement.rotate}deg)`,
                opacity: 0.88,
              }}
              onError={(e) => {
                e.currentTarget.src = FALLBACK_ART;
              }}
            />
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center text-muted-foreground">
            <ImagePlus className="h-8 w-8 opacity-40" />
            <p className="text-xs font-medium">Photo of the placement area</p>
            <p className="text-[0.65rem] leading-relaxed max-w-[14rem]">
              Upload your arm, back, or chest — then drag the design into place.
            </p>
          </div>
        )}
      </div>

      {photoUrl ? (
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="space-y-1 text-[0.62rem]">
            <span className="text-muted-foreground flex justify-between">
              Size <span className="tabular-nums">{Math.round(placement.scale * 100)}%</span>
            </span>
            <input
              type="range"
              min={0.15}
              max={0.85}
              step={0.01}
              value={placement.scale}
              onChange={(e) => setPlacement((p) => ({ ...p, scale: Number(e.target.value) }))}
              className="w-full accent-primary"
            />
          </label>
          <label className="space-y-1 text-[0.62rem]">
            <span className="text-muted-foreground flex justify-between">
              Angle <span className="tabular-nums">{placement.rotate}°</span>
            </span>
            <input
              type="range"
              min={-35}
              max={35}
              value={placement.rotate}
              onChange={(e) => setPlacement((p) => ({ ...p, rotate: Number(e.target.value) }))}
              className="w-full accent-primary"
            />
          </label>
        </div>
      ) : null}

      {aiMessage ? (
        <p className="text-[0.58rem] text-muted-foreground leading-relaxed" data-testid="skin-preview-ai-hint">
          {aiMessage}
        </p>
      ) : null}

      <p className="text-[0.58rem] text-muted-foreground leading-relaxed">
        {SKIN_PREVIEW_PHOTO_DISCLAIMER}
        {phase === "phase3" ? ` ${SKIN_PREVIEW_AI_DISCLAIMER}` : ""}
      </p>
    </div>
  );
}
