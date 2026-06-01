import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, KeyRound } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useBusiness } from "@/lib/business-context";
import {
  OWNERSHIP_SUCCESSION,
  sortOwnershipCandidates,
  type OutgoingOwnerDisposition,
} from "@workspace/policy";
import {
  fetchOwnershipCandidates,
  transferOwnership,
  type OwnershipCandidate,
  type RosterWithoutSignIn,
} from "@/lib/lifecycle-api";
import { OwnershipSuccessionInvite } from "@/components/lifecycle/ownership-succession-invite";

const copy = OWNERSHIP_SUCCESSION;

export function OwnershipTransferPanel() {
  const { business } = useBusiness();
  const { toast } = useToast();
  const [candidates, setCandidates] = useState<OwnershipCandidate[]>([]);
  const [rosterWithoutSignIn, setRosterWithoutSignIn] = useState<RosterWithoutSignIn[]>([]);
  const [incomingUserId, setIncomingUserId] = useState("");
  const [outgoingDisposition, setOutgoingDisposition] = useState<OutgoingOwnerDisposition>("STAFF");
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const loadCandidates = useCallback(() => {
    if (!business?.id) return;
    void fetchOwnershipCandidates(business.id)
      .then((r) => {
        setCandidates(r.candidates ?? []);
        setRosterWithoutSignIn(r.rosterWithoutSignIn ?? []);
      })
      .catch(() => {
        setCandidates([]);
        setRosterWithoutSignIn([]);
      });
  }, [business?.id]);

  useEffect(() => {
    loadCandidates();
  }, [loadCandidates]);

  if (!business?.id) return null;

  const safeCandidates = sortOwnershipCandidates(candidates ?? []);
  const safeRosterWithoutSignIn = rosterWithoutSignIn ?? [];
  const canTransfer = safeCandidates.length > 0;
  const whatChangesBullets = copy.whatChangesBullets ?? [];
  const selected = safeCandidates.find((c) => c.userId === incomingUserId);

  const onTransfer = async () => {
    if (!incomingUserId) return;
    setLoading(true);
    try {
      await transferOwnership(business.id, { incomingUserId, outgoingDisposition });
      toast({
        title: "Keys passed",
        description: "Sign in again if your role changed.",
      });
      window.location.href = "/sign-in";
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not complete succession";
      toast({ title: "Could not pass the keys", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4" data-testid="ownership-succession-panel">
      <Card className="border-amber-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="h-4 w-4 text-amber-500" />
            {copy.panelTitle}
          </CardTitle>
          <CardDescription>{copy.panelSubtitle}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-lg border border-border/70 bg-muted/20 px-3 py-3 space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {copy.whatChangesTitle}
            </p>
            <ul className="text-sm text-muted-foreground space-y-1.5 list-disc pl-4">
              {whatChangesBullets.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>

          <OwnershipSuccessionInvite businessId={business.id} onSent={loadCandidates} />

          {canTransfer ? (
            <>
              <div className="space-y-2">
                <Label>Pass the keys to</Label>
                <Select value={incomingUserId} onValueChange={setIncomingUserId}>
                  <SelectTrigger data-testid="ownership-incoming-select">
                    <SelectValue placeholder="Choose who receives ownership" />
                  </SelectTrigger>
                  <SelectContent>
                    {safeCandidates.map((c) => {
                      const roleLabel =
                        copy.membershipRoleLabels[
                          c.role as keyof typeof copy.membershipRoleLabels
                        ] ?? c.role;
                      return (
                        <SelectItem key={c.userId} value={c.userId}>
                          {c.fullName || c.email} — {roleLabel}
                          {c.deskRole === "reception" ? " (front desk)" : ""}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Your role after you pass the keys</Label>
                <Select
                  value={outgoingDisposition}
                  onValueChange={(v) => setOutgoingDisposition(v as OutgoingOwnerDisposition)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(copy.dispositionLabels) as OutgoingOwnerDisposition[]).map(
                      (key) => (
                        <SelectItem key={key} value={key}>
                          {copy.dispositionLabels[key]}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
              {selected?.deskRole === "reception" ? (
                <p className="text-xs text-amber-600 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  This person is set up for front desk — confirm they should become owner.
                </p>
              ) : null}
              <Button
                variant="destructive"
                disabled={!incomingUserId || loading}
                data-testid="ownership-pass-keys"
                onClick={() => setConfirmOpen(true)}
              >
                {copy.applyCta}
              </Button>
              <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{copy.confirmTitle}</DialogTitle>
                    <DialogDescription>
                      {copy.confirmBody(
                        business.name ?? "this studio",
                        selected?.fullName || selected?.email || "This person",
                      )}
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setConfirmOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      disabled={loading}
                      onClick={() => {
                        setConfirmOpen(false);
                        void onTransfer();
                      }}
                    >
                      Yes, pass the keys
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">{copy.candidatesEmptyBody}</p>
          )}

          {safeRosterWithoutSignIn.length > 0 ? (
            <div className="rounded-lg border border-dashed border-border/80 px-3 py-3 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">{copy.rosterOnlyTitle}</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                {safeRosterWithoutSignIn.map((s) => (
                  <li key={s.staffId}>
                    {s.displayName}
                    {s.email ? ` · ${s.email}` : ""}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground">{copy.rosterOnlyHint}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
