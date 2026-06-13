import { useEffect, useMemo, useState } from "react";
import { useBusiness } from "@/lib/business-context";
import { useToast } from "@/hooks/use-toast";
import { customFetch, useListConversations } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PersonaRitualHeader } from "@/components/ritual/persona-ritual-header";
import { PageFrame } from "@/components/ui/page-frame";
import { ClipboardList, Globe, MessageSquare } from "lucide-react";
import { ConsultLeadDecisionPanel } from "@/components/event-vendor/consult-lead-decision";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InboxConversationPane } from "@/components/inbox/inbox-conversation-pane";
import {
  CONSULT_INBOX_LENS_LABELS,
  ENQUIRY_DECLINE_REASONS,
  type ConsultInboxLens,
  type ConsultLeadActionId,
  type EnquiryDeclineReasonId,
  consultEnquiryStatusLabel,
  consultQuotesHref,
  resolveConsultLeadDecision,
  unifiedConsultInboxSubtitle,
  unifiedConsultInboxTitle,
} from "@workspace/policy";
import { cn } from "@/lib/utils";
import { FeatureUnlockGate } from "@/components/billing/feature-unlock-panel";

type Enquiry = {
  id: string;
  status: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string | null;
  partnerName?: string | null;
  partnerPhone?: string | null;
  plannerName?: string | null;
  plannerEmail?: string | null;
  plannerPhone?: string | null;
  eventType?: string | null;
  eventDate?: string | null;
  eventDateFlexible?: boolean | null;
  guestCount?: number | null;
  budgetRange?: string | null;
  theme?: string | null;
  venue?: string | null;
  preferredQuoteChannel?: string | null;
  notes?: string | null;
  internalNotes?: string | null;
  createdAt: string;
};

type DashboardStats = {
  lowFitList?: Array<{ enquiryId: string; headline: string }>;
};

type ThreadRow = {
  id: string;
  channel: string;
  status: string;
  customerName: string | null;
  lastMessage: string | null;
  lastMessageAt: string;
  aiHandled: boolean;
};

type UnifiedListItem =
  | { kind: "lead"; id: string; at: string; enquiry: Enquiry }
  | { kind: "thread"; id: string; at: string; thread: ThreadRow };

const LENSES: ConsultInboxLens[] = ["all", "leads", "messages"];

