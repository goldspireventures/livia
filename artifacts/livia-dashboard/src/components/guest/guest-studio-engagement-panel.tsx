import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GUEST_HUB_COPY } from "@workspace/policy";
import { CalendarCheck, Image, MessageSquare, Sparkles } from "lucide-react";
import { DesignProofVersionFrame } from "@/components/body-art/design-proof-version-frame";
import type { GuestProofArtifact } from "@/components/guest/guest-design-proof-card";

/** Actionable studio engagement strip — vertical-aware, visit + shop surfaces. */
export function GuestStudioEngagementPanel({
  vertical,
  bookUrl,
  proofs = [],
  onMessage,
  hubToken,
  shopSlug,
}: {
  vertical: string | null | undefined;
  bookUrl: string;
  proofs?: GuestProofArtifact[];
  onMessage?: () => void;
  hubToken?: string | null;
  shopSlug?: string | null;
}) {
  const pending = proofs.find((p) => p.status === "pending_review");
  const rejected = proofs.find((p) => p.status === "rejected");
  const activeProof = pending ?? rejected ?? proofs[0];
  const isBodyArt = vertical === "body-art";

  if (!isBodyArt && proofs.length === 0) {
    return (
      <Card className="border-border/80" data-testid="guest-studio-engagement">
        <CardContent className="py-4 space-y-3">
          <p className="text-sm font-medium">{GUEST_HUB_COPY.messageStudioTitle}</p>
          <p className="text-xs text-muted-foreground">{GUEST_HUB_COPY.messageStudioBody}</p>
          <div className="flex flex-wrap gap-2">
            {onMessage ? (
              <Button size="sm" variant="default" className="gap-1.5" onClick={onMessage}>
                <MessageSquare className="h-3.5 w-3.5" />
                Message studio
              </Button>
            ) : null}
            <Button size="sm" variant="outline" className="gap-1.5" asChild>
              <a href={bookUrl}>
                <CalendarCheck className="h-3.5 w-3.5" />
                {GUEST_HUB_COPY.bookAgainCta}
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="space-y-3" data-testid="guest-studio-engagement">
      {activeProof ? (
        <Card className="border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card overflow-hidden">
          <CardContent className="py-4">
            <p className="text-[10px] uppercase tracking-widest font-mono text-primary flex items-center gap-1.5 mb-3">
              <Image className="h-3.5 w-3.5" />
              Design proof
            </p>
            <DesignProofVersionFrame
              proof={activeProof}
              testIdPrefix="guest-engagement-proof"
              hubToken={hubToken}
              shopSlug={shopSlug}
            />
          </CardContent>
        </Card>
      ) : isBodyArt ? (
        <Card className="border-border/80 bg-card/40">
          <CardContent className="py-4 text-sm flex gap-3">
            <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Work with your artist</p>
              <p className="text-xs text-muted-foreground mt-1">
                Message the studio about placement, references, or session timing — they reply on your thread.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {onMessage ? (
          <Button size="sm" variant="secondary" className="gap-1.5" onClick={onMessage}>
            <MessageSquare className="h-3.5 w-3.5" />
            Message studio
          </Button>
        ) : null}
        <Button size="sm" variant="outline" className="gap-1.5" asChild>
          <a href={bookUrl}>
            <CalendarCheck className="h-3.5 w-3.5" />
            {isBodyArt ? "Book a session" : GUEST_HUB_COPY.bookAgainCta}
          </a>
        </Button>
      </div>
    </section>
  );
}
