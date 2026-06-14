import { useState } from "react";
import { ImageIcon, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { uploadImageFile } from "@/lib/upload-media";

export function DesignProofEditDialog({
  open,
  onOpenChange,
  businessId,
  proofTitle,
  currentNote,
  currentImageUrl,
  version,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: string;
  proofTitle: string;
  currentNote?: string | null;
  currentImageUrl?: string | null;
  version: number;
  onSave: (payload: {
    imageUrl: string;
    note: string;
    replaceArtwork: boolean;
    resendAfterReplace: boolean;
  }) => Promise<void>;
}) {
  const [imageUrl, setImageUrl] = useState(currentImageUrl ?? "");
  const [note, setNote] = useState(currentNote ?? "");
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [resend, setResend] = useState(false);

  async function handleSave() {
    if (!imageUrl.trim()) return;
    setBusy(true);
    try {
      await onSave({
        imageUrl: imageUrl.trim(),
        note: note.trim(),
        replaceArtwork: imageUrl.trim() !== (currentImageUrl ?? "").trim(),
        resendAfterReplace: resend,
      });
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (v) {
          setImageUrl(currentImageUrl ?? "");
          setNote(currentNote ?? "");
          setResend(false);
        }
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Replace studio artwork</DialogTitle>
          <DialogDescription>
            {proofTitle} · v{version}. Upload a new file to create v{version + 1}. Client references stay
            in intake — this is your design file.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm">
              <ImageIcon className="h-3.5 w-3.5" />
              New artwork
            </Label>
            <Input
              type="file"
              accept="image/*"
              disabled={uploading}
              className="h-9"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file || !businessId) return;
                setUploading(true);
                void uploadImageFile(businessId, file, { entityType: "design_proof" })
                  .then((r) => setImageUrl(r.url))
                  .finally(() => setUploading(false));
              }}
            />
            {uploading ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Uploading…
              </div>
            ) : null}
            {imageUrl ? (
              <img src={imageUrl} alt="" className="h-28 w-auto rounded border object-contain bg-[#f3efe6]" />
            ) : null}
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Design title & placement</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Serpent & bloom — half sleeve"
            />
          </div>
          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={resend}
              onChange={(e) => setResend(e.target.checked)}
              className="rounded border-border"
            />
            Resend to client for review immediately
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => void handleSave()} disabled={!imageUrl.trim() || busy || uploading}>
            Save v{version + 1}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
