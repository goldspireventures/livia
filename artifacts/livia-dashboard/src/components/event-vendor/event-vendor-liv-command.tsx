import { Link } from "wouter";
import { useBusiness } from "@/lib/business-context";
import { useTenantExperience } from "@/lib/tenant-experience-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Inbox, Settings, ExternalLink, FileText, ClipboardList } from "lucide-react";
import { OwnerLivOpsPanel } from "@/components/liv/owner-liv-ops-panel";
import { StaleQuotesPanel } from "@/components/event-vendor/quote-workflow-panels";
import { EventPrepTasksPanel } from "@/components/event-vendor/event-prep-tasks-panel";
import { eventVendorLivCommandTitle } from "@workspace/policy";
import { customFetch } from "@workspace/api-client-react";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

type Dash = {
  staleQuotesList?: Array<{
    quoteId: string;
    contactName: string;
    eventType?: string | null;
    daysSinceSent: number;
  }>;
  prepTaskList?: Array<{
    quoteId: string;
    contactName: string;
    eventType?: string | null;
    taskId: string;
    label: string;
    dueDate: string;
    phase: string;
    overdue: boolean;
  }>;
  acceptedAwaitingDeposit?: number;
  bookedEvents?: number;
};

/** Consult-first Liv command — enquiries, quotes, website only (no booking/commerce noise). */
export function EventVendorLivCommandPanel() {
  const { business } = useBusiness();
  const { toast } = useToast();
  const bid = business?.id ?? "";
  const slug = business?.slug ?? "";
  const { data: tenantXp } = useTenantExperience(bid || undefined);
  const starters = tenantXp?.operatorExperience?.livOpsStarters ?? [];
  const [dash, setDash] = useState<Dash | null>(null);

  useEffect(() => {
    if (!bid) return;
    void customFetch<Dash>(`/api/businesses/${bid}/event-vendor/dashboard`)
      .then(setDash)
      .catch(() => setDash(null));
  }, [bid]);

  async function copyPrepNudge(quoteId: string, taskId: string) {
    if (!bid) return;
    try {
      const { whatsappText } = await customFetch<{ whatsappText: string }>(
        `/api/businesses/${bid}/quotes/${quoteId}/event-prep/${taskId}/liv-nudge`,
      );
      await navigator.clipboard.writeText(whatsappText);
      toast({ title: "Prep nudge copied" });
    } catch {
      toast({ title: "Could not load nudge", variant: "destructive" });
    }
  }

  const websiteUrl = slug ? `/e/${slug}` : null;
  const enquireUrl = slug ? `/e/${slug}/enquire` : null;

  return (
    <div className="space-y-4" data-testid="event-vendor-liv-command">
      <Card className="border-primary/25 bg-gradient-to-br from-primary/10 via-transparent to-transparent">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            {eventVendorLivCommandTitle()}
          </CardTitle>
          <CardDescription>
            Draft follow-ups, nudge stale quotes, and keep enquiry replies on-brand — no booking calendar
            required.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button size="sm" asChild>
              <Link href="/inbox">
                <ClipboardList className="h-3.5 w-3.5 mr-1.5" />
                Enquiries & DMs
              </Link>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link href="/quotes">
                <FileText className="h-3.5 w-3.5 mr-1.5" />
                Quotes
              </Link>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link href="/inbox">
                <Inbox className="h-3.5 w-3.5 mr-1.5" />
                Inbox
              </Link>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link href="/settings?tab=liv">
                <Settings className="h-3.5 w-3.5 mr-1.5" />
                Tune Liv
              </Link>
            </Button>
            {websiteUrl ? (
              <Button size="sm" variant="ghost" asChild>
                <a href={websiteUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                  Preview website
                </a>
              </Button>
            ) : null}
          </div>
          {starters.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {starters.map((s) => (
                <span
                  key={s}
                  className="text-xs rounded-full border border-border/80 bg-muted/30 px-2.5 py-1 text-muted-foreground"
                >
                  Try: {s}
                </span>
              ))}
            </div>
          ) : null}
          {enquireUrl ? (
            <p className="text-xs text-muted-foreground">
              Share enquire link:{" "}
              <button
                type="button"
                className="text-primary underline"
                onClick={() => {
                  void navigator.clipboard.writeText(`${window.location.origin}${enquireUrl}`);
                  toast({ title: "Enquire link copied" });
                }}
              >
                {enquireUrl}
              </button>
            </p>
          ) : null}
        </CardContent>
      </Card>

      {dash?.prepTaskList?.length ? (
        <EventPrepTasksPanel
          rows={dash.prepTaskList}
          onCopyNudge={(qid, tid) => void copyPrepNudge(qid, tid)}
        />
      ) : null}

      {dash?.staleQuotesList?.length ? (
        <StaleQuotesPanel rows={dash.staleQuotesList} businessId={bid} />
      ) : null}

      <OwnerLivOpsPanel compact variant="event-vendors" />
    </div>
  );
}
