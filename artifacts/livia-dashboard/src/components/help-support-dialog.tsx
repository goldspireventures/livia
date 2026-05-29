import { useState } from "react";
import { useBusiness } from "@/lib/business-context";
import { verticalPackUi } from "@/lib/vertical-pack-ui";
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

type Props = {
  trigger?: React.ReactNode;
  defaultCategory?: "bug" | "billing" | "liv_error" | "feature" | "other";
  context?: Record<string, unknown>;
};

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
  const [category, setCategory] = useState(defaultCategory);
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
            route: typeof window !== "undefined" ? window.location.pathname : undefined,
            userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
          },
        }),
      });
      toast({
        title: "Message sent",
        description: "We'll respond via email. For emergencies, email support@livia-hq.com",
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
            Help
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" data-testid="help-support-dialog">
        <DialogHeader>
          <DialogTitle>Report an issue</DialogTitle>
          <DialogDescription>
            Something broken, billing unclear, or Liv got it wrong? We attach your {vocab.locationNoun.toLowerCase()}{" "}
            context and route it to the Livia team — often with automation on our side to reproduce and fix faster.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as typeof category)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bug">Bug</SelectItem>
                  <SelectItem value="liv_error">Liv misbehaved</SelectItem>
                  <SelectItem value="billing">Billing</SelectItem>
                  <SelectItem value="feature">Feature idea</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Severity</Label>
              <Select value={severity} onValueChange={(v) => setSeverity(v as typeof severity)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blocking">Blocking my {vocab.locationNoun.toLowerCase()}</SelectItem>
                  <SelectItem value="annoying">Annoying</SelectItem>
                  <SelectItem value="nice_to_have">Nice to have</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>What happened?</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what you expected vs what happened…"
              rows={4}
              data-testid="help-description"
            />
          </div>
          <div className="flex items-start gap-2">
            <Checkbox id="consent" checked={consent} onCheckedChange={(c) => setConsent(c === true)} />
            <label htmlFor="consent" className="text-xs text-muted-foreground leading-snug">
              Allow Livia to review recent logs for this shop to reproduce the issue (recommended).
            </label>
          </div>
          <Button className="w-full" onClick={() => void submit()} disabled={sending}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Submit report
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
