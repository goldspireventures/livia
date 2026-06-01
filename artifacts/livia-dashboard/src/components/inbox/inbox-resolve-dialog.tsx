import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type ResolveOutcome = "refund_and_cancel" | "cancel_no_refund" | "close_no_action";

type Props = {
  open: boolean;
  outcome: ResolveOutcome | null;
  customerName?: string;
  refundMinor?: number;
  busy?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (message: string) => void;
};

const TITLES: Record<ResolveOutcome, string> = {
  refund_and_cancel: "Approve refund and cancel",
  cancel_no_refund: "Deny refund — cancel appointment",
  close_no_action: "Deny refund — keep appointment",
};

const PLACEHOLDERS: Record<ResolveOutcome, string> = {
  refund_and_cancel:
    "Hi — your deposit is refunded and your appointment is cancelled. We're sorry this didn't work out.",
  cancel_no_refund:
    "Hi — we've cancelled your appointment. Per our policy the deposit isn't refundable for late cancellations.",
  close_no_action:
    "Hi — we can't refund the deposit on this one, but your appointment is still confirmed if you'd like to keep it.",
};

export function InboxResolveDialog({
  open,
  outcome,
  customerName,
  refundMinor,
  busy,
  onOpenChange,
  onConfirm,
}: Props) {
  const [message, setMessage] = useState("");

  if (!outcome) return null;

  const title = TITLES[outcome];
  const refundLabel =
    refundMinor && outcome === "refund_and_cancel"
      ? ` (€${(refundMinor / 100).toFixed(2)})`
      : "";

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) setMessage("");
        onOpenChange(o);
      }}
    >
      <DialogContent data-testid="inbox-resolve-dialog">
        <DialogHeader>
          <DialogTitle>
            {title}
            {refundLabel}
          </DialogTitle>
          <DialogDescription>
            {customerName ? `${customerName} will receive this on their channel. ` : ""}
            You must send a closing message — the thread is archived after you confirm.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="resolve-message">Message to customer</Label>
          <Textarea
            id="resolve-message"
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={PLACEHOLDERS[outcome]}
            data-testid="inbox-resolve-message"
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Back
          </Button>
          <Button
            type="button"
            disabled={busy || !message.trim()}
            data-testid="inbox-resolve-confirm"
            onClick={() => onConfirm(message.trim())}
          >
            {busy ? "Saving…" : "Confirm and close"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
