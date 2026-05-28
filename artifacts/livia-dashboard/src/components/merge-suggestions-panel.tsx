import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useBusiness } from "@/lib/business-context";
import { customFetch } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Link2 } from "lucide-react";

type Suggestion = {
  identityId: string;
  channelType: string;
  externalId: string;
  sourceCustomerId: string;
  sourceCustomerName: string;
  targetCustomerId: string;
  targetCustomerName: string;
  matchReason: string;
};

export function MergeSuggestionsPanel() {
  const { business } = useBusiness();
  const { toast } = useToast();
  const bid = business?.id ?? "";
  const [rows, setRows] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [merging, setMerging] = useState<string | null>(null);

  async function load() {
    if (!bid) return;
    setLoading(true);
    try {
      const res = await customFetch<{ data: Suggestion[] }>(
        `/api/businesses/${bid}/customers/merge-suggestions`,
      );
      setRows(res.data ?? []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [bid]);

  async function mergeOne(s: Suggestion) {
    setMerging(s.identityId);
    try {
      await customFetch(`/api/businesses/${bid}/customers/${s.targetCustomerId}/merge-identity`, {
        method: "POST",
        body: JSON.stringify({ identityId: s.identityId }),
      });
      toast({ title: "Merged", description: `${s.sourceCustomerName} → ${s.targetCustomerName}` });
      void load();
    } catch (e) {
      toast({
        title: "Merge failed",
        description: e instanceof Error ? e.message : undefined,
        variant: "destructive",
      });
    } finally {
      setMerging(null);
    }
  }

  if (!bid) return null;

  return (
    <Card data-testid="merge-suggestions-panel">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Link2 className="h-4 w-4" />
          Suggested merges
        </CardTitle>
        <CardDescription>
          Same phone or email across channel profiles — link to one client record.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-20 w-full" />
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No duplicate signals right now.</p>
        ) : (
          <ul className="space-y-3">
            {rows.map((s) => (
              <li
                key={`${s.identityId}-${s.targetCustomerId}`}
                className="flex flex-col sm:flex-row sm:items-center gap-2 border rounded-md p-3"
              >
                <div className="flex-1 text-sm">
                  <span className="font-medium">{s.sourceCustomerName}</span>
                  <span className="text-muted-foreground"> ({s.channelType})</span>
                  <span className="mx-1">→</span>
                  <Link href={`/customers/${s.targetCustomerId}`} className="font-medium text-primary hover:underline">
                    {s.targetCustomerName}
                  </Link>
                  <Badge variant="outline" className="ml-2 text-[10px]">
                    {s.matchReason}
                  </Badge>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={merging === s.identityId}
                  onClick={() => void mergeOne(s)}
                >
                  {merging === s.identityId ? "Merging…" : "Merge"}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
