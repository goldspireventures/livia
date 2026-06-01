import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useMembership } from "@/lib/membership-context";
import { useToast } from "@/hooks/use-toast";
import { customFetch } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { CalendarOff, Check, Loader2 } from "lucide-react";

export type TimeOffRequestRow = {
  id: string;
  staffId: string;
  kind: string;
  startAt: string;
  endAt: string;
  reason?: string | null;
  status: string;
};

type Props = {
  businessId: string;
  /** When set, request form targets this clinician; managers can pick any staff on Rota. */
  staffId?: string;
  staffDisplayName?: string;
  /** Show manager approve actions */
  showApprovals?: boolean;
  compact?: boolean;
  onLoaded?: (rows: TimeOffRequestRow[]) => void;
};

const KINDS = [
  { value: "annual_leave", label: "Annual leave" },
  { value: "sick", label: "Sick" },
  { value: "training", label: "Training" },
  { value: "personal", label: "Personal" },
  { value: "bereavement", label: "Bereavement" },
  { value: "block", label: "Block (no bookings)" },
] as const;

export function TimeOffRequestsPanel({
  businessId,
  staffId: fixedStaffId,
  staffDisplayName,
  showApprovals = false,
  compact = false,
  onLoaded,
}: Props) {
  const { toast } = useToast();
  const { effectiveRole, ownStaffId } = useMembership();
  const canApprove = showApprovals && (effectiveRole === "OWNER" || effectiveRole === "ADMIN");
  const canSelfRequest =
    !!fixedStaffId && !!ownStaffId && fixedStaffId === ownStaffId;

  const [requests, setRequests] = useState<TimeOffRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [kind, setKind] = useState<string>("annual_leave");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  async function reload() {
    if (!businessId) return;
    setLoading(true);
    try {
      const q = fixedStaffId ? `?staffId=${encodeURIComponent(fixedStaffId)}` : "";
      const rows = await customFetch<TimeOffRequestRow[]>(
        `/api/businesses/${businessId}/time-off-requests${q}`,
      );
      setRequests(rows);
      onLoaded?.(rows);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, [businessId, fixedStaffId]);

  async function submitRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!fixedStaffId || !startAt || !endAt) {
      toast({ title: "Pick start and end times", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await customFetch(`/api/businesses/${businessId}/time-off-requests`, {
        method: "POST",
        body: JSON.stringify({
          staffId: fixedStaffId,
          kind,
          startAt: new Date(startAt).toISOString(),
          endAt: new Date(endAt).toISOString(),
          reason: reason.trim() || undefined,
        }),
      });
      toast({
        title: "Leave request sent",
        description: "Your manager gets notified — Liv blocks the calendar once approved.",
      });
      setStartAt("");
      setEndAt("");
      setReason("");
      void reload();
    } catch (err) {
      toast({
        title: "Could not submit request",
        description: err instanceof Error ? err.message : "Try again",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function approve(requestId: string) {
    setApprovingId(requestId);
    try {
      await customFetch(
        `/api/businesses/${businessId}/time-off-requests/${requestId}/approve`,
        { method: "POST", body: JSON.stringify({}) },
      );
      toast({ title: "Approved", description: "Calendar blocked and team notified." });
      void reload();
    } catch {
      toast({ title: "Approval failed", variant: "destructive" });
    } finally {
      setApprovingId(null);
    }
  }

  const pending = requests.filter((r) =>
    ["PENDING_APPROVAL", "PROPOSED", "ESCALATED"].includes(r.status),
  );

  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      {canSelfRequest ? (
        <Card>
          <CardHeader className={compact ? "py-3" : undefined}>
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarOff className="h-4 w-4" />
              Request time off
            </CardTitle>
            <CardDescription>
              Submit your own leave — managers approve on Rota; Liv blocks the calendar automatically.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => void submitRequest(e)} className="space-y-3">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={kind} onValueChange={setKind}>
                  <SelectTrigger data-testid="time-off-kind">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {KINDS.map((k) => (
                      <SelectItem key={k.value} value={k.value}>
                        {k.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">From</Label>
                  <Input
                    type="datetime-local"
                    value={startAt}
                    onChange={(e) => setStartAt(e.target.value)}
                    data-testid="time-off-start"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">To</Label>
                  <Input
                    type="datetime-local"
                    value={endAt}
                    onChange={(e) => setEndAt(e.target.value)}
                    data-testid="time-off-end"
                  />
                </div>
              </div>
              <Input
                placeholder="Note for your manager (optional)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
              <Button type="submit" disabled={submitting || !startAt || !endAt} className="w-full">
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Submit for approval
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : fixedStaffId && canApprove ? (
        <p className="text-sm text-muted-foreground rounded-lg border border-border p-3">
          {staffDisplayName ?? "This team member"} requests leave from their profile or My chair — managers
          approve below, not on their behalf.
        </p>
      ) : (
        <p className="text-sm text-muted-foreground rounded-lg border border-border p-3">
          Open your profile or{" "}
          <Link href="/my-day" className="text-primary underline-offset-2 hover:underline">
            My chair
          </Link>{" "}
          to request leave. Managers approve on{" "}
          <Link href="/rota" className="text-primary underline-offset-2 hover:underline">
            Rota
          </Link>
          .
        </p>
      )}

      {(pending.length > 0 || loading) && (
        <Card>
          <CardHeader className={compact ? "py-3" : undefined}>
            <CardTitle className="text-base">
              {canApprove ? "Pending approvals" : "Your requests"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-2">
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
              </div>
            ) : pending.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No pending requests.</p>
            ) : (
              <div className="divide-y divide-border">
                {pending.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium">
                        {new Date(r.startAt).toLocaleString()} →{" "}
                        {new Date(r.endAt).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {r.kind.replace(/_/g, " ")}
                        {r.reason ? ` · ${r.reason}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline">{r.status.replace(/_/g, " ")}</Badge>
                      {canApprove ? (
                        <Button
                          size="sm"
                          onClick={() => void approve(r.id)}
                          disabled={approvingId === r.id}
                          data-testid={`approve-time-off-${r.id}`}
                        >
                          {approvingId === r.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Check className="h-3 w-3 mr-1" />
                          )}
                          Approve
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
