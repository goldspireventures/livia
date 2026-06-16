import { useState } from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-fetch";
import { useBusiness } from "@/lib/business-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { PolicyEvolutionProposal } from "@workspace/policy";
import { Wand2 } from "lucide-react";

export function PolicyEvolutionPanel({
  proposals,
  className,
}: {
  proposals?: PolicyEvolutionProposal[];
  className?: string;
}) {
  const { business } = useBusiness();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [busyId, setBusyId] = useState<string | null>(null);
  const bid = business?.id ?? "";

  if (!proposals?.length) return null;

  const visible = proposals.filter((p) => p.id !== "emergent_trust_tier");
  if (!visible.length) return null;

  async function accept(proposal: PolicyEvolutionProposal) {
    if (!bid) return;
    if (proposal.id === "retail_attach_program" && proposal.href) {
      window.location.href = proposal.href;
      return;
    }
    setBusyId(proposal.id);
    try {
      const r = await apiFetch<{ ok: boolean; reason?: string }>(
        `/api/businesses/${bid}/policy-evolution/${proposal.id}/accept`,
        { method: "POST" },
      );
      if (!r.ok) {
        toast({
          title: "Could not apply",
          description: r.reason ?? "Try again from settings.",
          variant: "destructive",
        });
        return;
      }
      toast({ title: "Applied", description: proposal.title });
      void qc.invalidateQueries({ queryKey: ["owner-intelligence", bid] });
      void qc.invalidateQueries({ queryKey: ["/api/businesses", bid, "owner-intelligence"] });
    } catch {
      toast({ title: "Could not apply", variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className={className} data-testid="policy-evolution-panel">
      <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-2">
        <Wand2 className="h-3.5 w-3.5" />
        Suggested policy updates
      </p>
      <ul className="space-y-2">
        {visible.slice(0, 3).map((p) => (
          <li
            key={p.id}
            className="rounded-lg border border-primary/15 bg-primary/5 p-3 text-sm space-y-2"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{p.title}</span>
              <Badge variant="outline" className="text-[10px]">
                {p.confidence}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{p.body}</p>
            <p className="text-[11px] text-muted-foreground">{p.projectedBenefit}</p>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                className="h-8"
                disabled={busyId === p.id}
                onClick={() => void accept(p)}
              >
                {busyId === p.id ? "Applying…" : p.acceptLabel}
              </Button>
              {p.href ? (
                <Button size="sm" variant="ghost" className="h-8" asChild>
                  <Link href={p.href}>Review</Link>
                </Button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
