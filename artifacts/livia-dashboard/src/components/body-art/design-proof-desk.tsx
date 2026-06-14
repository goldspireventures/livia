import { useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  DESIGN_PROOF_KIND_LABEL,
  DESIGN_PROOF_PUBLISH_LABEL,
  parseDesignProofGuestFeedback,
  proofDeskSubtitle,
  stripDesignProofGuestFeedback,
  type DesignProofKind,
  type DesignProofPublishRight,
} from "@workspace/policy";
import { Link2, ExternalLink, Check, MessageSquareWarning, X, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { clientGuestTokenHref } from "@/lib/guest-book-url";
import { DesignProofStudioVersions } from "@/components/body-art/design-proof-studio-versions";
import { DesignProofSkinPreview } from "@/components/body-art/design-proof-skin-preview";
import { inferProofPlacementZone } from "@/lib/body-art-proof-placement";
import { bodyArtSkinPreviewEnabled } from "@/lib/body-art-skin-preview-ship";
import { DesignProofApproveDialog } from "@/components/body-art/design-proof-approve-dialog";
import { DesignProofEditDialog } from "@/components/body-art/design-proof-edit-dialog";

export type DesignProofRow = {
  id: string;
  status: string;
  imageUrl?: string | null;
  note?: string | null;
  guestFeedback?: string | null;
  studioNote?: string | null;
  guestToken?: string | null;
  customerName?: string | null;
  proofKind?: DesignProofKind;
  publishRight?: DesignProofPublishRight;
  version?: number;
  createdAt: string;
};

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  pending_review: "Needs review",
  approved: "Approved",
  rejected: "Changes requested",
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  draft: "secondary",
  pending_review: "default",
  approved: "outline",
  rejected: "destructive",
};

const FILTERS = ["all", "pending_review", "approved", "rejected", "draft"] as const;
type Filter = (typeof FILTERS)[number];

const FILTER_CHIP: Record<Filter, string> = {
  all: "All proofs",
  pending_review: "Needs review",
  approved: "Approved",
  rejected: "Changes requested",
  draft: "Drafts",
};

const FALLBACK_ART = "/body-art/demo-proofs/serpent-bloom.svg";

function defaultFilter(proofs: DesignProofRow[]): Filter {
  if (proofs.some((p) => p.status === "pending_review")) return "pending_review";
  return "all";
}

function customerInitials(name?: string | null): string {
  if (!name?.trim()) return "—";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
}

function proofTitle(note?: string | null): string {
  const raw = stripDesignProofGuestFeedback(note) || "Untitled design";
  const idx = raw.indexOf(" — ");
  return idx > 0 ? raw.slice(0, idx) : raw;
}

function proofPlacement(note?: string | null): string | null {
  const raw = stripDesignProofGuestFeedback(note);
  if (!raw) return null;
  const idx = raw.indexOf(" — ");
  return idx > 0 ? raw.slice(idx + 3) : null;
}

function guestFeedbackFor(p: DesignProofRow): string | null {
  return p.guestFeedback ?? parseDesignProofGuestFeedback(p.note);
}

