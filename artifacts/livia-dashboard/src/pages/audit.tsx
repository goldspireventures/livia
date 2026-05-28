import { useEffect, useState } from "react";
import { useSearchAuditLog } from "@workspace/api-client-react";
import { useBusiness } from "@/lib/business-context";
import { useFormat } from "@/lib/use-format";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, Search } from "lucide-react";

const IMPERSONATION_ACTION = "human.persona.view";
const PAGE_SIZE = 50;

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

export default function AuditPage() {
  const { business } = useBusiness();
  const { formatDateTime } = useFormat();
  const businessId = business?.id ?? "";

  const [q, setQ] = useState("");
  const [submittedQ, setSubmittedQ] = useState("");
  const [actionClass, setActionClass] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [offset, setOffset] = useState(0);
  const [accumulated, setAccumulated] = useState<AuditRow[]>([]);

  const { data, isLoading, isFetching } = useSearchAuditLog(
    businessId,
    {
      q: submittedQ.trim() || undefined,
      actionClass: actionClass.trim() || undefined,
      from: fromDate ? new Date(fromDate).toISOString() : undefined,
      to: toDate ? new Date(`${toDate}T23:59:59`).toISOString() : undefined,
      limit: PAGE_SIZE,
      offset,
    },
    {
      query: {
        enabled: !!businessId,
        staleTime: 15_000,
      } as never,
    },
  );

  const pageRows = (data?.data ?? []) as AuditRow[];
  const total = data?.total ?? 0;

  useEffect(() => {
    if (!data) return;
    const rows = (data.data ?? []) as AuditRow[];
    if (offset === 0) {
      setAccumulated(rows);
    } else {
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

  function clearSearch() {
    setQ("");
    setSubmittedQ("");
    setActionClass("");
    setFromDate("");
    setToDate("");
    setOffset(0);
    setAccumulated([]);
  }

  const hasMore = accumulated.length < total;

  return (
    <div className="space-y-6" data-testid="audit-page">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          Audit log
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Hash-chained activity. Tip: search{" "}
          <code className="text-xs bg-muted px-1 rounded">{IMPERSONATION_ACTION}</code> for
          view-as events.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Search</CardTitle>
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
              <label htmlFor="audit-search-q" className="sr-only">
                Search audit entries
              </label>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden />
              <Input
                id="audit-search-q"
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
            {submittedQ || actionClass || fromDate || toDate ? (
              <Button type="button" variant="outline" onClick={clearSearch}>
                Clear
              </Button>
            ) : null}
          </form>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <label htmlFor="audit-filter-action" className="text-xs text-muted-foreground">
                Action class
              </label>
              <Input
                id="audit-filter-action"
                placeholder="e.g. human.booking.create"
                value={actionClass}
                onChange={(e) => setActionClass(e.target.value)}
                data-testid="audit-filter-action"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="audit-filter-from" className="text-xs text-muted-foreground">
                From
              </label>
              <Input
                id="audit-filter-from"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                data-testid="audit-filter-from"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="audit-filter-to" className="text-xs text-muted-foreground">
                To
              </label>
              <Input
                id="audit-filter-to"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                data-testid="audit-filter-to"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            {isLoading && offset === 0
              ? "Loading…"
              : `${total} entr${total === 1 ? "y" : "ies"}`}
            {accumulated.length < total ? ` · showing ${accumulated.length}` : ""}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading && offset === 0 ? (
            <div className="p-4 space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : accumulated.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No audit entries match your search.</p>
          ) : (
            <ul className="divide-y divide-border" data-testid="audit-results">
              {accumulated.map((row) => (
                <li
                  key={row.id}
                  className="px-4 py-3 hover:bg-muted/40 transition-colors"
                  data-testid={`audit-row-${row.id}`}
                >
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-xs text-muted-foreground font-mono">
                      {formatDateTime(row.occurredAt)}
                    </span>
                    <Badge variant="outline" className="text-[10px]">
                      {row.actorKind}
                    </Badge>
                    <Badge
                      variant={
                        row.actionClass === IMPERSONATION_ACTION ? "default" : "secondary"
                      }
                      className="text-[10px] font-mono"
                    >
                      {row.actionClass}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {row.resourceKind}
                      {row.resourceId ? ` · ${row.resourceId}` : ""}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Actor: <span className="font-mono">{row.actorId}</span>
                    {row.onBehalfOfId ? (
                      <>
                        {" "}
                        · on behalf of <span className="font-mono">{row.onBehalfOfId}</span>
                      </>
                    ) : null}
                  </p>
                  {Object.keys(row.payload ?? {}).length > 0 ? (
                    <pre className="mt-2 text-[10px] bg-muted/50 rounded p-2 overflow-x-auto max-h-24">
                      {JSON.stringify(row.payload, null, 2)}
                    </pre>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {hasMore ? (
        <div className="flex justify-center">
          <Button
            variant="outline"
            disabled={isFetching}
            onClick={() => setOffset((o) => o + PAGE_SIZE)}
            data-testid="audit-load-more"
          >
            {isFetching ? "Loading…" : "Load more"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
