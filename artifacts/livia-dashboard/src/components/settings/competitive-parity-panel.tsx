import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SettingsDisclosure } from "@/components/ui/settings-disclosure";
import { customFetch } from "@workspace/api-client-react";
import { Loader2 } from "lucide-react";

type Gap = {
  capabilityId: string;
  label: string;
  status: "shipped" | "partial" | "planned";
};

type PainPoint = {
  id: string;
  incumbent: string;
  pain: string;
  liviaAnswer: string;
};

type ParityPayload = {
  vertical: string;
  scorePercent: number;
  gaps: Gap[];
  incumbentCategories: string[];
  painPoints?: PainPoint[];
};

type Props = {
  businessId: string;
};

export function CompetitiveParityPanel({ businessId }: Props) {
  const [data, setData] = useState<ParityPayload | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setBusy(true);
    try {
      const row = await customFetch<ParityPayload>(`/api/businesses/${businessId}/competitive-parity`);
      setData(row);
    } catch {
      setData(null);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void load();
  }, [businessId]);

  const shipped = data?.gaps.filter((g) => g.status === "shipped").length ?? 0;
  const total = data?.gaps.length ?? 0;

  return (
    <SettingsDisclosure
      title="How Livia compares"
      description={
        data
          ? `${data.scorePercent}% competitive parity · ${shipped}/${total} capabilities shipped for ${data.vertical}`
          : "Loading parity score for your vertical…"
      }
      defaultOpen={false}
      data-testid="competitive-parity-panel"
    >
      <div className="space-y-3 pt-1">
        {busy && !data ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : null}
        {data ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{data.scorePercent}% parity</Badge>
              {data.incumbentCategories.map((c) => (
                <Badge key={c} variant="outline" className="text-[10px] font-normal">
                  vs {c}
                </Badge>
              ))}
            </div>
            <ul className="space-y-2 text-sm">
              {data.gaps.map((gap) => (
                <li
                  key={gap.capabilityId}
                  className="flex flex-wrap items-start justify-between gap-2 rounded-md border border-border/60 px-3 py-2"
                >
                  <span>{gap.label}</span>
                  <Badge
                    variant="outline"
                    className={
                      gap.status === "shipped"
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                        : gap.status === "partial"
                          ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                          : "text-muted-foreground"
                    }
                  >
                    {gap.status}
                  </Badge>
                </li>
              ))}
            </ul>
            {data.painPoints && data.painPoints.length > 0 ? (
              <div className="space-y-2 pt-2 border-t border-border/60">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Pain points Livia beats incumbents on
                </p>
                <ul className="space-y-2 text-sm">
                  {data.painPoints.map((p) => (
                    <li key={p.id} className="rounded-md bg-muted/40 px-3 py-2">
                      <p className="text-muted-foreground text-xs">{p.pain}</p>
                      <p className="mt-1">{p.liviaAnswer}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Could not load parity score.</p>
        )}
        <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => void load()}>
          Refresh score
        </Button>
      </div>
    </SettingsDisclosure>
  );
}
