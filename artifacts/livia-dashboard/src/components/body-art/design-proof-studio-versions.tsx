import { useEffect, useMemo, useState } from "react";
import { sortDesignProofRevisionsAsc } from "@workspace/policy";
import { Button } from "@/components/ui/button";
import { DesignProofViewTabs } from "@/components/body-art/design-proof-skin-preview";
import { inferProofPlacementZone } from "@/lib/body-art-proof-placement";
import { apiFetch } from "@/lib/api-fetch";
import { ChevronLeft, ChevronRight, History } from "lucide-react";

const FALLBACK_ART = "/body-art/demo-proofs/serpent-bloom.svg";

type RevisionRow = {
  version: number;
  imageUrl: string | null;
  createdAt: string;
};

/** Studio sidebar — one artwork frame with version arrows + rollback. */
export function DesignProofStudioVersions({
  businessId,
  proofId,
  note,
  currentVersion,
  currentImageUrl,
  onRevert,
}: {
  businessId: string;
  proofId: string;
  note?: string | null;
  currentVersion: number;
  currentImageUrl?: string | null;
  onRevert: (targetVersion: number, resend: boolean) => Promise<void>;
}) {
  const [revisions, setRevisions] = useState<RevisionRow[]>([]);
  const [idx, setIdx] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!businessId || !proofId) return;
    apiFetch<RevisionRow[]>(`/businesses/${businessId}/design-proofs/${proofId}/revisions`)
      .then((rows) => setRevisions(rows))
      .catch(() => setRevisions([]));
  }, [businessId, proofId, currentVersion]);

  const versions = useMemo(() => {
    const sorted = sortDesignProofRevisionsAsc(
      revisions.length
        ? revisions
        : [{ version: currentVersion, imageUrl: currentImageUrl ?? null, createdAt: "" }],
    );
    return sorted;
  }, [revisions, currentVersion, currentImageUrl]);

  useEffect(() => {
    setIdx(Math.max(0, versions.length - 1));
  }, [proofId, versions.length, currentVersion]);

  const current = versions[idx] ?? versions[versions.length - 1]!;
  const isLatest = idx === versions.length - 1;
  const artSrc = current.imageUrl || currentImageUrl || FALLBACK_ART;

  return (
    <div className="space-y-2" data-testid="proof-desk-version-frame">
      <div className="rounded-md border border-border/60 bg-[#f3efe6]/40 p-1.5">
        <DesignProofViewTabs
          imageUrl={artSrc}
          defaultZone={inferProofPlacementZone(note)}
        />
      </div>

      {versions.length > 1 ? (
        <div className="flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-7 w-7"
            disabled={idx <= 0}
            aria-label="Previous version"
            onClick={() => setIdx((i) => Math.max(0, i - 1))}
            data-testid="proof-desk-version-prev"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <p className="text-[0.62rem] text-muted-foreground font-mono tabular-nums">
            v{current.version} / v{versions[versions.length - 1]!.version}
          </p>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-7 w-7"
            disabled={idx >= versions.length - 1}
            aria-label="Next version"
            onClick={() => setIdx((i) => Math.min(versions.length - 1, i + 1))}
            data-testid="proof-desk-version-next"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : (
        <p className="text-center text-[0.62rem] text-muted-foreground font-mono">v{current.version}</p>
      )}

      {!isLatest ? (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="h-7 w-full text-[0.68rem]"
          disabled={busy}
          onClick={() => {
            setBusy(true);
            void onRevert(current.version, true).finally(() => setBusy(false));
          }}
          data-testid="proof-desk-revert-version"
        >
          <History className="h-3 w-3 mr-1" />
          Restore v{current.version} as new version
        </Button>
      ) : null}
    </div>
  );
}
