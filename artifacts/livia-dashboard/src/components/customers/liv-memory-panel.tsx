import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-fetch";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { livMemoryKindOptions, livMemoryPlaceholder, livMemoryCorrectionSavedToast } from "@workspace/policy";
import { SettingsDisclosure } from "@/components/ui/settings-disclosure";

type MemoryRow = {
  id: string;
  kind: string;
  content: string;
  createdBy: string;
  createdAt: string;
};

function createdByLabel(by: string): string {
  if (by === "liv") return "Liv";
  if (by === "owner") return "Owner";
  return "Team";
}

export function LivMemoryPanel({
  businessId,
  customerId,
  canEdit,
  vertical,
  category,
}: {
  businessId: string;
  customerId: string;
  canEdit: boolean;
  vertical?: string | null;
  category?: string | null;
}) {
  const kindOptions = livMemoryKindOptions(vertical, category);
  const [kind, setKind] = useState(kindOptions[0]?.value ?? "note");
  const { toast } = useToast();
  const qc = useQueryClient();
  const [draft, setDraft] = useState("");

  const { data } = useQuery({
    queryKey: ["liv-memory", businessId, customerId],
    queryFn: () =>
      apiFetch<{ data: MemoryRow[] }>(
        `/api/businesses/${businessId}/customers/${customerId}/liv-memory`,
      ),
    enabled: !!businessId && !!customerId,
  });

  const rows = data?.data ?? [];
  const livRows = rows.filter((r) => r.createdBy === "liv");
  const teamRows = rows.filter((r) => r.createdBy !== "liv");

  async function saveCorrection() {
    const content = draft.trim();
    if (!content) return;
    try {
      await apiFetch(`/api/businesses/${businessId}/customers/${customerId}/liv-memory`, {
        method: "POST",
        body: JSON.stringify({ content, kind }),
      });
      setDraft("");
      await qc.invalidateQueries({ queryKey: ["liv-memory", businessId, customerId] });
      toast({ title: livMemoryCorrectionSavedToast() });
    } catch {
      toast({ title: "Could not save memory", variant: "destructive" });
    }
  }

  const summary =
    livRows.length > 0
      ? `${livRows.length} from Liv${teamRows.length ? ` · ${teamRows.length} correction${teamRows.length === 1 ? "" : "s"}` : ""}`
      : "Liv builds this from threads and visits — add a correction if something is wrong";

  return (
    <SettingsDisclosure
      title="Liv memory"
      description={summary}
      defaultOpen={livRows.length > 0}
      data-testid="liv-memory-panel"
    >
      <div className="space-y-3 pt-1">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Liv uses these notes when drafting inbox replies and suggesting slots. You do not need to
          maintain this — correct Liv when it gets something wrong.
        </p>

        {livRows.length > 0 ? (
          <ul className="space-y-2">
            {livRows.map((r) => (
              <li key={r.id} className="text-sm border rounded-md px-3 py-2 bg-primary/5 border-primary/15">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="h-3 w-3 text-primary" />
                  <Badge variant="outline" className="text-[10px] font-normal">
                    {createdByLabel(r.createdBy)}
                  </Badge>
                  <span className="text-[10px] font-mono uppercase text-muted-foreground">{r.kind}</span>
                </div>
                <p>{r.content}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            No Liv memory yet — it will appear after conversations and bookings.
          </p>
        )}

        {teamRows.length > 0 ? (
          <div className="space-y-2">
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Your corrections
            </p>
            <ul className="space-y-2">
              {teamRows.map((r) => (
                <li key={r.id} className="text-sm border rounded-md px-3 py-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary" className="text-[10px] font-normal">
                      {createdByLabel(r.createdBy)}
                    </Badge>
                    <span className="text-[10px] font-mono uppercase text-muted-foreground">{r.kind}</span>
                  </div>
                  <p>{r.content}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {canEdit ? (
          <details className="rounded-lg border border-border/70 bg-muted/20 px-3 py-2">
            <summary className="cursor-pointer text-sm font-medium list-none [&::-webkit-details-marker]:hidden">
              Add correction
            </summary>
            <div className="space-y-2 pt-3">
              <select
                className="w-full text-sm border rounded-md px-2 py-1.5 bg-background"
                value={kind}
                onChange={(e) => setKind(e.target.value)}
                aria-label="Memory kind"
              >
                {kindOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <Textarea
                placeholder={livMemoryPlaceholder(vertical, category)}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={2}
                className="text-sm"
              />
              <Button size="sm" variant="outline" onClick={() => void saveCorrection()} disabled={!draft.trim()}>
                Save correction
              </Button>
            </div>
          </details>
        ) : null}
      </div>
    </SettingsDisclosure>
  );
}
