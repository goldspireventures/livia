import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useBusiness } from "@/lib/business-context";
import { useToast } from "@/hooks/use-toast";
import { customFetch } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PersonaRitualHeader } from "@/components/ritual/persona-ritual-header";
import { PageFrame } from "@/components/ui/page-frame";
import { SettingsDisclosure } from "@/components/ui/settings-disclosure";
import { designProofsSubmitDefaultOpen } from "@workspace/policy";
import { ImageIcon } from "lucide-react";
import { uploadImageFile } from "@/lib/upload-media";
import { clientGuestTokenHref } from "@/lib/guest-book-url";
import { BodyArtPipelineCard } from "@/components/body-art/body-art-pipeline-card";
import { DesignProofDesk, type DesignProofRow } from "@/components/body-art/design-proof-desk";

export default function DesignProofsPage() {
  const { business } = useBusiness();
  const { toast } = useToast();
  const bid = business?.id ?? "";
  const vertical = (business as { vertical?: string } | null)?.vertical;
  const [proofs, setProofs] = useState<DesignProofRow[]>([]);
  const [imageUrl, setImageUrl] = useState("");
  const [note, setNote] = useState("");
  const [uploading, setUploading] = useState(false);

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

  async function submit() {
    if (!bid) return;
    try {
      const created = await customFetch<{ id: string }>(`/api/businesses/${bid}/design-proofs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: imageUrl || undefined, note }),
      });
      await customFetch(`/api/businesses/${bid}/design-proofs/${created.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "pending_review" }),
      });
      toast({ title: "Design submitted for review" });
      setImageUrl("");
      setNote("");
      void load();
    } catch {
      toast({ title: "Failed", variant: "destructive" });
    }
  }

  async function setStatus(id: string, status: string) {
    try {
      await customFetch(`/api/businesses/${bid}/design-proofs/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      void load();
    } catch {
      toast({ title: "Update failed", variant: "destructive" });
    }
  }

  async function copyGuestLink(guestToken: string) {
    if (!business?.slug) return;
    const url = clientGuestTokenHref(business.slug, "proof", guestToken);
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "Guest link copied" });
    } catch {
      toast({ title: url, description: "Copy this link for your client" });
    }
  }

  return (
    <PageFrame width="full" className="space-y-6" data-testid="design-proofs-page">
      <PersonaRitualHeader
        variant="page"
        title="Design proofs"
        subtitle="Draft, client review, approve — approved work can appear on your /b page."
      />

      <div className="grid gap-4 lg:grid-cols-[min(18rem,100%)_1fr] lg:items-start">
        {vertical === "body-art" ? <BodyArtPipelineCard /> : null}
        {vertical === "body-art" ? (
          <p className="text-xs text-muted-foreground lg:col-span-2 -mt-2">
            Approved designs show under{" "}
            <Link href="/store" className="text-primary hover:underline">
              Shop → /b
            </Link>{" "}
            as flash & custom work. Aftercare products stay in the retail shop tab.
          </p>
        ) : null}
      </div>

      <DesignProofDesk
        proofs={proofs}
        businessSlug={business?.slug}
        onSetStatus={(id, status) => void setStatus(id, status)}
        onCopyGuestLink={(token) => void copyGuestLink(token)}
      />

      <SettingsDisclosure
        title="Submit new proof"
        description="Upload artwork or paste a URL."
        defaultOpen={designProofsSubmitDefaultOpen(proofs.length)}
      >
        <div className="space-y-3 pt-1">
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm">
              <ImageIcon className="h-3.5 w-3.5" />
              Artwork
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
              <img src={imageUrl} alt="" className="h-24 w-auto rounded border object-cover" />
            ) : null}
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Or image URL</Label>
            <Input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://…"
              className="h-9"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Notes</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
          </div>
          <Button size="sm" onClick={() => void submit()}>
            Submit for review
          </Button>
        </div>
      </SettingsDisclosure>
    </PageFrame>
  );
}
