import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-fetch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type MemoryRow = {
  id: string;
  kind: string;
  content: string;
  createdBy: string;
  createdAt: string;
};

export function LivMemoryPanel({
  businessId,
  customerId,
  canEdit,
}: {
  businessId: string;
  customerId: string;
  canEdit: boolean;
}) {
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

  async function save() {
    const content = draft.trim();
    if (!content) return;
    try {
      await apiFetch(`/businesses/${businessId}/customers/${customerId}/liv-memory`, {
        method: "POST",
        body: JSON.stringify({ content, kind: "note" }),
      });
      setDraft("");
      await qc.invalidateQueries({ queryKey: ["liv-memory", businessId, customerId] });
      toast({ title: "Liv will remember this for future threads" });
    } catch {
      toast({ title: "Could not save memory", variant: "destructive" });
    }
  }

  return (
    <Card data-testid="liv-memory-panel">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Liv memory
        </CardTitle>
        <CardDescription>
          Notes Liv uses in inbox and booking conversations — per client, never shared across shops.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No memory yet — add what Liv should remember.</p>
        ) : (
          <ul className="space-y-2">
            {rows.map((r) => (
              <li key={r.id} className="text-sm border rounded-md px-3 py-2">
                <span className="text-[10px] font-mono uppercase text-muted-foreground">{r.kind}</span>
                <p className="mt-1">{r.content}</p>
              </li>
            ))}
          </ul>
        )}
        {canEdit ? (
          <>
            <Textarea
              placeholder="e.g. Prefers Lara for colour · patch test due every 6 months"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={2}
              className="text-sm"
            />
            <Button size="sm" onClick={() => void save()} disabled={!draft.trim()}>
              Add memory
            </Button>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
