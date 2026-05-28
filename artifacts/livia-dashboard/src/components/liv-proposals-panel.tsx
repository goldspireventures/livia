import { useQuery, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";
import { Bot, Check, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useBusiness } from "@/lib/business-context";
import { useToast } from "@/hooks/use-toast";
import { invalidateOperationalState, OPERATIONAL_REFETCH_MS } from "@/lib/operational-cache";

type Proposal = {
  id: string;
  action: string;
  outcomePreview: string | null;
  reason: string | null;
  valueMinor?: number;
  metadata?: { customerName?: string; bookingId?: string } | null;
  createdAt: string;
};

export function LivProposalsPanel() {
  const { business } = useBusiness();
  const bid = business?.id ?? "";
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["liv-proposals", bid],
    queryFn: () => customFetch<{ data: Proposal[] }>(`/api/businesses/${bid}/liv-proposals`),
    enabled: !!bid,
    refetchInterval: OPERATIONAL_REFETCH_MS,
  });

  const rows = data?.data ?? [];
  if (!isLoading && rows.length === 0) return null;

  const resolve = async (proposalId: string, status: "approved" | "dismissed") => {
    try {
      const result = await customFetch<{ execution?: { effects?: string[] } }>(
        `/api/businesses/${bid}/liv-proposals/${proposalId}/resolve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        },
      );
      const effects = result.execution?.effects?.join(" · ");
      toast({
        title: status === "approved" ? "Approved — changes applied" : "Dismissed",
        description: effects,
      });
      invalidateOperationalState(qc, bid);
      void refetch();
    } catch (e) {
      toast({
        title: "Could not update proposal",
        description: e instanceof Error ? e.message : undefined,
        variant: "destructive",
      });
    }
  };

  return (
    <Card
      data-testid="liv-proposals-panel"
      className="relative overflow-hidden border-violet-500/40 bg-gradient-to-br from-violet-500/8 via-card to-cyan-500/5 shadow-[0_12px_40px_-16px_rgba(139,92,246,0.45)]"
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Bot className="h-4 w-4 text-violet-500" />
          Liv proposals
        </CardTitle>
        <CardDescription>
          Actions Liv wants to take inside your mandate — approve or dismiss.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? <Skeleton className="h-16 w-full" /> : null}
        {rows.map((p) => (
          <div
            key={p.id}
            className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="space-y-1 min-w-0">
              <p className="text-sm font-medium">
                {p.outcomePreview ?? p.action.replace(/_/g, " ")}
              </p>
              {p.reason ? (
                <p className="text-xs text-muted-foreground">{p.reason}</p>
              ) : null}
              {p.valueMinor && p.valueMinor > 0 ? (
                <p className="text-xs font-mono text-muted-foreground">
                  €{(p.valueMinor / 100).toFixed(0)}
                  {p.metadata?.customerName ? ` · ${p.metadata.customerName}` : ""}
                </p>
              ) : null}
              <Badge variant="secondary" className="text-[10px]">
                {p.action}
              </Badge>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void resolve(p.id, "dismissed")}
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Dismiss
              </Button>
              <Button type="button" size="sm" onClick={() => void resolve(p.id, "approved")}>
                <Check className="h-3.5 w-3.5 mr-1" />
                Approve
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
