import { useEffect, useMemo, useState } from "react";
import { useSearch } from "wouter";
import { useBusiness } from "@/lib/business-context";
import { useInAppNotifications } from "@/hooks/use-in-app-notifications";
import { useToast } from "@/hooks/use-toast";
import { customFetch } from "@workspace/api-client-react";
import {
  DESIGN_PROOF_KIND_LABEL,
  type DesignProofKind,
  type DesignProofPublishRight,
  defaultPublishRightForKind,
} from "@workspace/policy";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PersonaRitualHeader } from "@/components/ritual/persona-ritual-header";
import { PageFrame } from "@/components/ui/page-frame";
import { ImageIcon, Plus } from "lucide-react";
import { uploadImageFile } from "@/lib/upload-media";
import { clientGuestTokenHref } from "@/lib/guest-book-url";
import { DesignProofDesk, type DesignProofRow } from "@/components/body-art/design-proof-desk";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const PROOF_KINDS: DesignProofKind[] = ["custom_commission", "flash", "client_supplied"];

export default function DesignProofsPage() {
  const { business } = useBusiness();
  const { toast } = useToast();
  const search = useSearch();
  const proofFromNotification = useMemo(() => {
    const params = new URLSearchParams(search.startsWith("?") ? search : `?${search}`);
    return params.get("proof");
  }, [search]);
  const bid = business?.id ?? "";
  const { markReadByResource } = useInAppNotifications();
  const vertical = (business as { vertical?: string } | null)?.vertical;
  const [proofs, setProofs] = useState<DesignProofRow[]>([]);
  const [imageUrl, setImageUrl] = useState("");
  const [note, setNote] = useState("");
  const [proofKind, setProofKind] = useState<DesignProofKind>("custom_commission");
  const [uploading, setUploading] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);

  async function load() {
    if (!bid) return;
    try {
      setProofs(await customFetch<DesignProofRow[]>(`/api/businesses/${bid}/design-proofs`));
    } catch {
      setProofs([]);
    }
  }

  useEffect(() => {
    void load();
  }, [bid]);

  useEffect(() => {
    if (!proofFromNotification || !bid) return;
    void markReadByResource({
      resourceKind: "design_proof",
      resourceId: proofFromNotification,
      businessId: bid,
    });
  }, [proofFromNotification, bid, markReadByResource]);

  async function submit(sendToClient: boolean) {
    if (!bid) return;
    try {
      const created = await customFetch<{ id: string }>(`/api/businesses/${bid}/design-proofs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: imageUrl || undefined,
          note,
          proofKind,
          publishRight: defaultPublishRightForKind(proofKind),
        }),
      });
      if (sendToClient) {
        await customFetch(`/api/businesses/${bid}/design-proofs/${created.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "pending_review" }),
        });
      }
      toast({
        title: sendToClient ? "Sent to client for review" : "Studio design saved as draft",
      });
      setImageUrl("");
      setNote("");
      setProofKind("custom_commission");
      setSubmitOpen(false);
      void load();
    } catch {
      toast({ title: "Failed", variant: "destructive" });
    }
  }

  async function setStatus(id: string, status: string, publishRight?: DesignProofPublishRight) {
    try {
      await customFetch(`/api/businesses/${bid}/design-proofs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, publishRight }),
      });
      toast({
        title: status === "approved" ? "Design approved" : "Status updated",
      });
      void load();
    } catch {
      toast({ title: "Update failed", variant: "destructive" });
    }
  }

  async function patchProof(
    id: string,
    patch: {
      imageUrl?: string;
      note?: string;
      replaceArtwork?: boolean;
      resendAfterReplace?: boolean;
      revertToVersion?: number;
      resendAfterRevert?: boolean;
    },
  ) {
    await customFetch(`/api/businesses/${bid}/design-proofs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const title = patch.revertToVersion
      ? `Restored v${patch.revertToVersion} as new version`
      : patch.resendAfterReplace
        ? "Artwork replaced & resent"
        : "Artwork updated";
    toast({ title });
    void load();
  }

  async function copyGuestLink(guestToken: string) {
    if (!business?.slug) return;
    const url = clientGuestTokenHref(business.slug, "proof", guestToken);
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "Client link copied" });
    } catch {
      toast({ title: url, description: "Copy this link for your client" });
    }
  }

  const uploadForm = (
    <div className="space-y-3 pt-1">
      <div className="space-y-2">
        <Label className="text-sm">Design type</Label>
        <div className="flex flex-wrap gap-1.5">
          {PROOF_KINDS.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setProofKind(k)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs transition-colors",
                proofKind === k
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/70 hover:border-primary/30",
              )}
            >
              {DESIGN_PROOF_KIND_LABEL[k]}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Your studio artwork — not client reference uploads (those stay in consult intake).
        </p>
      </div>
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-sm">
          <ImageIcon className="h-3.5 w-3.5" />
          Artwork file
        </Label>
        <Input
          type="file"
          accept="image/*"
          disabled={uploading}
          className="h-9"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file || !bid) return;
            setUploading(true);
            void uploadImageFile(bid, file, { entityType: "design_proof" })
              .then((r) => setImageUrl(r.url))
              .catch(() => toast({ title: "Upload failed", variant: "destructive" }))
              .finally(() => setUploading(false));
          }}
        />
        {imageUrl ? (
          <img src={imageUrl} alt="" className="h-32 w-auto rounded border object-contain bg-[#f3efe6]" />
        ) : null}
      </div>
      <div className="space-y-2">
        <Label className="text-sm">Title & placement</Label>
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="Serpent & bloom — half sleeve"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => void submit(false)} disabled={!imageUrl}>
          Save draft
        </Button>
        <Button size="sm" onClick={() => void submit(true)} disabled={!imageUrl}>
          Send to client
        </Button>
      </div>
    </div>
  );

  return (
    <PageFrame width="full" className="space-y-6" data-testid="design-proofs-page">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PersonaRitualHeader
          variant="page"
          title="Proof desk"
          subtitle="Studio designs → client sign-off → session. Replace artwork anytime — versions tracked."
        />
        {vertical === "body-art" ? (
          <Dialog open={submitOpen} onOpenChange={setSubmitOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="shrink-0">
                <Plus className="h-4 w-4 mr-1.5" />
                Upload studio design
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New studio design</DialogTitle>
                <DialogDescription>
                  Upload your artwork for this client or flash sheet. Client references belong in consult
                  intake.
                </DialogDescription>
              </DialogHeader>
              {uploadForm}
            </DialogContent>
          </Dialog>
        ) : null}
      </div>

      {vertical === "body-art" ? (
        <DesignProofDesk
          proofs={proofs}
          businessId={bid}
          businessSlug={business?.slug}
          initialProofId={proofFromNotification}
          onSetStatus={(id, status, publishRight) => void setStatus(id, status, publishRight)}
          onPatchProof={patchProof}
          onCopyGuestLink={(token) => void copyGuestLink(token)}
        />
      ) : (
        <p className="text-sm text-muted-foreground">Design proofs are available for body-art studios.</p>
      )}
    </PageFrame>
  );
}
