import { useEffect, useState } from "react";
import { useSearchAuditLog } from "@workspace/api-client-react";
import { useFormat } from "@/lib/use-format";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";

const IMPERSONATION_ACTION = "human.persona.view";
const PAGE_SIZE = 40;

type AuditRow = {
  id: string;
  occurredAt: string;
  actorKind: string;
  actionClass: string;
  resourceKind: string;
  resourceId?: string | null;
  actorId: string;
  onBehalfOfId?: string | null;
  payload?: Record<string, unknown>;
};

type Props = {
  businessId: string;
  embedded?: boolean;
};

/** Tamper-evident activity log — embedded in Settings or standalone /audit. */
export function AuditLogPanel({ businessId, embedded }: Props) {
  const { formatDateTime } = useFormat();
  const [q, setQ] = useState("");
  const [submittedQ, setSubmittedQ] = useState("");
  const [offset, setOffset] = useState(0);
  const [accumulated, setAccumulated] = useState<AuditRow[]>([]);

  const { data, isLoading, isFetching } = useSearchAuditLog(
    businessId,
    { q: submittedQ.trim() || undefined, limit: PAGE_SIZE, offset },
    { query: { enabled: !!businessId, staleTime: 15_000 } as never },
  );

  const total = data?.total ?? 0;

  useEffect(() => {
    if (!data) return;
    const rows = (data.data ?? []) as AuditRow[];
    if (offset === 0) setAccumulated(rows);
    else {
      setAccumulated((prev) => {
        const ids = new Set(prev.map((r) => r.id));
        return [...prev, ...rows.filter((r) => !ids.has(r.id))];
      });
    }
  }, [data, offset]);

  function runSearch() {
    setSubmittedQ(q);
    setOffset(0);
    setAccumulated([]);
  }

  const hasMore = accumulated.length < total;

  return (
    <div className="space-y-4" data-testid={embedded ? "settings-audit-panel" : "audit-page"}>
      {!embedded ? null : (
        <div className="rounded-lg border border-border/80 bg-muted/20 px-4 py-3 text-sm text-muted-foreground space-y-2">
          <p className="font-medium text-foreground">What is this?</p>
          <p>
            A read-only trail of who changed bookings, policies, team access, and Liv settings. Use
            it for disputes, GDPR requests, or &quot;who cancelled this?&quot; — search by action
            name or resource id.
          </p>
          <p className="text-xs">
            Example: search <code className="bg-muted px-1 rounded">human.conversation.resolve</code>{" "}
            after refund cases, or <code className="bg-muted px-1 rounded">{IMPERSONATION_ACTION}</code>{" "}
            for view-as-staff events.
          </p>
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Search activity</CardTitle>
          <CardDescription>Matches action, resource, actor, and payload text.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              runSearch();
            }}
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden />
              <Input
                className="pl-9"
                placeholder="Search audit entries…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                data-testid="audit-search-input"
              />
            </div>
            <Button type="submit" disabled={!businessId || isFetching}>
              Search
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            {isLoading && offset === 0 ? "Loading…" : `${total} entr${total === 1 ? "y" : "ies"}`}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading && offset === 0 ? (
            <div className="p-4 space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : accumulated.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No entries yet — activity appears as your team works.</p>
          ) : (
            <ul className="divide-y divide-border max-h-[min(50vh,480px)] overflow-y-auto">
              {accumulated.map((row) => (
                <li key={row.id} className="px-4 py-3 hover:bg-muted/40" data-testid={`audit-row-${row.id}`}>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-xs text-muted-foreground font-mono">{formatDateTime(row.occurredAt)}</span>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {row.actionClass}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {row.resourceKind}
                    {row.resourceId ? ` · ${row.resourceId.slice(0, 12)}…` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {hasMore ? (
        <Button
          variant="outline"
          className="w-full"
          disabled={isFetching}
          onClick={() => setOffset((o) => o + PAGE_SIZE)}
        >
          {isFetching ? "Loading…" : "Load more"}
        </Button>
      ) : null}
    </div>
  );
}