/** Event-vendor inbox — leads + DMs only. Quote work lives on /quotes. */
export default function EventVendorUnifiedInboxPage() {
  const { business } = useBusiness();
  const { toast } = useToast();
  const bid = business?.id ?? "";
  const [rows, setRows] = useState<Enquiry[]>([]);
  const [linkedQuoteId, setLinkedQuoteId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Enquiry | null>(null);
  const [lowFitIds, setLowFitIds] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState("");
  const [lens, setLens] = useState<ConsultInboxLens>("all");
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [declineOpen, setDeclineOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState<EnquiryDeclineReasonId>("calendar_full");
  const [declinePreview, setDeclinePreview] = useState<{ body: string; subject: string } | null>(null);
  const [leadBusy, setLeadBusy] = useState(false);

  const { data: convos, isLoading: loadingThreads } = useListConversations(
    bid,
    {},
    { query: { enabled: !!bid, refetchInterval: 10_000 } as never },
  );
  const threads = (convos ?? []) as unknown as ThreadRow[];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const leadId = params.get("lead") ?? params.get("id");
    const conversationId = params.get("conversation") ?? params.get("conversationId");
    const lensParam = params.get("lens");
    if (lensParam === "leads" || lensParam === "messages" || lensParam === "all") {
      setLens(lensParam);
    }
    if (conversationId) {
      setSelectedThreadId(conversationId);
      setSelected(null);
      return;
    }
    if (leadId) {
      const match = rows.find((r) => r.id === leadId);
      if (match) {
        setSelected(match);
        setSelectedThreadId(null);
      }
    }
  }, [bid, rows]);

  const unifiedList = useMemo((): UnifiedListItem[] => {
    const leadItems: UnifiedListItem[] = rows.map((enquiry) => ({
      kind: "lead",
      id: `lead-${enquiry.id}`,
      at: enquiry.createdAt,
      enquiry,
    }));
    const threadItems: UnifiedListItem[] = threads
      .filter((t) => t.status !== "CLOSED")
      .map((thread) => ({
        kind: "thread",
        id: `thread-${thread.id}`,
        at: thread.lastMessageAt,
        thread,
      }));
    const merged = [...leadItems, ...threadItems].sort(
      (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
    );
    if (lens === "leads") return leadItems.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
    if (lens === "messages") return threadItems.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
    return merged;
  }, [rows, threads, lens]);

  function selectLead(enquiry: Enquiry) {
    setSelected(enquiry);
    setSelectedThreadId(null);
  }

  function selectThread(threadId: string) {
    setSelectedThreadId(threadId);
    setSelected(null);
  }

  async function load() {
    if (!bid) return;
    try {
      const [enquiries, dash] = await Promise.all([
        customFetch<Enquiry[]>(`/api/businesses/${bid}/enquiries`),
        customFetch<DashboardStats>(`/api/businesses/${bid}/event-vendor/dashboard`).catch(() => null),
      ]);
      setRows(enquiries);
      setLowFitIds(new Set((dash?.lowFitList ?? []).map((r) => r.enquiryId)));
    } catch {
      setRows([]);
    }
  }

  useEffect(() => {
    if (!bid) return;
    void load();
    const timer = window.setInterval(() => void load(), 10_000);
    return () => window.clearInterval(timer);
  }, [bid]);

  useEffect(() => {
    setNotes(selected?.internalNotes ?? "");
  }, [selected?.id, selected?.internalNotes]);

  useEffect(() => {
    if (!bid || !selected?.id) {
      setLinkedQuoteId(null);
      return;
    }
    void customFetch<Array<{ id: string; enquiryId?: string | null }>>(`/api/businesses/${bid}/quotes`)
      .then((list) => setLinkedQuoteId(list.find((q) => q.enquiryId === selected.id)?.id ?? null))
      .catch(() => setLinkedQuoteId(null));
  }, [bid, selected?.id]);

  async function generateQuote(): Promise<string | null> {
    if (!bid || !selected) return null;
    try {
      const quote = await customFetch<{ id: string; reusedExisting?: boolean }>(
        `/api/businesses/${bid}/enquiries/${selected.id}/quotes`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) },
      );
      setLinkedQuoteId(quote.id);
      return quote.id;
    } catch {
      toast({ title: "Could not open quote", variant: "destructive" });
      return null;
    }
  }

  async function handleLeadAction(action: ConsultLeadActionId) {
    if (!bid || !selected) return;
    if (action === "decline") {
      setDeclineOpen(true);
      return;
    }
    setLeadBusy(true);
    try {
      if (action === "draft_quote") {
        const quoteId = linkedQuoteId ?? (await generateQuote());
        if (quoteId) window.location.href = consultQuotesHref(quoteId);
        return;
      }
      if (action === "open_quote" && linkedQuoteId) {
        window.location.href = consultQuotesHref(linkedQuoteId);
        return;
      }
      if (action === "mark_booked") {
        await setStatus("booked");
        toast({ title: "Marked booked" });
      }
    } finally {
      setLeadBusy(false);
    }
  }

  async function copyWhatsAppAssist() {
    if (!bid || !selected) return;
    try {
      const path = linkedQuoteId
        ? `/api/businesses/${bid}/quotes/${linkedQuoteId}/liv-draft`
        : `/api/businesses/${bid}/enquiries/${selected.id}/liv-draft`;
      const { whatsappText } = await customFetch<{ whatsappText: string }>(path);
      await navigator.clipboard.writeText(whatsappText);
      toast({ title: "WhatsApp message copied" });
    } catch {
      toast({ title: "Could not copy message", variant: "destructive" });
    }
  }

  useEffect(() => {
    if (!declineOpen || !bid || !selected?.id) {
      setDeclinePreview(null);
      return;
    }
    void customFetch<{ body: string; subject: string }>(
      `/api/businesses/${bid}/enquiries/${selected.id}/decline-draft?reason=${encodeURIComponent(declineReason)}`,
    )
      .then(setDeclinePreview)
      .catch(() => setDeclinePreview(null));
  }, [declineOpen, bid, selected?.id, declineReason]);

  async function confirmDecline() {
    if (!bid || !selected) return;
    setLeadBusy(true);
    try {
      const result = await customFetch<{
        ok: boolean;
        whatsappText?: string;
        emailStatus?: string;
      }>(`/api/businesses/${bid}/enquiries/${selected.id}/decline-with-liv`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reasonId: declineReason }),
      });
      if (!result.ok) {
        toast({ title: "Could not decline", variant: "destructive" });
        return;
      }
      setDeclineOpen(false);
      await load();
      toast({ title: result.emailStatus === "sent" ? "Declined and replied" : "Enquiry closed" });
      if (result.emailStatus !== "sent" && result.whatsappText) {
        try {
          await navigator.clipboard.writeText(result.whatsappText);
        } catch {
          /* optional */
        }
      }
      setSelected(null);
    } catch {
      toast({ title: "Could not decline", variant: "destructive" });
    } finally {
      setLeadBusy(false);
    }
  }

  async function saveNotes() {
    if (!bid || !selected) return;
    try {
      await customFetch(`/api/businesses/${bid}/enquiries/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ internalNotes: notes }),
      });
      toast({ title: "Saved" });
      void load();
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    }
  }

  async function setStatus(status: string) {
    if (!bid || !selected) return;
    try {
      await customFetch(`/api/businesses/${bid}/enquiries/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      void load();
    } catch {
      toast({ title: "Update failed", variant: "destructive" });
    }
  }

  const enquireUrl = business?.slug ? `${window.location.origin}/e/${business.slug}/enquire` : "";
  const publicSiteUrl = business?.slug ? `${window.location.origin}/e/${business.slug}` : "";
  const leadDecision = selected
    ? resolveConsultLeadDecision(selected.status, { hasLinkedQuote: !!linkedQuoteId })
    : null;

  return (
    <FeatureUnlockGate featureId="consult_first_inbox">
    <PageFrame width="lg" className="space-y-4" data-testid="event-vendor-unified-inbox">
      <PersonaRitualHeader
        variant="page"
        title={unifiedConsultInboxTitle()}
        subtitle={unifiedConsultInboxSubtitle()}
      />

      <div
        className="flex flex-wrap gap-1 rounded-lg border bg-muted/40 p-1"
        data-testid="consult-inbox-lenses"
      >
        {LENSES.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setLens(key)}
            className={cn(
              "text-xs px-3 py-1.5 rounded-md transition-colors",
              lens === key
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {CONSULT_INBOX_LENS_LABELS[key].short}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2 min-h-[min(720px,70vh)]">
        <section className="space-y-2 overflow-y-auto max-h-[min(720px,70vh)]">
          <h2 className="text-sm font-medium text-muted-foreground sticky top-0 bg-background/95 py-1 z-10">
            {CONSULT_INBOX_LENS_LABELS[lens].description}
          </h2>
          {loadingThreads && lens !== "leads" ? (
            <p className="text-xs text-muted-foreground px-1">Loading threads…</p>
          ) : null}
          {unifiedList.map((item) =>
            item.kind === "lead" ? (
              <button
                key={item.id}
                type="button"
                onClick={() => selectLead(item.enquiry)}
                className={cn(
                  "w-full rounded-lg border bg-card/80 p-3 text-left transition-colors hover:bg-muted/30",
                  selected?.id === item.enquiry.id && "border-primary ring-1 ring-primary/30 bg-muted/20",
                )}
                data-testid={`inbox-lead-${item.enquiry.id}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium flex items-center gap-1.5">
                    <ClipboardList className="h-3.5 w-3.5 text-primary shrink-0" />
                    {item.enquiry.contactName}
                  </span>
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="text-[9px] uppercase">
                      Lead
                    </Badge>
                    <Badge variant="secondary" className="text-[10px]">
                      {consultEnquiryStatusLabel(item.enquiry.status)}
                    </Badge>
                    {item.enquiry.status === "new" && lowFitIds.has(item.enquiry.id) ? (
                      <Badge variant="outline" className="text-[9px] text-muted-foreground">
                        Low fit
                      </Badge>
                    ) : null}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {item.enquiry.eventType ?? "Event"} · {item.enquiry.eventDate ?? "Date TBC"} ·{" "}
                  {item.enquiry.guestCount ?? "?"} guests
                </p>
              </button>
            ) : (
              <button
                key={item.id}
                type="button"
                onClick={() => selectThread(item.thread.id)}
                className={cn(
                  "w-full rounded-lg border bg-card/80 p-3 text-left transition-colors hover:bg-muted/30",
                  selectedThreadId === item.thread.id && "border-primary ring-1 ring-primary/30 bg-muted/20",
                )}
                data-testid={`inbox-thread-${item.thread.id}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium flex items-center gap-1.5 truncate">
                    {item.thread.channel === "WEB" ? (
                      <Globe className="h-3.5 w-3.5 shrink-0" />
                    ) : (
                      <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                    )}
                    {item.thread.customerName ?? "Unknown contact"}
                  </span>
                  <Badge variant="outline" className="text-[9px] uppercase shrink-0">
                    DM
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {item.thread.lastMessage ?? "No messages yet"}
                </p>
              </button>
            ),
          )}
          {unifiedList.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {lens === "messages" ? "No DM threads yet." : "No leads yet. Share your enquire link."}
            </p>
          ) : null}
        </section>

        <section className="rounded-xl border bg-card shadow-sm overflow-hidden min-w-0 min-h-[420px] flex flex-col">
          {selectedThreadId && bid ? (
            <div className="p-4 flex-1 min-h-0 flex flex-col">
              <InboxConversationPane businessId={bid} conversationId={selectedThreadId} />
            </div>
          ) : selected ? (
            <>
              <div className="border-b px-4 py-3 shrink-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold">{selected.contactName}</h2>
                  <Badge variant="secondary" className="text-[10px]">
                    {consultEnquiryStatusLabel(selected.status)}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {selected.eventType ?? "Event"}
                  {selected.eventDate ? ` · ${selected.eventDate}` : ""}
                  {selected.eventDateFlexible ? " · flexible date" : ""}
                  {selected.guestCount ? ` · ${selected.guestCount} guests` : ""}
                </p>
              </div>

              <div className="p-4 space-y-4 flex-1 overflow-y-auto min-w-0">
                {leadDecision ? (
                  <ConsultLeadDecisionPanel
                    decision={leadDecision}
                    busy={leadBusy}
                    onAction={(action) => void handleLeadAction(action)}
                  />
                ) : null}

                {selected.status !== "lost" && selected.status !== "booked" ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-8 text-xs text-muted-foreground"
                    onClick={() => void copyWhatsAppAssist()}
                    data-testid="consult-whatsapp-copy"
                  >
                    <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
                    Copy WhatsApp reply
                  </Button>
                ) : null}

                <div
                  className="rounded-lg border bg-muted/20 p-3 space-y-3 text-sm"
                  data-testid="inbox-lead-brief"
                >
                  <p className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground">
                    Enquiry
                  </p>
                  <dl className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-0.5 sm:col-span-2">
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Email</dt>
                      <dd className="break-all">{selected.contactEmail}</dd>
                    </div>
                    {selected.contactPhone ? (
                      <div className="space-y-0.5">
                        <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Phone</dt>
                        <dd>{selected.contactPhone}</dd>
                      </div>
                    ) : null}
                    <div className="space-y-0.5">
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Event</dt>
                      <dd>
                        {selected.eventType ?? "—"}
                        {selected.eventDate ? ` · ${selected.eventDate}` : ""}
                        {selected.eventDateFlexible ? " (flexible)" : ""}
                        {selected.guestCount ? ` · ${selected.guestCount} guests` : ""}
                      </dd>
                    </div>
                    <div className="space-y-0.5">
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Theme</dt>
                      <dd>{selected.theme ?? "—"}</dd>
                    </div>
                    <div className="space-y-0.5">
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Budget</dt>
                      <dd>{selected.budgetRange ?? "—"}</dd>
                    </div>
                    <div className="space-y-0.5">
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Venue</dt>
                      <dd>{selected.venue ?? "—"}</dd>
                    </div>
                    {selected.notes ? (
                      <div className="space-y-0.5 sm:col-span-2">
                        <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Client notes</dt>
                        <dd className="whitespace-pre-wrap">{selected.notes}</dd>
                      </div>
                    ) : null}
                    {selected.partnerName?.trim() ? (
                      <div className="space-y-0.5">
                        <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Partner</dt>
                        <dd>{selected.partnerName}</dd>
                      </div>
                    ) : null}
                    {selected.plannerName?.trim() ? (
                      <div className="space-y-0.5">
                        <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Planner</dt>
                        <dd>{selected.plannerName}</dd>
                      </div>
                    ) : null}
                  </dl>
                </div>

                <div className="space-y-2 pt-2 border-t">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Internal notes</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Only you see this"
                    rows={2}
                  />
                  <Button type="button" size="sm" variant="outline" onClick={() => void saveNotes()}>
                    Save notes
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground m-auto text-center py-12 px-4">
              Select a lead or DM thread.
            </p>
          )}
        </section>
      </div>

      {enquireUrl ? (
        <p className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="inline-flex items-center gap-1">
            <Globe className="h-3 w-3" />
            Enquire: {enquireUrl}
          </span>
          {publicSiteUrl ? (
            <span className="inline-flex items-center gap-1">
              <ClipboardList className="h-3 w-3" />
              Site: {publicSiteUrl}
            </span>
          ) : null}
        </p>
      ) : null}

      <Dialog open={declineOpen} onOpenChange={setDeclineOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline enquiry</DialogTitle>
            <DialogDescription>
              {selected
                ? `Send your decline message to ${selected.contactName}, then close the enquiry.`
                : "Send decline and close."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Reason</Label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value as EnquiryDeclineReasonId)}
              data-testid="decline-reason-select"
            >
              {ENQUIRY_DECLINE_REASONS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          {declinePreview ? (
            <pre className="max-h-48 overflow-y-auto rounded-md border bg-muted/40 p-3 text-xs whitespace-pre-wrap text-muted-foreground">
              {declinePreview.body}
            </pre>
          ) : (
            <p className="text-xs text-muted-foreground">Loading draft…</p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeclineOpen(false)} disabled={leadBusy}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={() => void confirmDecline()} disabled={leadBusy}>
              Decline &amp; send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageFrame>
    </FeatureUnlockGate>
  );
}
