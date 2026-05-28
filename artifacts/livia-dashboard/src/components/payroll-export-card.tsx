import { useState } from "react";
import { useBusiness } from "@/lib/business-context";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api-fetch";
import { downloadAuthenticatedBlob } from "@/lib/download-blob";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, AlertTriangle } from "lucide-react";

function defaultRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 14);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

export function PayrollExportCard() {
  const { business } = useBusiness();
  const { toast } = useToast();
  const bid = business?.id ?? "";
  const [range, setRange] = useState(defaultRange);
  const [issues, setIssues] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  async function runPreflight() {
    if (!bid) return;
    try {
      const r = await apiFetch<{ ok: boolean; issues: { message: string }[] }>(
        `/businesses/${bid}/payroll/preflight?from=${range.from}&to=${range.to}`,
      );
      setIssues(r.ok ? [] : r.issues.map((i) => i.message));
    } catch {
      setIssues(["Could not run pre-flight check"]);
    }
  }

  async function downloadCsv() {
    if (!bid) return;
    setBusy(true);
    try {
      await downloadAuthenticatedBlob(
        `/businesses/${bid}/payroll/export.csv?from=${range.from}&to=${range.to}&format=ie`,
        `livia-payroll-${range.from}-${range.to}.csv`,
      );
      toast({ title: "Payroll CSV downloaded" });
    } catch (e) {
      toast({
        title: "Export failed",
        description: e instanceof Error ? e.message : undefined,
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  if (!bid) return null;

  return (
    <Card data-testid="payroll-export-card">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Download className="h-4 w-4" />
          Payroll hours export
        </CardTitle>
        <CardDescription>
          Rota shifts + completed bookings → CSV for BrightPay / Xero handoff. No tax calc in Livia.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="payroll-from">From</Label>
            <Input
              id="payroll-from"
              type="date"
              value={range.from}
              onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="payroll-to">To</Label>
            <Input
              id="payroll-to"
              type="date"
              value={range.to}
              onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
            />
          </div>
        </div>
        {issues.length > 0 ? (
          <div className="text-sm text-amber-700 dark:text-amber-400 flex gap-2 items-start border border-amber-500/30 rounded-md p-3">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <ul className="list-disc pl-4 space-y-1">
              {issues.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </div>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => void runPreflight()}>
            Pre-flight check
          </Button>
          <Button type="button" size="sm" disabled={busy} onClick={() => void downloadCsv()}>
            {busy ? "Exporting…" : "Download CSV"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
