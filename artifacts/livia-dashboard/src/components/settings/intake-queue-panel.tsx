import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SettingsDisclosure } from "@/components/ui/settings-disclosure";
import { customFetch } from "@workspace/api-client-react";
import { Loader2 } from "lucide-react";

type IntakeRow = {
  id: string;
  status: string;
  customerId: string;
  bookingId: string | null;
  submittedAt: string | null;
};

type Props = {
  businessId: string;
  vertical?: string | null;
};

export function IntakeQueuePanel({ businessId, vertical }: Props) {
  const [title, setTitle] = useState("Pre-visit intake");
  const [prompt, setPrompt] = useState("");
  const [rows, setRows] = useState<IntakeRow[]>([]);
  const [busy, setBusy] = useState(false);

  const intakeVerticals = ["beauty", "body-art", "medspa", "allied-health"];
  if (vertical && !intakeVerticals.includes(vertical)) return null;

  async function load() {
    setBusy(true);
    try {
      const [config, queue] = await Promise.all([
        customFetch<{ title: string; prompt: string }>(
          `/api/businesses/${businessId}/intakes/config`,
        ),
        customFetch<{ data: IntakeRow[] }>(
          `/api/businesses/${businessId}/intakes/review-queue`,
        ),
      ]);
      setTitle(config.title);
      setPrompt(config.prompt);
      setRows(queue.data ?? []);
    } catch {
      setRows([]);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!businessId) return;
    void load();
  }, [businessId]);

  async function markReviewed(intakeId: string) {
    await customFetch(`/api/businesses/${businessId}/intakes/${intakeId}/reviewed`, {
      method: "PATCH",
    });
    await load();
  }

  return (
    <SettingsDisclosure
      title={title}
      description={
        rows.length > 0
          ? `${rows.length} awaiting review — Liv sends intake links on book`
          : prompt || "Intake links go out automatically when guests book"
      }
      defaultOpen={rows.length > 0}
      data-testid="intake-queue-panel"
    >
      <div className="space-y-3 pt-1">
        {busy && rows.length === 0 ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : null}
        {rows.length === 0 && !busy ? (
          <p className="text-sm text-muted-foreground">No intakes waiting — you are caught up.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {rows.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/60 px-3 py-2"
              >
                <span className="text-muted-foreground">
                  Submitted {row.submittedAt ? new Date(row.submittedAt).toLocaleString() : "—"}
                </span>
                <Button type="button" size="sm" variant="outline" onClick={() => void markReviewed(row.id)}>
                  Mark reviewed
                </Button>
              </li>
            ))}
          </ul>
        )}
        {rows.length > 0 ? (
          <Badge variant="secondary">{rows.length} in queue</Badge>
        ) : null}
      </div>
    </SettingsDisclosure>
  );
}
