import { useEffect, useState } from "react";
import { useBusiness } from "@/lib/business-context";
import { useToast } from "@/hooks/use-toast";
import { customFetch } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PersonaRitualHeader } from "@/components/ritual/persona-ritual-header";
import { ImageIcon } from "lucide-react";
import { uploadImageFile } from "@/lib/upload-media";

type Proof = {
  id: string;
  status: string;
  imageUrl?: string | null;
  note?: string | null;
  customerId?: string | null;
  createdAt: string;
};

export default function DesignProofsPage() {
  const { business } = useBusiness();
  const { toast } = useToast();
  const bid = business?.id ?? "";
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [imageUrl, setImageUrl] = useState("");
  const [note, setNote] = useState("");
  const [uploading, setUploading] = useState(false);

  async function load() {
    if (!bid) return;
    try {
      setProofs(await customFetch<Proof[]>(`/api/businesses/${bid}/design-proofs`));
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

  return (
    <div className="space-y-6 max-w-3xl" data-testid="design-proofs-page">
      <PersonaRitualHeader
        variant="page"
        title="Design proofs"
        subtitle="Tattoo and body-art workflow — draft, client review, approve, then book the session."
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            New proof
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label>Artwork</Label>
            <Input
              type="file"
              accept="image/*"
              disabled={uploading}
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
              <img src={imageUrl} alt="" className="h-32 w-auto rounded border object-cover" />
            ) : null}
          </div>
          <div className="space-y-2">
            <Label>Or image URL</Label>
            <Input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://…"
            />
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <Button onClick={() => void submit()}>Submit for review</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Queue</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {proofs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No proofs yet.</p>
          ) : (
            proofs.map((p) => (
              <div key={p.id} className="border rounded-lg p-3 flex flex-wrap gap-3 justify-between">
                <div className="flex gap-3 min-w-0">
                  {p.imageUrl ? (
                    <img
                      src={p.imageUrl}
                      alt=""
                      className="h-14 w-14 rounded object-cover shrink-0"
                    />
                  ) : null}
                  <div>
                    <p className="font-medium text-sm capitalize">{p.status.replace(/_/g, " ")}</p>
                    {p.note ? <p className="text-xs text-muted-foreground">{p.note}</p> : null}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {p.status === "draft" ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => void setStatus(p.id, "pending_review")}
                    >
                      Send for review
                    </Button>
                  ) : null}
                  {(p.status === "pending_review" || p.status === "draft") && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void setStatus(p.id, "approved")}
                      >
                        Approve
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => void setStatus(p.id, "rejected")}>
                        Reject
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
