import { useEffect, useState } from "react";
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
  fetchOwnershipCandidates,
  transferOwnership,
  type OwnershipCandidate,
} from "@/lib/lifecycle-api";

export function OwnershipTransferPanel() {
  const { business } = useBusiness();
  const { toast } = useToast();
  const [candidates, setCandidates] = useState<OwnershipCandidate[]>([]);
  const [incomingUserId, setIncomingUserId] = useState("");
  const [outgoingDisposition, setOutgoingDisposition] = useState<"STAFF" | "ADMIN" | "REVOKE">(
    "STAFF",
  );
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (!business?.id) return;
    void fetchOwnershipCandidates(business.id)
      .then((r) => setCandidates(r.candidates))
      .catch(() => setCandidates([]));
  }, [business?.id]);

  if (!business?.id) return null;

  const selected = candidates.find((c) => c.userId === incomingUserId);

  const onTransfer = async () => {
    if (!incomingUserId) return;
    setLoading(true);
    try {
      await transferOwnership(business.id, { incomingUserId, outgoingDisposition });
      toast({
        title: "Ownership transferred",
        description:
          "The new owner will see a keys-changed guide on next sign-in. You may need to sign out and back in.",
      });
      window.location.href = "/sign-in";
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Transfer failed";
      toast({ title: "Could not transfer", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-amber-500/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <KeyRound className="h-4 w-4 text-amber-500" />
          Ownership & succession
        </CardTitle>
        <CardDescription>
          Hand the business to a manager or co-owner who already has a team login. Logged in the audit
          chain; billing contact updates when Stripe is connected.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {candidates.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Invite your successor as Manager or Staff first — Settings → Team, or Staff → Invite.
          </p>
        ) : (
          <>
            <div className="space-y-2">
              <Label>New owner</Label>
              <Select value={incomingUserId} onValueChange={setIncomingUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose team member" />
                </SelectTrigger>
                <SelectContent>
                  {candidates.map((c) => (
                    <SelectItem key={c.userId} value={c.userId}>
                      {c.fullName || c.email} — {c.role}
                      {c.deskRole === "reception" ? " (front desk)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Your role after transfer</Label>
              <Select
                value={outgoingDisposition}
                onValueChange={(v) =>
                  setOutgoingDisposition(v as "STAFF" | "ADMIN" | "REVOKE")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STAFF">Stay as staff member</SelectItem>
                  <SelectItem value="ADMIN">Stay as manager (admin)</SelectItem>
                  <SelectItem value="REVOKE">Leave this business entirely</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {selected?.deskRole === "reception" ? (
              <p className="text-xs text-amber-600 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                Front-desk roles usually become owner only after promotion to manager — confirm this
                is intentional.
              </p>
            ) : null}
            <Button
              variant="destructive"
              disabled={!incomingUserId || loading}
              onClick={() => setConfirmOpen(true)}
            >
              Transfer ownership
            </Button>
            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Transfer ownership?</DialogTitle>
                  <DialogDescription>
                    {selected?.fullName || selected?.email} will become owner of {business.name}.
                    This cannot be undone from the UI without support after 30 days. Continue?
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
                    Yes, transfer keys
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}
      </CardContent>
    </Card>
  );
}
