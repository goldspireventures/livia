import { useCallback, useState } from "react";
import { FileUp, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { customFetch } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { invalidateOperationalState } from "@/lib/operational-cache";
import type { ImportEntityKind } from "@workspace/policy";

type ImportResult = {
  kind: string;
  kindLabel: string;
  imported: number;
  skipped: number;
  errors?: string[];
  detectedHeaders?: string[];
  onboarding?: { actsCompleted?: string[]; checklistUpdates?: Record<string, boolean> };
};

type PreviewResult = {
  detectedKind: ImportEntityKind | null;
  kindLabel: string | null;
  confidence: number;
  rowCount: number;
  headers: string[];
};

const KIND_OPTIONS: { value: ImportEntityKind | "auto"; label: string }[] = [
  { value: "auto", label: "Auto-detect" },
  { value: "clients", label: "Client list" },
  { value: "services", label: "Service menu" },
  { value: "appointments", label: "Upcoming appointments" },
  { value: "staff", label: "Team roster" },
];

type Props = {
  businessId: string;
  compact?: boolean;
  onImported?: (result: ImportResult) => void;
};

export function UniversalImportPanel({ businessId, compact = false, onImported }: Props) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [csv, setCsv] = useState("");
  const [kind, setKind] = useState<ImportEntityKind | "auto">("auto");
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [busy, setBusy] = useState(false);

  const runPreview = useCallback(async () => {
    if (!csv.trim()) return;
    setBusy(true);
    try {
      const res = await customFetch<PreviewResult>(
        `/api/businesses/${businessId}/import/preview`,
        { method: "POST", body: JSON.stringify({ csv }) },
      );
      setPreview(res);
      if (res.detectedKind && kind === "auto") {
        toast({
          title: `Detected: ${res.kindLabel ?? res.detectedKind}`,
          description: `${res.rowCount} rows ready to import`,
        });
      }
    } catch {
      toast({ title: "Could not preview CSV", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }, [businessId, csv, kind, toast]);

  async function runImport() {
    if (!csv.trim()) return;
    setBusy(true);
    try {
      const res = await customFetch<ImportResult>(`/api/businesses/${businessId}/import/csv`, {
        method: "POST",
        body: JSON.stringify({
          csv,
          kind: kind === "auto" ? undefined : kind,
          applyOnboarding: true,
        }),
      });
      setResult(res);
      invalidateOperationalState(qc, businessId);
      toast({
        title: `Imported ${res.imported} ${res.kindLabel.toLowerCase()}`,
        description:
          res.onboarding?.actsCompleted?.length
            ? `Liv marked ${res.onboarding.actsCompleted.length} setup step(s) done`
            : undefined,
      });
      onImported?.(res);
    } catch {
      toast({ title: "Import failed", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      id="universal-import-panel"
      className="space-y-4"
      data-testid="universal-import-panel"
    >
      {!compact ? (
        <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
          <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <p className="text-sm text-muted-foreground leading-relaxed">
            Paste a CSV export from your previous booking tool. Liv detects columns, imports your
            data, and checks off setup steps automatically — no manual re-entry.
          </p>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <div className="space-y-2">
          <Label htmlFor="import-kind">Import type</Label>
          <Select value={kind} onValueChange={(v) => setKind(v as ImportEntityKind | "auto")}>
            <SelectTrigger id="import-kind" data-testid="import-kind-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {KIND_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="import-csv">CSV data</Label>
        <Textarea
          id="import-csv"
          data-testid="import-csv-input"
          rows={compact ? 6 : 10}
          placeholder="Paste CSV here — include the header row from your export"
          value={csv}
          onChange={(e) => {
            setCsv(e.target.value);
            setPreview(null);
            setResult(null);
          }}
        />
      </div>

      {preview ? (
        <div className="text-xs text-muted-foreground space-y-1 rounded-md border p-2">
          <div className="flex flex-wrap gap-2 items-center">
            {preview.kindLabel ? (
              <Badge variant="secondary">{preview.kindLabel}</Badge>
            ) : null}
            <span>{preview.rowCount} rows</span>
            <span>{Math.round(preview.confidence * 100)}% column match</span>
          </div>
          {preview.headers.length > 0 ? (
            <p className="truncate">Columns: {preview.headers.join(", ")}</p>
          ) : null}
        </div>
      ) : null}

      {result ? (
        <div className="text-sm rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3 space-y-1">
          <p>
            <strong>{result.imported}</strong> imported · {result.skipped} skipped
          </p>
          {result.errors && result.errors.length > 0 ? (
            <ul className="text-xs text-amber-700 dark:text-amber-300 list-disc pl-4">
              {result.errors.slice(0, 5).map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy || !csv.trim()}
          onClick={() => void runPreview()}
          data-testid="import-preview-btn"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
          Preview
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={busy || !csv.trim()}
          onClick={() => void runImport()}
          data-testid="import-run-btn"
        >
          <FileUp className="h-4 w-4 mr-1" />
          Import & set up
        </Button>
      </div>
    </div>
  );
}