function ClientResponsePanel({ proof }: { proof: DesignProofRow }) {
  const feedback = guestFeedbackFor(proof);
  if (proof.status !== "rejected" && !feedback) return null;

  if (feedback) {
    return (
      <div
        className="rounded-md border border-amber-500/35 bg-amber-500/8 p-3 space-y-1.5"
        data-testid="proof-desk-guest-feedback"
      >
        <p className="text-[0.7rem] font-semibold flex items-center gap-1.5 text-amber-950 dark:text-amber-100">
          <MessageSquareWarning className="h-4 w-4 shrink-0" />
          Client remarks
        </p>
        <p className="text-[0.72rem] leading-relaxed text-foreground whitespace-pre-wrap">{feedback}</p>
        <p className="text-[0.6rem] text-muted-foreground">
          Replace artwork with their notes in mind, then resend the guest link.
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-md border border-destructive/25 bg-destructive/5 p-3 space-y-1"
      data-testid="proof-desk-guest-feedback-empty"
    >
      <p className="text-[0.7rem] font-medium flex items-center gap-1.5 text-destructive">
        <MessageSquareWarning className="h-4 w-4 shrink-0" />
        Changes requested — no written notes
      </p>
      <p className="text-[0.65rem] text-muted-foreground leading-relaxed">
        The client tapped request changes without leaving remarks. Check inbox or call them, then upload a revision.
      </p>
    </div>
  );
}

export function DesignProofDesk({
  proofs,
  businessId,
  businessSlug,
  initialProofId,
  onSetStatus,
  onPatchProof,
  onCopyGuestLink,
}: {
  proofs: DesignProofRow[];
  businessId: string;
  businessSlug?: string;
  /** Deep link from notification bell — open this proof on load. */
  initialProofId?: string | null;
  onSetStatus: (id: string, status: string, publishRight?: DesignProofPublishRight) => void;
  onPatchProof: (
    id: string,
    patch: {
      imageUrl?: string;
      note?: string;
      replaceArtwork?: boolean;
      resendAfterReplace?: boolean;
      revertToVersion?: number;
      resendAfterRevert?: boolean;
      proofKind?: DesignProofKind;
      publishRight?: DesignProofPublishRight;
    },
  ) => Promise<void>;
  onCopyGuestLink: (token: string) => void;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [filterTouched, setFilterTouched] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [approveOpen, setApproveOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [skinTab, setSkinTab] = useState<"actions" | "skin">("actions");
  const skinPreviewEnabled = bodyArtSkinPreviewEnabled();

  useEffect(() => {
    if (!skinPreviewEnabled && skinTab === "skin") setSkinTab("actions");
  }, [skinPreviewEnabled, skinTab]);

  useEffect(() => {
    if (filterTouched || proofs.length === 0) return;
    setFilter(defaultFilter(proofs));
  }, [proofs, filterTouched]);

  useEffect(() => {
    if (!initialProofId || selectedId) return;
    const match = proofs.find((p) => p.id === initialProofId);
    if (!match) return;
    setSelectedId(match.id);
    setFilter(match.status === "rejected" ? "rejected" : (match.status as Filter));
  }, [initialProofId, proofs, selectedId]);

  useEffect(() => {
    if (selectedId || initialProofId || proofs.length === 0) return;
    const needsAttention = proofs.find(
      (p) => p.status === "rejected" || Boolean(guestFeedbackFor(p)),
    );
    if (needsAttention) {
      setSelectedId(needsAttention.id);
      if (needsAttention.status === "rejected") setFilter("rejected");
    }
  }, [proofs, selectedId, initialProofId]);

  const filtered = useMemo(() => {
    if (filter === "all") return proofs;
    return proofs.filter((p) => p.status === filter);
  }, [proofs, filter]);

  useEffect(() => {
    if (selectedId && !filtered.some((p) => p.id === selectedId)) {
      setSelectedId(null);
    }
  }, [filtered, selectedId]);

  const selected = selectedId ? proofs.find((p) => p.id === selectedId) ?? null : null;
  const proofKind = selected?.proofKind ?? "custom_commission";

  const counts = useMemo(() => {
    const c: Partial<Record<Filter, number>> = { all: proofs.length };
    for (const p of proofs) {
      const key = p.status as Filter;
      c[key] = (c[key] ?? 0) + 1;
    }
    return c;
  }, [proofs]);

  const guestUrl =
    selected?.guestToken && businessSlug
      ? clientGuestTokenHref(businessSlug, "proof", selected.guestToken)
      : null;

  const showGuestPanel = selected?.status === "pending_review" && !!guestUrl;

  return (
    <>
      <div
        className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(17rem,22rem)] design-proof-desk preset-operator-surface w-full text-[90%]"
        data-testid="design-proof-desk"
      >
        <div className="space-y-3.5 min-w-0">
          <p className="text-xs text-muted-foreground leading-relaxed">{proofDeskSubtitle()}</p>

          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => {
              const n = counts[f];
              if (f !== "all" && !n) return null;
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => {
                    setFilterTouched(true);
                    setFilter(f);
                  }}
                  className={cn(
                    "rounded-full border px-2.5 py-0.5 text-[0.72rem] font-medium transition-colors",
                    filter === f
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/80 hover:border-primary/30",
                  )}
                >
                  {FILTER_CHIP[f]}
                  {n ? <span className="ml-1 tabular-nums opacity-70">({n})</span> : null}
                </button>
              );
            })}
          </div>

          {filtered.length === 0 ? (
            <p
              className="text-sm text-muted-foreground py-10 text-center rounded-lg border border-dashed border-border/70"
              data-testid="design-proofs-queue"
            >
              No proofs in this view — upload studio artwork to start a client review.
            </p>
          ) : (
            <ul
              className="grid gap-2.5 w-full sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              data-testid="design-proofs-queue"
            >
              {filtered.map((p) => {
                const isSelected = selected?.id === p.id;
                const kind = p.proofKind ?? "custom_commission";
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedId((id) => (id === p.id ? null : p.id));
                        setSkinTab("actions");
                      }}
                      className={cn(
                        "w-full text-left rounded-lg border overflow-hidden transition-shadow",
                        "bg-card hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        isSelected && "ring-2 ring-primary/40 border-primary/30 shadow-sm",
                      )}
                      data-testid={`design-proof-card-${p.id}`}
                    >
                      <div className="flex items-center gap-2 px-2.5 pt-2.5 pb-1.5">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[0.6rem] font-semibold">
                          {customerInitials(p.customerName)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[0.72rem] font-medium truncate">
                            {p.customerName || "Walk-in / flash"}
                          </p>
                          <p className="text-[0.62rem] text-muted-foreground">
                            v{p.version ?? 1} · {formatDistanceToNow(new Date(p.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <div className="aspect-square bg-[#f3efe6] relative mx-2.5 rounded-md overflow-hidden border border-border/40">
                        <img
                          src={p.imageUrl || FALLBACK_ART}
                          alt=""
                          className="h-full w-full object-contain p-1.5"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.src = FALLBACK_ART;
                          }}
                        />
                      </div>
                      <div className="px-2.5 py-2 space-y-1">
                        <p className="text-[0.72rem] font-medium line-clamp-1">{proofTitle(p.note)}</p>
                        {proofPlacement(p.note) ? (
                          <p className="text-[0.62rem] text-muted-foreground line-clamp-1">
                            {proofPlacement(p.note)}
                          </p>
                        ) : null}
                        {guestFeedbackFor(p) ? (
                          <p className="text-[0.6rem] text-amber-800 dark:text-amber-200 line-clamp-2 flex items-start gap-1">
                            <MessageSquareWarning className="h-3 w-3 shrink-0 mt-0.5" />
                            {guestFeedbackFor(p)}
                          </p>
                        ) : null}
                        <div className="flex flex-wrap gap-1">
                          <Badge
                            variant={STATUS_VARIANT[p.status] ?? "secondary"}
                            className="text-[0.58rem] uppercase tracking-wide h-4 px-1.5"
                          >
                            {STATUS_LABEL[p.status] ?? p.status}
                          </Badge>
                          <Badge variant="outline" className="text-[0.55rem] h-4 px-1.5">
                            {DESIGN_PROOF_KIND_LABEL[kind]}
                          </Badge>
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <aside className="space-y-2.5 lg:sticky lg:top-20 lg:self-start">
          {selected ? (
            <div
              className="rounded-lg border border-border/80 bg-card p-3 space-y-2.5"
              data-testid="design-proof-selection-panel"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 space-y-0.5">
                  <p className="text-[0.62rem] uppercase tracking-wide text-muted-foreground font-medium">
                    Selected proof
                  </p>
                  <p className="text-[0.78rem] font-semibold leading-snug">{proofTitle(selected.note)}</p>
                  <p className="text-[0.62rem] text-muted-foreground">
                    {DESIGN_PROOF_KIND_LABEL[proofKind]} · v{selected.version ?? 1}
                  </p>
                  {selected.customerName ? (
                    <p className="text-[0.65rem] text-muted-foreground">{selected.customerName}</p>
                  ) : null}
                  {selected.status === "approved" && selected.publishRight ? (
                    <p className="text-[0.62rem] text-muted-foreground">
                      {DESIGN_PROOF_PUBLISH_LABEL[selected.publishRight]}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="shrink-0 rounded-md p-1 text-muted-foreground hover:text-foreground"
                  aria-label="Clear selection"
                  onClick={() => setSelectedId(null)}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <ClientResponsePanel proof={selected} />

              <DesignProofStudioVersions
                businessId={businessId}
                proofId={selected.id}
                note={selected.note}
                currentVersion={selected.version ?? 1}
                currentImageUrl={selected.imageUrl}
                onRevert={(targetVersion, resend) =>
                  onPatchProof(selected.id, {
                    revertToVersion: targetVersion,
                    resendAfterRevert: resend,
                  })
                }
              />

              {skinPreviewEnabled ? (
                <div className="inline-flex rounded-md border border-border/70 p-0.5 bg-muted/20 w-full">
                  <button
                    type="button"
                    onClick={() => setSkinTab("actions")}
                    className={cn(
                      "flex-1 rounded px-2 py-1 text-[0.65rem] font-medium",
                      skinTab === "actions" ? "bg-background shadow-sm" : "text-muted-foreground",
                    )}
                  >
                    Actions
                  </button>
                  <button
                    type="button"
                    onClick={() => setSkinTab("skin")}
                    className={cn(
                      "flex-1 rounded px-2 py-1 text-[0.65rem] font-medium",
                      skinTab === "skin" ? "bg-background shadow-sm" : "text-muted-foreground",
                    )}
                    data-testid="proof-desk-skin-tab"
                  >
                    On skin
                  </button>
                </div>
              ) : null}

              {skinPreviewEnabled && skinTab === "skin" ? (
                <DesignProofSkinPreview
                  imageUrl={selected.imageUrl}
                  compact
                  defaultZone={inferProofPlacementZone(selected.note)}
                />
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 w-full text-[0.68rem]"
                    onClick={() => setEditOpen(true)}
                  >
                    <Pencil className="h-3 w-3 mr-1" />
                    Replace artwork
                  </Button>

                  {showGuestPanel ? (
                    <div className="rounded-md border border-primary/20 bg-primary/5 p-2.5 space-y-2">
                      <p className="text-[0.65rem] font-medium">Guest link</p>
                      <p className="text-[0.6rem] text-muted-foreground break-all font-mono leading-relaxed">
                        {guestUrl}
                      </p>
                      <div className="flex gap-1.5">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-7 flex-1 text-[0.68rem]"
                          onClick={() => onCopyGuestLink(selected.guestToken!)}
                          data-testid={`copy-guest-proof-link-${selected.id}`}
                        >
                          <Link2 className="h-3 w-3 mr-1" />
                          Copy client link
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-[0.68rem]" asChild>
                          <a href={guestUrl!} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  ) : null}

                  <div className="flex flex-wrap gap-1.5">
                    {selected.status === "draft" ? (
                      <Button
                        size="sm"
                        className="h-7 text-[0.68rem]"
                        onClick={() => onSetStatus(selected.id, "pending_review")}
                      >
                        Send to client
                      </Button>
                    ) : null}
                    {(selected.status === "draft" || selected.status === "rejected") && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[0.68rem]"
                          onClick={() => setApproveOpen(true)}
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Signed off in studio
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-[0.68rem]"
                          onClick={() => onSetStatus(selected.id, "rejected")}
                        >
                          <MessageSquareWarning className="h-3 w-3 mr-1" />
                          Request changes
                        </Button>
                      </>
                    )}
                  </div>

                  {selected.status === "pending_review" ? (
                    <p className="text-[0.62rem] text-muted-foreground leading-relaxed">
                      Awaiting client on their guest link — replace artwork after they request changes, or use
                      in-person sign-off only when they are with you in studio.
                    </p>
                  ) : null}
                </>
              )}
            </div>
          ) : (
            <div
              className="rounded-lg border border-dashed border-border/80 bg-muted/20 p-4 space-y-1.5"
              data-testid="design-proof-selection-empty"
            >
              <p className="text-[0.75rem] font-medium text-foreground">Client response</p>
              <p className="text-[0.65rem] text-muted-foreground leading-relaxed">
                Select a proof card on the left. Client remarks, guest link, and replace artwork actions show here.
              </p>
            </div>
          )}

        </aside>
      </div>

      {selected ? (
        <>
          <DesignProofApproveDialog
            open={approveOpen}
            onOpenChange={setApproveOpen}
            proofKind={proofKind}
            customerName={selected.customerName}
            title={proofTitle(selected.note)}
            onConfirm={(publishRight) => {
              setApproveOpen(false);
              onSetStatus(selected.id, "approved", publishRight);
            }}
          />
          <DesignProofEditDialog
            open={editOpen}
            onOpenChange={setEditOpen}
            businessId={businessId}
            proofTitle={proofTitle(selected.note)}
            currentNote={selected.note}
            currentImageUrl={selected.imageUrl}
            version={selected.version ?? 1}
            onSave={async (payload) => {
              await onPatchProof(selected.id, payload);
            }}
          />
        </>
      ) : null}
    </>
  );
}
