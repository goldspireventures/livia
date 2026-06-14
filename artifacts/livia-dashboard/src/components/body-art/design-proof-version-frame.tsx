import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  canGuestReviewDesignProof,
  parseDesignProofGuestFeedback,
  sortDesignProofRevisionsAsc,
  stripDesignProofGuestFeedback,
  type DesignProofRevisionView,
} from "@workspace/policy";
import { DesignProofViewTabs } from "@/components/body-art/design-proof-skin-preview";
import { clientGuestSurfacePathFromUrl } from "@/lib/guest-book-url";
import { inferProofPlacementZone } from "@/lib/body-art-proof-placement";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type GuestProofThread = {
  proofId: string;
  status: string;
  note: string | null;
  imageUrl?: string | null;
  reviewUrl: string;
  version?: number;
  versions?: DesignProofRevisionView[];
};

const FALLBACK_ART = "/body-art/demo-proofs/serpent-bloom.svg";

function proofTitle(note?: string | null): string {
  const raw = stripDesignProofGuestFeedback(note) || "Studio design";
  const idx = raw.indexOf(" — ");
  return idx > 0 ? raw.slice(0, idx) : raw;
}

function proofSubtitle(note?: string | null): string | null {
  const raw = stripDesignProofGuestFeedback(note);
  if (!raw) return null;
  const idx = raw.indexOf(" — ");
  return idx > 0 ? raw.slice(idx + 3) : null;
}

function statusLabel(status: string): string {
  if (status === "rejected") return "Changes requested";
  return status.replace(/_/g, " ");
}

function ProofVersionNav({
  currentVersion,
  latestVersion,
  canGoPrev,
  canGoNext,
  onPrev,
  onNext,
  testIdPrefix,
}: {
  currentVersion: number;
  latestVersion: number;
  canGoPrev: boolean;
  canGoNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  testIdPrefix: string;
}) {
  return (
    <div
      className="mt-3 flex items-center justify-center gap-3"
      data-testid={`${testIdPrefix}-version-nav`}
    >
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-9 w-9 rounded-full shrink-0"
        disabled={!canGoPrev}
        aria-label="Previous version"
        onClick={onPrev}
        data-testid={`${testIdPrefix}-version-prev`}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <p className="text-xs text-muted-foreground font-mono tabular-nums min-w-[5.5rem] text-center">
        v{currentVersion}
        {latestVersion > 1 ? (
          <span className="text-muted-foreground/70"> / v{latestVersion}</span>
        ) : null}
      </p>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-9 w-9 rounded-full shrink-0"
        disabled={!canGoNext}
        aria-label="Next version"
        onClick={onNext}
        data-testid={`${testIdPrefix}-version-next`}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

/** Single canvas with prev/next version navigation — latest is reviewable, older are view-only. */
export function DesignProofVersionFrame({
  proof,
  showReviewCta = true,
  compact = false,
  testIdPrefix = "guest-proof",
  hubToken,
  shopSlug,
}: {
  proof: GuestProofThread;
  showReviewCta?: boolean;
  compact?: boolean;
  testIdPrefix?: string;
  hubToken?: string | null;
  shopSlug?: string | null;
}) {
  const [fetchedVersions, setFetchedVersions] = useState<DesignProofRevisionView[] | null>(null);
  const [liveImageUrl, setLiveImageUrl] = useState<string | null | undefined>(proof.imageUrl);

  useEffect(() => {
    if (!hubToken || !shopSlug || !proof.proofId) return;
    fetch(
      `/api/public/guest-hub/shops/${encodeURIComponent(shopSlug)}/proofs/${encodeURIComponent(proof.proofId)}/versions`,
      { headers: { "X-Guest-Hub-Token": hubToken } },
    )
      .then(async (r) => {
        if (!r.ok) return null;
        return r.json() as Promise<{
          version: number;
          imageUrl: string | null;
          versions: DesignProofRevisionView[];
        }>;
      })
      .then((payload) => {
        if (!payload?.versions?.length) return;
        setFetchedVersions(payload.versions);
        if (payload.imageUrl) setLiveImageUrl(payload.imageUrl);
      })
      .catch(() => null);
  }, [hubToken, shopSlug, proof.proofId]);

  const versions = useMemo(() => {
    const source =
      fetchedVersions?.length
        ? fetchedVersions
        : proof.versions?.length
          ? proof.versions
          : [{ version: proof.version ?? 1, imageUrl: liveImageUrl ?? proof.imageUrl ?? null }];
    return sortDesignProofRevisionsAsc(source);
  }, [fetchedVersions, liveImageUrl, proof.imageUrl, proof.version, proof.versions]);

  const [idx, setIdx] = useState(() => Math.max(0, versions.length - 1));

  useEffect(() => {
    setIdx(Math.max(0, versions.length - 1));
  }, [proof.proofId, versions.length]);

  const current = versions[idx] ?? versions[versions.length - 1]!;
  const latestVersion = versions[versions.length - 1]!.version;
  const isLatest = idx === versions.length - 1;
  const canReview = canGuestReviewDesignProof(proof.status, isLatest);
  const href = clientGuestSurfacePathFromUrl(proof.reviewUrl);
  const zone = inferProofPlacementZone(proof.note);
  const artSrc = current.imageUrl || liveImageUrl || proof.imageUrl || FALLBACK_ART;

  return (
    <div
      className={cn("space-y-3", compact && "space-y-2")}
      data-testid={`${testIdPrefix}-frame-${proof.proofId}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className={cn("font-medium", compact ? "text-sm" : "text-base")}>
            {proofTitle(proof.note)}
          </p>
          {proofSubtitle(proof.note) ? (
            <p className="text-xs text-muted-foreground mt-0.5">{proofSubtitle(proof.note)}</p>
          ) : null}
          {parseDesignProofGuestFeedback(proof.note) ? (
            <p className="text-xs text-amber-800/90 dark:text-amber-200/90 mt-1">
              Your note: {parseDesignProofGuestFeedback(proof.note)}
            </p>
          ) : null}
        </div>
        <Badge variant="secondary" className="text-[10px] capitalize shrink-0">
          {statusLabel(proof.status)}
        </Badge>
      </div>

      <div className="rounded-xl border border-border/60 bg-background/40 p-2">
        <DesignProofViewTabs imageUrl={artSrc} defaultZone={zone} />

        <ProofVersionNav
          currentVersion={current.version}
          latestVersion={latestVersion}
          canGoPrev={idx > 0}
          canGoNext={idx < versions.length - 1}
          onPrev={() => setIdx((i) => Math.max(0, i - 1))}
          onNext={() => setIdx((i) => Math.min(versions.length - 1, i + 1))}
          testIdPrefix={testIdPrefix}
        />
      </div>

      {!isLatest ? (
        <p className="text-xs text-muted-foreground text-center">View only — older version</p>
      ) : null}

      {showReviewCta && canReview ? (
        <Button size="sm" className="w-full" asChild>
          <Link href={href} data-testid={`${testIdPrefix}-review-${proof.proofId}`}>
            Review & approve
          </Link>
        </Button>
      ) : showReviewCta && isLatest && proof.status === "rejected" ? (
        <p className="text-xs text-muted-foreground text-center">
          You asked for changes — the studio is revising the artwork.
        </p>
      ) : null}
    </div>
  );
}

export { proofTitle, proofSubtitle, statusLabel as proofStatusLabel, ProofVersionNav };
