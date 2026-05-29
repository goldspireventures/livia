import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Copy, ExternalLink } from "lucide-react";
import { MOTION } from "@/lib/motion";
import { cn } from "@/lib/utils";

type Props = {
  slug: string;
  businessName?: string;
};

export function OnboardingPublicLinkSplit({ slug, businessName }: Props) {
  const { toast } = useToast();
  const [frameKey, setFrameKey] = useState(0);
  const path = `/b/${slug}`;
  const absolute =
    typeof window !== "undefined" ? `${window.location.origin}${path}` : path;

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(absolute);
      toast({ title: "Link copied" });
    } catch {
      toast({ title: "Could not copy", variant: "destructive" });
    }
  }, [absolute, toast]);

  const refreshPreview = () => setFrameKey((k) => k + 1);

  return (
    <div className="space-y-4" data-testid="onboarding-public-link-split">
      <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
        <div className="space-y-3 rounded-xl border border-border/50 bg-background/50 p-4">
          <Label className="text-xs text-muted-foreground">Public link</Label>
          <div className="flex gap-2">
            <Input readOnly value={absolute} className="text-xs font-mono" />
            <Button type="button" variant="outline" size="icon" onClick={() => void copyLink()} aria-label="Copy link">
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" size="sm" asChild>
              <a href={path} target="_blank" rel="noopener noreferrer">
                Open in new tab
                <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={refreshPreview}>
              Refresh preview
            </Button>
          </div>
          {businessName ? (
            <p className="text-xs text-muted-foreground">
              Showing <span className="font-medium text-foreground">{businessName}</span> at{" "}
              <code className="text-primary">/b/{slug}</code>
            </p>
          ) : null}
        </div>
        <div className="relative overflow-hidden rounded-xl border-2 border-primary/25 bg-background min-h-[300px] lg:min-h-[380px] ring-1 ring-primary/10">
          <iframe
            key={frameKey}
            title="Booking page preview"
            src={path}
            className={cn("h-full min-h-[280px] lg:min-h-[360px] w-full border-0", MOTION.enterPanel)}
          />
        </div>
      </div>
    </div>
  );
}
