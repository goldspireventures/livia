import { useCallback, useRef, useState } from "react";
import { FileUp, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { customFetch } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { invalidateOperationalState } from "@/lib/operational-cache";
import type { ImportEntityKind } from "@workspace/policy";

type StagedFile = {
  id: string;
  name: string;
  kind: ImportEntityKind | "unknown";
  text: string;
};

type PreviewResponse = {
  detectedKind: ImportEntityKind | null;
  kindLabel: string | null;
};

type MagicResult = {
  results: Array<{ kind: string; imported: number; skipped: number }>;
};

const KIND_LABELS: Record<ImportEntityKind, string> = {
  clients: "Clients",
  services: "Service menu",
  staff: "Team",
  appointments: "Bookings",
};

type Props = {
  businessId: string;
  onImported?: (totalImported: number) => void;
};

async function readFileText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

export function MigrationFileImportPanel({ businessId, onImported }: Props) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<StagedFile[]>([]);
  const [busy, setBusy] = useState(false);

  const stageFiles = useCallback(
    async (list: FileList | File[]) => {
      const next: StagedFile[] = [];
      for (const file of Array.from(list)) {
        const text = await readFileText(file);
        if (!text.trim()) continue;
        let kind: ImportEntityKind | "unknown" = "unknown";
        try {
          const preview = await customFetch<PreviewResponse>(
            `/api/businesses/${businessId}/import/preview`,
            { method: "POST", body: JSON.stringify({ csv: text }) },
          );
          kind = preview.detectedKind ?? "unknown";
        } catch {
          kind = "unknown";
        }
        next.push({
          id: `${file.name}-${Date.now()}`,
          name: file.name,
          kind,
          text,
        });
      }
      setFiles((prev) => [...prev, ...next]);
    },
    [businessId],
  );

  const removeFile = (id: string) => setFiles((prev) => prev.filter((f) => f.id !== id));

  const runImport = async () => {
    if (!files.length) return;
    setBusy(true);
    const bundles: Record<string, string> = {};
    for (const f of files) {
      if (f.kind === "clients") bundles.clientsCsv = f.text;
      else if (f.kind === "services") bundles.servicesCsv = f.text;
      else if (f.kind === "staff") bundles.staffCsv = f.text;
      else if (f.kind === "appointments") bundles.appointmentsCsv = f.text;
      else {
        bundles.clientsCsv = bundles.clientsCsv ?? f.text;
      }
    }
    try {
      const res = await customFetch<MagicResult>(
        `/api/businesses/${businessId}/import/magic-setup`,
        { method: "POST", body: JSON.stringify(bundles) },
      );
      invalidateOperationalState(qc, businessId);
      const total = res.results.reduce((n, r) => n + r.imported, 0);
      toast({
        title: total > 0 ? `Imported ${total} records` : "Import finished",
        description: "Liv applied your files to the shop.",
      });
      onImported?.(total);
      setFiles([]);
    } catch {
      toast({ title: "Upload failed", description: "Check the file format.", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3" data-testid="migration-file-import">
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.txt,.tsv,text/csv,text/plain"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) void stageFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        <FileUp className="h-4 w-4 mr-2" />
        Choose files
      </Button>
      {files.length > 0 ? (
        <ul className="space-y-1.5">
          {files.map((f) => (
            <li
              key={f.id}
              className="flex items-center justify-between gap-2 rounded-md border border-border/70 bg-muted/20 px-2 py-1.5 text-xs"
            >
              <span className="truncate">
                {f.name}
                <span className="text-muted-foreground ml-1">
                  →{" "}
                  {f.kind === "unknown" ? "Auto-detect" : KIND_LABELS[f.kind]}
                </span>
              </span>
              <button type="button" className="text-muted-foreground hover:text-foreground" onClick={() => removeFile(f.id)}>
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[11px] text-muted-foreground">
          CSV or Excel exports — clients, menu, team, bookings. Not copy-paste.
        </p>
      )}
      {files.length > 0 ? (
        <Button type="button" className="w-full" disabled={busy} onClick={() => void runImport()}>
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Applying…
            </>
          ) : (
            "Apply uploads"
          )}
        </Button>
      ) : null}
    </div>
  );
}
