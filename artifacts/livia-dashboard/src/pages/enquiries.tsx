import { useEffect, useMemo, useState } from "react";
import { useBusiness } from "@/lib/business-context";
import { useToast } from "@/hooks/use-toast";
import { customFetch, useListConversations } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PersonaRitualHeader } from "@/components/ritual/persona-ritual-header";
import { PageFrame } from "@/components/ui/page-frame";
import { ClipboardList, Globe, MessageSquare, Trash2 } from "lucide-react";
import { ConsultLeadDecisionPanel } from "@/components/event-vendor/consult-lead-decision";
import { ConsultPipelineTrack } from "@/components/event-vendor/consult-pipeline-track";
import { LivPrescreenBadge } from "@/components/event-vendor/liv-prescreen-badge";
import { QuoteBriefPanel, StaleQuotesPanel } from "@/components/event-vendor/quote-workflow-panels";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InboxConversationPane } from "@/components/inbox/inbox-conversation-pane";
import { SettingsDisclosure } from "@/components/ui/settings-disclosure";
import {
  CONSULT_ENQUIRY_PIPELINE_STEPS,
  CONSULT_INBOX_LENS_LABELS,
  type ConsultInboxLens,
  type ConsultLeadActionId,
  type QuoteBriefHint,
  resolveConsultLeadDecision,
  unifiedConsultInboxSubtitle,
  unifiedConsultInboxTitle,
} from "@workspace/policy";
import { cn } from "@/lib/utils";

type Enquiry = {
  id: string;
  status: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string | null;
  partnerName?: string | null;
  partnerPhone?: string | null;
  plannerName?: string | null;
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
  inspirationUrls?: string[];
  createdAt: string;
};

type MoodItem = {
  id: string;
  imageUrl?: string | null;
  note?: string | null;
  status: string;
};

type DashboardStats = {
  newEnquiries: number;
  lowFitNewEnquiries?: number;
  lowFitList?: Array<{ enquiryId: string; headline: string }>;
  quotedEnquiries: number;
  staleQuotes: number;
  staleQuotesList?: Array<{
    quoteId: string;
    enquiryId?: string | null;
    contactName: string;
    eventType?: string | null;
    subtotalMinor: number;
    daysSinceSent: number;
  }>;
};

