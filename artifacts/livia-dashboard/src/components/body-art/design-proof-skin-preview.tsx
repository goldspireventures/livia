import { useState } from "react";
import type { SkinPreviewBodyZone } from "@workspace/policy";
import { cn } from "@/lib/utils";
import {
  bodyArtSkinPreviewEnabled,
  bodyArtSkinPreviewPhase,
} from "@/lib/body-art-skin-preview-ship";
import { DesignProofPhotoSkinPreview } from "@/components/body-art/design-proof-photo-skin-preview";

const FALLBACK_ART = "/body-art/demo-proofs/serpent-bloom.svg";

export function DesignProofArtwork({
  imageUrl,
  className,
}: {
  imageUrl?: string | null;
  className?: string;
}) {
  const art = imageUrl || FALLBACK_ART;
  return (
    <div
      className={cn(
        "rounded-xl border border-border/60 bg-[#f3efe6] overflow-hidden",
        className,
      )}
      data-testid="guest-proof-artwork"
    >
      <img src={art} alt="" className="w-full max-h-[min(70vh,28rem)] object-contain mx-auto p-2" />
    </div>
  );
}

export function DesignProofSkinPreview({
  imageUrl,
  compact = false,
  className,
  defaultZone: _defaultZone,
}: {
  imageUrl?: string | null;
  compact?: boolean;
  className?: string;
  defaultZone?: SkinPreviewBodyZone;
}) {
  const phase = bodyArtSkinPreviewPhase();
  if (phase !== "phase2" && phase !== "phase3") return null;

  return (
    <DesignProofPhotoSkinPreview
      imageUrl={imageUrl}
      phase={phase}
      compact={compact}
      className={className}
    />
  );
}

export function DesignProofViewTabs({
  imageUrl,
  defaultTab = "design",
  defaultZone,
}: {
  imageUrl?: string | null;
  defaultTab?: "design" | "skin";
  defaultZone?: SkinPreviewBodyZone;
}) {
  const skinEnabled = bodyArtSkinPreviewEnabled();
  const [tab, setTab] = useState<"design" | "skin">(defaultTab);
  const art = imageUrl || FALLBACK_ART;

  if (!skinEnabled) {
    return <DesignProofArtwork imageUrl={art} />;
  }

  return (
    <div className="space-y-3" data-testid="design-proof-view-tabs">
      <div className="inline-flex rounded-lg border border-border/70 p-0.5 bg-muted/30 w-full sm:w-auto">
        <button
          type="button"
          onClick={() => setTab("design")}
          className={cn(
            "flex-1 sm:flex-none rounded-md px-4 py-1.5 text-xs font-medium transition-colors",
            tab === "design" ? "bg-background shadow-sm" : "text-muted-foreground",
          )}
        >
          Design
        </button>
        <button
          type="button"
          onClick={() => setTab("skin")}
          className={cn(
            "flex-1 sm:flex-none rounded-md px-4 py-1.5 text-xs font-medium transition-colors",
            tab === "skin" ? "bg-background shadow-sm" : "text-muted-foreground",
          )}
          data-testid="guest-proof-skin-tab"
        >
          On skin
        </button>
      </div>

      {tab === "design" ? (
        <DesignProofArtwork imageUrl={art} />
      ) : (
        <DesignProofSkinPreview imageUrl={art} defaultZone={defaultZone} />
      )}
    </div>
  );
}
