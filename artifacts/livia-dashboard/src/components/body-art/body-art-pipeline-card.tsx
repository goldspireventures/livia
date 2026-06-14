import { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import { useBusiness } from "@/lib/business-context";
import { apiFetch } from "@/lib/api-fetch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Paintbrush } from "lucide-react";

type PipelineRow = {
  bookingId: string;
  customerId: string;
  customerName: string;
  serviceName: string;
  startAt: string;
  stage: "consult" | "proof" | "session" | "complete";
  proofStatus: string | null;
};

export function BodyArtPipelineCard() {
  const { business } = useBusiness();
  const bid = business?.id ?? "";
  const vertical = (business as { vertical?: string } | null)?.vertical;
  const [rows, setRows] = useState<PipelineRow[]>([]);
  const [consultCount, setConsultCount] = useState(0);
  const [proofPendingCount, setProofPendingCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    if (!bid || vertical !== "body-art") return;
    setLoading(true);
    apiFetch<{
      consultCount: number;
      proofPendingCount: number;
      rows: PipelineRow[];
    }>(`/businesses/${bid}/body-art/pipeline`)
      .then((d) => {
        setConsultCount(d.consultCount ?? 0);
        setProofPendingCount(d.proofPendingCount ?? 0);
        setRows((d.rows ?? []).filter((r) => r.stage !== "complete").slice(0, 8));
      })
      .catch(() => {
        setConsultCount(0);
        setProofPendingCount(0);
        setRows([]);
      })
      .finally(() => setLoading(false));
  }, [bid, vertical]);

  useEffect(() => {
    load();
  }, [load]);

  if (vertical !== "body-art" || !bid) return null;

  const stageLabel: Record<PipelineRow["stage"], string> = {
    consult: "Consult",
    proof: "Proof review",
    session: "Session ready",
    complete: "Done",
  };

  return (
    <Card data-testid="body-art-pipeline-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Paintbrush className="h-4 w-4 text-primary" aria-hidden />
          Consult → proof → session
        </CardTitle>
        <CardDescription>
          {loading
            ? "Loading pipeline…"
            : `${consultCount} consult${consultCount === 1 ? "" : "s"} · ${proofPendingCount} proof${proofPendingCount === 1 ? "" : "s"} pending`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Pipeline clear — no active consults or proofs.</p>
        ) : (
          <ul className="space-y-2">
            {rows.map((row) => (
              <li
                key={row.customerId}
                className="rounded-lg border border-border/70 px-3 py-2 text-sm flex justify-between gap-2"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">{row.customerName}</p>
                  <p className="text-xs text-muted-foreground truncate">{row.serviceName}</p>
                </div>
                <span className="text-[10px] uppercase tracking-wide shrink-0 text-primary">
                  {stageLabel[row.stage]}
                </span>
              </li>
            ))}
          </ul>
        )}
        <div className="flex gap-2 pt-1">
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <Link href="/design-proofs">Proof desk</Link>
          </Button>
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <Link href="/bookings">Calendar</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
