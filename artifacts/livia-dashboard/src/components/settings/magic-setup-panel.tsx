import { useCallback, useState } from "react";
import { Sparkles, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { customFetch } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { invalidateOperationalState } from "@/lib/operational-cache";

type MagicResult = {
  results: Array<{
    kind: string;
    kindLabel: string;
    imported: number;
    skipped: number;
    errors?: string[];
  }>;
  onboarding?: { actsCompleted?: string[] };
};

type Props = {
  businessId: string;
  compact?: boolean;
  onImported?: (totalImported: number) => void;
};

export function MagicSetupPanel({ businessId, compact = false, onImported }: Props) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [servicesCsv, setServicesCsv] = useState("");
  const [staffCsv, setStaffCsv] = useState("");
  const [clientsCsv, setClientsCsv] = useState("");
  const [appointmentsCsv, setAppointmentsCsv] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<MagicResult | null>(null);

  const hasAny =
    servicesCsv.trim() ||
    staffCsv.trim() ||
    clientsCsv.trim() ||
    appointmentsCsv.trim();

  const runImport = useCallback(async () => {
    if (!hasAny) return;
    setBusy(true);
    try {
      const res = await customFetch<MagicResult>(
        `/api/businesses/${businessId}/import/magic-setup`,
        {
          method: "POST",
          body: JSON.stringify({
            servicesCsv: servicesCsv.trim() || undefined,
            staffCsv: staffCsv.trim() || undefined,
            clientsCsv: clientsCsv.trim() || undefined,
            appointmentsCsv: appointmentsCsv.trim() || undefined,
          }),
        },
      );
      setResult(res);
      invalidateOperationalState(qc, businessId);
      const total = res.results.reduce((n, r) => n + r.imported, 0);
      toast({
        title: `Applied ${total} records`,
        description:
          res.onboarding?.actsCompleted?.length
            ? `Setup steps completed: ${res.onboarding.actsCompleted.join(", ")}`
            : "Your shop data is in Livia.",
      });
      onImported?.(total);
    } catch {
      toast({ title: "Import failed", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }, [appointmentsCsv, businessId, clientsCsv, hasAny, onImported, qc, servicesCsv, staffCsv, toast]);

  return (
    <div className="space-y-4" data-testid="magic-setup-panel">
      {!compact ? (
        <div className="flex items-start gap-2 rounded-lg border border-violet-500/20 bg-violet-500/5 p-3">
          <Sparkles className="h-4 w-4 text-violet-500 mt-0.5 shrink-0" />
          <p className="text-sm text-muted-foreground leading-relaxed">
            Paste exports in any order — services first, then team, clients, and upcoming
            appointments. Liv applies everything in one go and checks off setup steps.
          </p>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        {(
          [
            ["servicesCsv", "Service menu", servicesCsv, setServicesCsv],
            ["staffCsv", "Team roster", staffCsv, setStaffCsv],
            ["clientsCsv", "Client list", clientsCsv, setClientsCsv],
            ["appointmentsCsv", "Upcoming appointments", appointmentsCsv, setAppointmentsCsv],
          ] as const
        ).map(([id, label, value, setValue]) => (
          <div key={id} className="space-y-1.5">
            <Label htmlFor={id} className="text-xs">
              {label}{" "}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Textarea
              id={id}
              data-testid={`magic-${id}`}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Paste CSV…"
              className="min-h-[72px] font-mono text-[11px]"
            />
          </div>
        ))}
      </div>

      <Button
        type="button"
        disabled={!hasAny || busy}
        onClick={() => void runImport()}
        className="gap-2"
        data-testid="magic-setup-apply"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        Apply to my shop
      </Button>

      {result ? (
        <ul className="space-y-1.5 text-sm">
          {result.results.map((r) => (
            <li key={r.kind} className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              <span>
                {r.kindLabel}: {r.imported} imported
                {r.skipped ? ` · ${r.skipped} skipped` : ""}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
