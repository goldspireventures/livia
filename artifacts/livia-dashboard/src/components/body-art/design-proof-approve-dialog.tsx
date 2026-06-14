import { useState } from "react";
import {
  DESIGN_PROOF_KIND_LABEL,
  DESIGN_PROOF_PUBLISH_LABEL,
  allowedPublishRightsForKind,
  defaultPublishRightForKind,
  type DesignProofKind,
  type DesignProofPublishRight,
} from "@workspace/policy";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DesignProofApproveDialog({
  open,
  onOpenChange,
  proofKind,
  customerName,
  title,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proofKind: DesignProofKind;
  customerName?: string | null;
  title: string;
  onConfirm: (publishRight: DesignProofPublishRight) => void;
}) {
  const options = allowedPublishRightsForKind(proofKind);
  const [publishRight, setPublishRight] = useState<DesignProofPublishRight>(
    defaultPublishRightForKind(proofKind),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sign off in studio</DialogTitle>
          <DialogDescription>
            {DESIGN_PROOF_KIND_LABEL[proofKind]}
            {customerName ? ` for ${customerName}` : ""} — &ldquo;{title}&rdquo;. Choose who can see
            this artwork after approval.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {options.map((right) => (
            <button
              key={right}
              type="button"
              onClick={() => setPublishRight(right)}
              className={cn(
                "w-full text-left rounded-lg border px-3 py-2 text-sm transition-colors",
                publishRight === right
                  ? "border-primary bg-primary/10"
                  : "border-border/70 hover:border-primary/30",
              )}
            >
              {DESIGN_PROOF_PUBLISH_LABEL[right]}
            </button>
          ))}
        </div>

        {proofKind === "custom_commission" && publishRight === "portfolio_ok" ? (
          <p className="text-xs text-muted-foreground">
            Only choose portfolio if your client has agreed their custom piece can appear on your public
            page.
          </p>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => onConfirm(publishRight)} data-testid="confirm-proof-approve">
            Approve & save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
