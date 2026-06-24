import { useState } from "react";
import { Button } from "@/components/ui/button";
import { customFetch } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";

type Diff = {
  external: string;
  liviaCount: number;
  externalCount: number;
  onlyInLivia: string[];
  onlyInExternal: string[];
  note?: string;
};

type Props = {
  businessId: string;
};

export function ParallelRunPanel({ businessId }: Props) {
  const [diff, setDiff] = useState<Diff | null>(null);
  const [busy, setBusy] = useState(false);

  async function load(external: "mindbody" | "fresha") {
    setBusy(true);
    try {
      const row = await customFetch<Diff>(
        `/api/businesses/${businessId}/migration/parallel-run?external=${external}`,
      );
      setDiff(row);
    } catch {
      setDiff(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-border/70 bg-muted/10 p-3" data-testid="parallel-run-panel">
      <p className="text-sm font-medium">Parallel-run diff</p>
      <p className="text-xs text-muted-foreground">
        Compare Livia bookings against your previous scheduler while you cut over. Spreadsheet import works today — direct connect is rolling out.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" disabled={busy} onClick={() => void load("mindbody")}>
          Compare fitness bookings
        </Button>
        <Button size="sm" variant="outline" disabled={busy} onClick={() => void load("fresha")}>
          Compare salon bookings
        </Button>
      </div>
      {diff ? (
        <div className="text-xs space-y-2 border-t border-border/60 pt-2">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Livia {diff.liviaCount}</Badge>
            <Badge variant="outline">External {diff.externalCount}</Badge>
          </div>
          {diff.note ? <p className="text-muted-foreground">{diff.note}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
