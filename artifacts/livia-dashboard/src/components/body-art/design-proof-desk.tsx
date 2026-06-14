import { useMemo, useState } from "react";
import { Link2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { clientGuestTokenHref } from "@/lib/guest-book-url";

export type DesignProofRow = {
  id: string;
  status: string;
  imageUrl?: string | null;
  note?: string | null;
  guestToken?: string | null;
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

const FALLBACK_ART = "/w2-gateway/cards/tattoo.jpg";

export function DesignProofDesk({
  proofs,
  businessSlug,
  onSetStatus,
  onCopyGuestLink,
}: {
  proofs: DesignProofRow[];
  businessSlug?: string;
  onSetStatus: (id: string, status: string) => void;
  onCopyGuestLink: (token: string) => void;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (filter === "all") return proofs;
    return proofs.filter((p) => p.status === filter);
  }, [proofs, filter]);

  const selected = proofs.find((p) => p.id === selectedId) ?? filtered[0] ?? null;

  const counts = useMemo(() => {
    const c: Partial<Record<Filter, number>> = { all: proofs.length };
    for (const p of proofs) {
      const key = p.status as Filter;
      c[key] = (c[key] ?? 0) + 1;
    }
    return c;
  }, [proofs]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_min(18rem,100%)] design-proof-desk preset-operator-surface" data-testid="design-proof-desk">
      <div className="space-y-4 min-w-0">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const n = counts[f];
            if (f !== "all" && !n) return null;
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  filter === f
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/80 hover:border-primary/30",
                )}
              >
                {f === "all" ? "All proofs" : STATUS_LABEL[f] ?? f}
                {n ? <span className="ml-1.5 tabular-nums opacity-70">{n}</span> : null}
              </button>
            );
          })}
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground py-12 text-center rounded-xl border border-dashed border-border/70">
            No proofs in this view — submit artwork below.
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(p.id)}
                  className={cn(
                    "w-full text-left rounded-xl border overflow-hidden transition-shadow",
                    "bg-card hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    selected?.id === p.id && "ring-2 ring-primary/40 border-primary/30",
                  )}
                  data-testid={`design-proof-card-${p.id}`}
                >
                  <div className="aspect-[4/3] bg-muted relative">
                    <img
                      src={p.imageUrl || FALLBACK_ART}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = FALLBACK_ART;
                      }}
                    />
                    <Badge
                      variant={STATUS_VARIANT[p.status] ?? "secondary"}
                      className="absolute top-2 right-2 text-[10px] uppercase tracking-wide"
                    >
                      {STATUS_LABEL[p.status] ?? p.status}
                    </Badge>
                  </div>
                  <div className="p-3 space-y-2">
                    <p className="text-sm font-medium line-clamp-2">
                      {p.note?.trim() || "Untitled design"}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {p.status === "draft" ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-7 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSetStatus(p.id, "pending_review");
                          }}
                        >
                          Send for review
                        </Button>
                      ) : null}
                      {(p.status === "pending_review" || p.status === "draft") && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSetStatus(p.id, "approved");
                            }}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSetStatus(p.id, "rejected");
                            }}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      {p.status === "pending_review" && p.guestToken ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-7 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            onCopyGuestLink(p.guestToken!);
                          }}
                          data-testid={`copy-guest-proof-link-${p.id}`}
                        >
                          <Link2 className="h-3 w-3 mr-1" />
                          Guest link
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <aside className="space-y-3 lg:sticky lg:top-20 lg:self-start">
        <div className="rounded-xl border border-border/80 bg-card p-4 space-y-3">
          <h3 className="text-sm font-semibold">Guest link</h3>
          {selected?.status === "pending_review" && selected.guestToken && businessSlug ? (
            <>
              <p className="text-xs text-muted-foreground break-all font-mono">
                {clientGuestTokenHref(businessSlug, "proof", selected.guestToken)}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => onCopyGuestLink(selected.guestToken!)}
                >
                  <Link2 className="h-3.5 w-3.5 mr-1" />
                  Copy
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <a
                    href={clientGuestTokenHref(businessSlug, "proof", selected.guestToken!)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-3.5 w-3.5 mr-1" />
                    Open
                  </a>
                </Button>
              </div>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              Select a proof awaiting review to copy the client link.
            </p>
          )}
        </div>
        <div className="rounded-xl border border-border/80 bg-card p-4 space-y-2">
          <h3 className="text-sm font-semibold">Pipeline</h3>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>{counts.pending_review ?? 0} awaiting client review</li>
            <li>{counts.approved ?? 0} approved — visible on /b when published</li>
            <li>{counts.draft ?? 0} drafts</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
