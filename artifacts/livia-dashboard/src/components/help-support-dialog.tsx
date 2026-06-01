import { useState } from "react";
import { useBusiness } from "@/lib/business-context";
import { verticalPackUi } from "@/lib/vertical-pack-ui";
import { resolveSupportSurfaceId } from "@workspace/policy";
import { apiFetch, ApiFetchError } from "@/lib/api-fetch";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { LifeBuoy, Loader2 } from "lucide-react";

type TicketCategory = "bug" | "billing" | "liv_error" | "feature" | "other";

type Props = {
  trigger?: React.ReactNode;
  defaultCategory?: TicketCategory;
  context?: Record<string, unknown>;
};

const CATEGORY_LABELS: Record<TicketCategory, string> = {
  bug: "Something isn't working",
  liv_error: "Liv got it wrong",
  billing: "Billing or plan",
  feature: "Feature idea",
  other: "Something else",
};

/** In-app help — routes to Livia support with shop + page context. */
export function HelpSupportDialog({
  trigger,
  defaultCategory = "other",
  context = {},
}: Props) {
  const { business } = useBusiness();
  const vocab = verticalPackUi(
    (business as { vertical?: string } | null)?.vertical,
    business?.category,
  );
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<TicketCategory>(defaultCategory);
  const [severity, setSeverity] = useState<"blocking" | "annoying" | "nice_to_have">("annoying");
  const [description, setDescription] = useState("");
  const [consent, setConsent] = useState(true);
  const [sending, setSending] = useState(false);

  async function submit() {
    if (!business?.id || description.trim().length < 10) {
      toast({ title: "Please describe the issue (10+ characters)", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      await apiFetch(`/businesses/${business.id}/support/tickets`, {
        method: "POST",
        body: JSON.stringify({
          category,
          severity,
          description: description.trim(),
          consentLogsAccess: consent,
          context: {
            ...context,
            surfaceId:
              typeof window !== "undefined"
                ? resolveSupportSurfaceId(window.location.pathname, window.location.search)
                : undefined,
            route: typeof window !== "undefined" ? window.location.pathname : undefined,
            userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
          },
        }),
      });
      toast({
        title: "Message sent",
        description: "We'll reply by email. Urgent? support@livia-hq.com",
      });
      setDescription("");
      setOpen(false);
    } catch (e) {
      const ref = e instanceof ApiFetchError && e.requestId ? ` Ref: ${e.requestId}` : "";
      toast({
        title: "Could not send",
        description: `${e instanceof Error ? e.message : "Try again"}${ref}`,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" data-testid="help-support-trigger">
            <LifeBuoy className="h-4 w-4 mr-2" />
            Get help
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" data-testid="help-support-dialog">
        <DialogHeader>
          <DialogTitle>Get help</DialogTitle>
          <DialogDescription>
            Tell us what went wrong. We attach your {vocab.locationNoun.toLowerCase()} and the page
            you were on so we can fix it faster.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Topic</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as TicketCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(CATEGORY_LABELS) as TicketCategory[]).map((key) => (
                    <SelectItem key={key} value={key}>
                      {CATEGORY_LABELS[key]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Impact</Label>
              <Select value={severity} onValueChange={(v) => setSeverity(v as typeof severity)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blocking">Blocking my {vocab.locationNoun.toLowerCase()}</SelectItem>
                  <SelectItem value="annoying">Slowing me down</SelectItem>
                  <SelectItem value="nice_to_have">Minor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>What happened?</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What you expected, what you saw, and any booking or client names if relevant…"
              rows={4}
              data-testid="help-description"
            />
          </div>
          <div className="flex items-start gap-2">
            <Checkbox id="consent" checked={consent} onCheckedChange={(c) => setConsent(c === true)} />
            <label htmlFor="consent" className="text-xs text-muted-foreground leading-snug">
              Include recent activity logs for this shop so we can reproduce the issue.
            </label>
          </div>
          <Button className="w-full" onClick={() => void submit()} disabled={sending}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Send message
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