type QuoteBrief = {
  suggestedTemplateId: string | null;
  suggestedTemplateName: string | null;
  templates: Array<{ id: string; name: string; eventTypes?: string[] }>;
  prescreen?: {
    tier: "high" | "medium" | "low";
    headline: string;
    guidance: string;
    reasons: string[];
    score: number;
  };
  briefIntelligence: {
    hints: QuoteBriefHint[];
    suggestedMessage: string;
  };
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

function hasClientPartnerInfo(enquiry: Enquiry): boolean {
  return Boolean(
    enquiry.partnerName?.trim() ||
      enquiry.partnerPhone?.trim() ||
      enquiry.plannerName?.trim(),
  );
}

/** Event-vendor unified inbox — structured leads + DM threads in one workspace. */
export default function EventVendorUnifiedInboxPage() {
  const { business } = useBusiness();
  const { toast } = useToast();
  const bid = business?.id ?? "";
  const [rows, setRows] = useState<Enquiry[]>([]);
  const [linkedQuoteId, setLinkedQuoteId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Enquiry | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [notes, setNotes] = useState("");
  const [moodBoard, setMoodBoard] = useState<MoodItem[]>([]);
  const [moodUrl, setMoodUrl] = useState("");
  const [moodNote, setMoodNote] = useState("");
  const [quoteBrief, setQuoteBrief] = useState<QuoteBrief | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [contacts, setContacts] = useState({
    partnerName: "",
    partnerPhone: "",
    plannerName: "",
  });
  const [lens, setLens] = useState<ConsultInboxLens>("all");
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [declineOpen, setDeclineOpen] = useState(false);
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

  const lowFitIds = useMemo(
    () => new Set((stats?.lowFitList ?? []).map((r) => r.enquiryId)),
    [stats?.lowFitList],
  );

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
        customFetch<DashboardStats>(`/api/businesses/${bid}/event-vendor/dashboard`),
      ]);
      setRows(enquiries);
      setStats(dash);
    } catch {
      setRows([]);
    }
  }

  async function loadMoodBoard(enquiryId: string) {
    if (!bid) return;
    try {
      setMoodBoard(await customFetch<MoodItem[]>(`/api/businesses/${bid}/enquiries/${enquiryId}/mood-board`));
    } catch {
      setMoodBoard([]);
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
    setContacts({
      partnerName: selected?.partnerName ?? "",
      partnerPhone: selected?.partnerPhone ?? "",
      plannerName: selected?.plannerName ?? "",
    });
    if (selected?.id) void loadMoodBoard(selected.id);
  }, [selected?.id]);

  useEffect(() => {
    if (!bid || !selected?.id) {
      setLinkedQuoteId(null);
      return;
    }
    void customFetch<Array<{ id: string; enquiryId?: string | null }>>(`/api/businesses/${bid}/quotes`)
      .then((list) => setLinkedQuoteId(list.find((q) => q.enquiryId === selected.id)?.id ?? null))
      .catch(() => setLinkedQuoteId(null));
  }, [bid, selected?.id]);

  useEffect(() => {
    if (!bid || !selected?.id) {
      setQuoteBrief(null);
      setSelectedTemplateId(null);
      return;
    }
    void customFetch<QuoteBrief>(`/api/businesses/${bid}/enquiries/${selected.id}/quote-brief`)
      .then((brief) => {
        setQuoteBrief(brief);
        setSelectedTemplateId(brief.suggestedTemplateId);
      })
      .catch(() => setQuoteBrief(null));
  }, [bid, selected?.id]);

  async function generateQuote(): Promise<string | null> {
    if (!bid || !selected) return null;
    try {
      const quote = await customFetch<{ id: string; reusedExisting?: boolean }>(
        `/api/businesses/${bid}/enquiries/${selected.id}/quotes`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ templateId: selectedTemplateId ?? undefined }),
        },
      );
      setLinkedQuoteId(quote.id);
      toast({
        title: quote.reusedExisting ? "Opened existing draft" : "Draft quote ready",
        description: "Review line items and send when you're happy.",
      });
      return quote.id;
    } catch {
      toast({ title: "Could not generate quote", variant: "destructive" });
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
        if (quoteId) {
          window.location.href = `/quotes?id=${quoteId}`;
        }
        return;
      }
      if (action === "open_quote" && linkedQuoteId) {
        window.location.href = `/quotes?id=${linkedQuoteId}`;
        return;
      }
      if (action === "mark_booked") {
        await setStatus("booked");
        toast({ title: "Marked booked", description: "Event secured on your pipeline." });
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
      toast({
        title: "WhatsApp message copied",
        description: "Paste into WhatsApp — Liv drafted the opener for you.",
      });
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
      `/api/businesses/${bid}/enquiries/${selected.id}/decline-draft`,
    )
      .then(setDeclinePreview)
      .catch(() => setDeclinePreview(null));
  }, [declineOpen, bid, selected?.id]);

  async function confirmDecline() {
    if (!bid || !selected) return;
    setLeadBusy(true);
    try {
      const result = await customFetch<{
        ok: boolean;
        whatsappText?: string;
        emailStatus?: string;
      }>(`/api/businesses/${bid}/enquiries/${selected.id}/decline-with-liv`, { method: "POST" });
      if (!result.ok) {
        toast({
          title: "Could not close enquiry",
          description: "Liv could not send the decline message. Try again or edit your template in settings.",
          variant: "destructive",
        });
        return;
      }
      setDeclineOpen(false);
      await load();
      const emailed = result.emailStatus === "sent";
      toast({
        title: emailed ? "Liv replied and closed the case" : "Case closed",
        description: emailed
          ? `${selected.contactName} received your polite decline — you can focus on real opportunities.`
          : "Copy the WhatsApp draft if they prefer that channel.",
      });
      if (!emailed && result.whatsappText) {
        try {
          await navigator.clipboard.writeText(result.whatsappText);
        } catch {
          /* clipboard optional */
        }
      }
      setSelected(null);
    } catch {
      toast({
        title: "Could not send Liv reply",
        description: "The client must hear back before we close the enquiry.",
        variant: "destructive",
      });
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
        body: JSON.stringify({
          internalNotes: notes,
          partnerName: contacts.partnerName || null,
          partnerPhone: contacts.partnerPhone || null,
          plannerName: contacts.plannerName || null,
        }),
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

  async function addMoodItem() {
    if (!bid || !selected || !moodUrl) return;
    try {
      await customFetch(`/api/businesses/${bid}/enquiries/${selected.id}/mood-board`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: moodUrl, note: moodNote || undefined }),
      });
      setMoodUrl("");
      setMoodNote("");
      void loadMoodBoard(selected.id);
    } catch {
      toast({ title: "Could not add mood board item", variant: "destructive" });
    }
  }

  async function removeMoodItem(itemId: string) {
    if (!bid || !selected) return;
    try {
      await customFetch(`/api/businesses/${bid}/mood-board/${itemId}`, { method: "DELETE" });
      void loadMoodBoard(selected.id);
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  }

  const publicSiteUrl = business?.slug ? `${window.location.origin}/e/${business.slug}` : "";
  const enquireUrl = business?.slug ? `${window.location.origin}/e/${business.slug}/enquire` : "";
  const leadDecision = selected
    ? resolveConsultLeadDecision(selected.status, { hasLinkedQuote: !!linkedQuoteId })
    : null;

  return (
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

      {stats ? (
        <div className="grid gap-3 sm:grid-cols-3" data-testid="event-vendor-dashboard-stats">
          <div className="rounded-lg border p-3">
            <p className="text-sm text-muted-foreground">New</p>
            <p className="text-2xl font-semibold">{stats.newEnquiries}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-sm text-muted-foreground">Quoted</p>
            <p className="text-2xl font-semibold">{stats.quotedEnquiries}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-sm text-muted-foreground">Follow up</p>
            <p className="text-2xl font-semibold">{stats.staleQuotes}</p>
            <p className="text-xs text-muted-foreground">Quotes sent 5+ days ago</p>
          </div>
        </div>
      ) : null}

      {stats?.staleQuotesList?.length ? (
        <StaleQuotesPanel rows={stats.staleQuotesList} businessId={bid} />
      ) : null}

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
                className={`w-full rounded-lg border bg-card/80 p-3 text-left transition-colors hover:bg-muted/30 ${selected?.id === item.enquiry.id ? "border-primary ring-1 ring-primary/30 bg-muted/20" : ""}`}
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
                      {item.enquiry.status}
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
                className={`w-full rounded-lg border bg-card/80 p-3 text-left transition-colors hover:bg-muted/30 ${selectedThreadId === item.thread.id ? "border-primary ring-1 ring-primary/30 bg-muted/20" : ""}`}
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
              {lens === "messages"
                ? "No DM threads yet."
                : "No leads yet. Share your enquire link."}
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
              <div className="border-b bg-muted/20 px-4 py-3 space-y-3 shrink-0">
                <ConsultPipelineTrack steps={CONSULT_ENQUIRY_PIPELINE_STEPS} current={selected.status} />
                <div>
                  <h2 className="font-semibold">{selected.contactName}</h2>
                  <p className="text-xs text-muted-foreground">
                    {selected.eventType ?? "Event"}
                    {selected.eventDate ? ` · ${selected.eventDate}` : ""}
                    {selected.eventDateFlexible ? " · flexible date" : ""}
                    {selected.guestCount ? ` · ${selected.guestCount} guests` : ""}
                  </p>
                </div>
              </div>

              <div className="p-4 space-y-4 flex-1 overflow-y-auto min-w-0">
              {quoteBrief?.prescreen && selected.status === "new" ? (
                <LivPrescreenBadge prescreen={quoteBrief.prescreen} />
              ) : null}
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
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => void copyWhatsAppAssist()}
                  data-testid="consult-whatsapp-copy"
                >
                  <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
                  Copy WhatsApp message
                </Button>
              ) : null}

              {quoteBrief ? (
                <QuoteBriefPanel
                  hints={quoteBrief.briefIntelligence.hints}
                  suggestedTemplateName={quoteBrief.suggestedTemplateName}
                  suggestedMessage={quoteBrief.briefIntelligence.suggestedMessage}
                />
              ) : null}

              {quoteBrief && quoteBrief.templates.length > 0 && !linkedQuoteId ? (
                <div className="space-y-1">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Quote template</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                    value={selectedTemplateId ?? ""}
                    onChange={(e) => setSelectedTemplateId(e.target.value || null)}
                  >
                    <option value="">Auto-match from event type</option>
                    {quoteBrief.templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
                <div
                  className="rounded-lg border bg-muted/20 p-3 space-y-3 text-sm"
                  data-testid="inbox-lead-brief"
                >
                  <p className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground">
                    Enquiry details
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
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Budget guide</dt>
                      <dd>{selected.budgetRange ?? "—"}</dd>
                    </div>
                    <div className="space-y-0.5">
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Venue</dt>
                      <dd>{selected.venue ?? "—"}</dd>
                    </div>
                    <div className="space-y-0.5">
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Send quote via</dt>
                      <dd className="capitalize">{selected.preferredQuoteChannel ?? "email"}</dd>
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
                    {selected.partnerPhone?.trim() ? (
                      <div className="space-y-0.5">
                        <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Partner phone</dt>
                        <dd>{selected.partnerPhone}</dd>
                      </div>
                    ) : null}
                    {selected.plannerName?.trim() ? (
                      <div className="space-y-0.5">
                        <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Planner / coordinator</dt>
                        <dd>{selected.plannerName}</dd>
                      </div>
                    ) : null}
                  </dl>
                </div>

              <SettingsDisclosure
                key={selected.id}
                title="Partner / coordinator"
                defaultOpen={hasClientPartnerInfo(selected)}
                data-testid="inbox-partner-contacts"
              >
                <div className="grid gap-2 sm:grid-cols-2 pt-3">
                  <div className="space-y-1">
                    <Label>Partner name</Label>
                    <Input
                      value={contacts.partnerName}
                      onChange={(e) => setContacts({ ...contacts, partnerName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Partner phone</Label>
                    <Input
                      value={contacts.partnerPhone}
                      onChange={(e) => setContacts({ ...contacts, partnerPhone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label>Planner / coordinator</Label>
                    <Input
                      value={contacts.plannerName}
                      onChange={(e) => setContacts({ ...contacts, plannerName: e.target.value })}
                    />
                  </div>
                </div>
              </SettingsDisclosure>

              <SettingsDisclosure title="Mood board & inspiration" defaultOpen={moodBoard.length > 0}>
                <div className="space-y-2 pt-3">
                  <div className="flex flex-wrap gap-2">
                    <Input
                      className="flex-1 min-w-[140px]"
                      placeholder="Image URL"
                      value={moodUrl}
                      onChange={(e) => setMoodUrl(e.target.value)}
                    />
                    <Input
                      className="flex-1 min-w-[120px]"
                      placeholder="Note"
                      value={moodNote}
                      onChange={(e) => setMoodNote(e.target.value)}
                    />
                    <Button type="button" size="sm" onClick={() => void addMoodItem()}>
                      Add
                    </Button>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {moodBoard.map((item) => (
                      <div key={item.id} className="relative rounded border p-2">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt="" className="aspect-video w-full rounded object-cover" />
                        ) : null}
                        {item.note ? <p className="text-xs mt-1">{item.note}</p> : null}
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="absolute top-1 right-1 h-7 w-7"
                          onClick={() => void removeMoodItem(item.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </SettingsDisclosure>

              <div className="space-y-2 pt-2 border-t">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Internal notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Only you see this — venue quirks, competitor quotes, etc."
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
              Select a lead or DM thread to review and reply.
            </p>
          )}
        </section>
      </div>

      {enquireUrl ? (
        <p className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="inline-flex items-center gap-1">
            <Globe className="h-3 w-3" />
            Enquire link: {enquireUrl}
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
            <DialogTitle>Not a fit — Liv will reply first</DialogTitle>
            <DialogDescription>
              {selected
                ? `Liv sends your decline message to ${selected.contactName} before closing. You only spend time on enquiries with real potential.`
                : "Liv sends your decline template, then closes the enquiry."}
            </DialogDescription>
          </DialogHeader>
          {declinePreview ? (
            <pre className="max-h-48 overflow-y-auto rounded-md border bg-muted/40 p-3 text-xs whitespace-pre-wrap text-muted-foreground">
              {declinePreview.body}
            </pre>
          ) : (
            <p className="text-xs text-muted-foreground">Loading Liv draft…</p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeclineOpen(false)} disabled={leadBusy}>
              Keep open
            </Button>
            <Button type="button" variant="destructive" onClick={() => void confirmDecline()} disabled={leadBusy}>
              Liv sends &amp; closes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageFrame>
  );
}
