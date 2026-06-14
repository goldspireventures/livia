import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { useBusiness } from "@/lib/business-context";
import { useToast } from "@/hooks/use-toast";
import { customFetch } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PersonaRitualHeader } from "@/components/ritual/persona-ritual-header";
import { PageFrame } from "@/components/ui/page-frame";
import { ConsultPipelineTrack } from "@/components/event-vendor/consult-pipeline-track";
import { QuoteBillToPanel } from "@/components/event-vendor/quote-bill-to-panel";
import { QuoteLineItemsEditor } from "@/components/event-vendor/quote-line-items-editor";
import { QuoteSendReviewDialog } from "@/components/event-vendor/quote-send-review-dialog";
import { QuoteSentNextSteps } from "@/components/event-vendor/quote-sent-next-steps";
import { QuoteBriefPanel } from "@/components/event-vendor/quote-workflow-panels";
import { EventPrepTimelinePanel, type PrepView } from "@/components/event-vendor/event-prep-timeline-panel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  QUOTE_STATUSES,
  eur,
  groupQuotesByEnquiry,
  quoteBillToName,
  quotePipelineCurrent,
  type EventDaySheet,
} from "@/lib/event-vendor-studio";
import { Plus, Send, Trash2 } from "lucide-react";
import { STALE_QUOTE_DAYS, studioQuoteListLabel, studioQuoteDetailTitle, resolveQuoteExitActions, CLIENT_WITHDRAW_REASONS, type QuoteBriefHint, type ClientWithdrawReasonId } from "@workspace/policy";
import { FeatureUnlockGate } from "@/components/billing/feature-unlock-panel";

type Milestone = { label: string; percent: number; amountMinor: number; dueDate?: string };

type QuoteLine = {
  id: string;
  name: string;
  quantity: string;
  unit: string;
  unitPriceMinor: number;
  lineTotalMinor: number;
};

type EnquirySummary = {
  id: string;
  contactName: string;
  contactEmail?: string | null;
  eventType?: string | null;
  eventDate?: string | null;
  status: string;
};

type Quote = {
  id: string;
  enquiryId?: string | null;
  customerId?: string | null;
  status: string;
  publicToken: string;
  personalMessage?: string | null;
  depositPercent: number;
  subtotalMinor: number;
  depositAmountMinor: number;
  depositPaidMinor: number;
  balanceDueMinor: number;
  validUntil?: string | null;
  sentAt?: string | null;
  lines: QuoteLine[];
  milestoneDeposits: Milestone[];
  eventDaySheet?: EventDaySheet | null;
  enquiry?: EnquirySummary | null;
  customer?: {
    displayName?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
  } | null;
};

type QuoteBrief = {
  suggestedTemplateName: string | null;
  briefIntelligence: {
    hints: QuoteBriefHint[];
    suggestedMessage: string;
  };
};

function normalizeQuote(raw: Partial<Quote> & { id: string }): Quote {
  const sheet = raw.eventDaySheet;
  const eventDaySheet =
    sheet == null
      ? null
      : {
          ...sheet,
          setupChecklist: Array.isArray(sheet.setupChecklist) ? sheet.setupChecklist : [],
        };
  return {
    id: raw.id,
    enquiryId: raw.enquiryId,
    customerId: raw.customerId,
    status: raw.status ?? "draft",
    publicToken: raw.publicToken ?? "",
    personalMessage: raw.personalMessage,
    depositPercent: raw.depositPercent ?? 30,
    subtotalMinor: raw.subtotalMinor ?? 0,
    depositAmountMinor: raw.depositAmountMinor ?? 0,
    depositPaidMinor: raw.depositPaidMinor ?? 0,
    balanceDueMinor: raw.balanceDueMinor ?? 0,
    validUntil: raw.validUntil,
    sentAt: raw.sentAt,
    lines: Array.isArray(raw.lines) ? raw.lines : [],
    milestoneDeposits: Array.isArray(raw.milestoneDeposits) ? raw.milestoneDeposits : [],
    eventDaySheet,
    enquiry: raw.enquiry ?? null,
    customer: raw.customer ?? null,
  };
}

export default function QuotesPage() {
  const { business } = useBusiness();
  const { toast } = useToast();
  const bid = business?.id ?? "";
  const [rows, setRows] = useState<Quote[]>([]);
  const [selected, setSelected] = useState<Quote | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createEnquiryId, setCreateEnquiryId] = useState<string>("__blank__");
  const [createCustomerId, setCreateCustomerId] = useState<string>("__none__");
  const [sendReviewOpen, setSendReviewOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [prepView, setPrepView] = useState<PrepView | null>(null);
  const [prepLoading, setPrepLoading] = useState(false);
  const [customers, setCustomers] = useState<
    Array<{ id: string; displayName?: string | null; firstName?: string | null; lastName?: string | null; email?: string | null }>
  >([]);
  const [catalogue, setCatalogue] = useState<
    Array<{ id: string; name: string; priceMinor: number; quoteUnit?: string | null }>
  >([]);
  const [enquiries, setEnquiries] = useState<EnquirySummary[]>([]);
  const [quoteBrief, setQuoteBrief] = useState<QuoteBrief | null>(null);
  const [withdrewOpen, setWithdrewOpen] = useState(false);
  const [withdrewReason, setWithdrewReason] = useState<ClientWithdrawReasonId>("unknown");

  const params = new URLSearchParams(window.location.search);
  const highlightId = params.get("id");

  async function load() {
    if (!bid) return;
    try {
      const list = await customFetch<Array<Omit<Quote, "lines">>>(`/api/businesses/${bid}/quotes`);
      const results = await Promise.allSettled(
        list.map((q) => customFetch<Quote>(`/api/businesses/${bid}/quotes/${q.id}`)),
      );
      const full = results
        .filter((r): r is PromiseFulfilledResult<Quote> => r.status === "fulfilled")
        .map((r) => normalizeQuote(r.value));
      setRows(full);
      setSelected((prev) => {
        const keepId = highlightId ?? prev?.id;
        if (!keepId) return prev;
        return full.find((q) => q.id === keepId) ?? prev;
      });
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
    if (!bid || !selected) {
      setPrepView(null);
      return;
    }
    const secured =
      selected.depositPaidMinor >= selected.depositAmountMinor && selected.depositAmountMinor > 0;
    const pipeline = quotePipelineCurrent(selected);
    if (pipeline !== "booked" && selected.status !== "accepted" && !secured) {
      setPrepView(null);
      return;
    }
    setPrepLoading(true);
    void customFetch<typeof prepView>(`/api/businesses/${bid}/quotes/${selected.id}/event-prep`)
      .then((v) => setPrepView(v))
      .catch(() => setPrepView(null))
      .finally(() => setPrepLoading(false));
  }, [bid, selected?.id, selected?.status, selected?.depositPaidMinor, selected?.depositAmountMinor]);

  useEffect(() => {
    if (!bid || !selected?.enquiryId || selected.status !== "draft") {
      setQuoteBrief(null);
      return;
    }
    void customFetch<QuoteBrief>(`/api/businesses/${bid}/enquiries/${selected.enquiryId}/quote-brief`)
      .then((b) => setQuoteBrief(b))
      .catch(() => setQuoteBrief(null));
  }, [bid, selected?.enquiryId, selected?.status]);

  useEffect(() => {
    if (!bid) return;
    void Promise.all([
      customFetch<Array<{ id: string; name: string; priceMinor: number; quoteUnit?: string | null }>>(
        `/api/businesses/${bid}/services`,
      ).catch(() => []),
      customFetch<EnquirySummary[]>(`/api/businesses/${bid}/enquiries`).catch(() => []),
      customFetch<{ data: typeof customers }>(`/api/businesses/${bid}/customers?limit=100`).catch(() => ({
        data: [],
      })),
    ]).then(([services, enq, custRes]) => {
      setCatalogue(Array.isArray(services) ? services : (services as { data?: typeof catalogue }).data ?? []);
      setEnquiries(enq);
      setCustomers(Array.isArray(custRes) ? custRes : (custRes?.data ?? []));
    });
  }, [bid]);

  const { primary: listRows } = useMemo(() => groupQuotesByEnquiry(rows), [rows]);

  async function recordClientWithdrew() {
    if (!bid || !selected) return;
    try {
      await customFetch(`/api/businesses/${bid}/quotes/${selected.id}/client-withdrew`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reasonId: withdrewReason }),
      });
      toast({ title: "Marked as withdrawn" });
      setWithdrewOpen(false);
      void load();
    } catch {
      toast({ title: "Could not update", variant: "destructive" });
    }
  }

  const exitActions = selected
    ? resolveQuoteExitActions({
        quoteStatus: quotePipelineCurrent(selected),
        enquiryStatus: selected.enquiry?.status,
        depositPaidMinor: selected.depositPaidMinor,
        depositAmountMinor: selected.depositAmountMinor,
      })
    : [];

  const publicQuoteUrl =
    business?.slug && selected
      ? `${window.location.origin}/e/${business.slug}/q/${selected.publicToken}`
      : "";

  async function sendQuote(via: "email" | "whatsapp_assisted") {
    if (!bid || !selected) return;
    setSending(true);
    try {
      const result = await customFetch<{
        publicPath: string;
        pdfPath: string;
        whatsappText?: string;
        emailStatus?: string;
      }>(`/api/businesses/${bid}/quotes/${selected.id}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ via }),
      });
      if (via === "whatsapp_assisted" && result.whatsappText) {
        await navigator.clipboard.writeText(result.whatsappText);
        toast({ title: "WhatsApp message copied" });
      } else if (result.emailStatus === "sent") {
        toast({ title: "Quote emailed to client" });
      } else if (result.emailStatus === "failed") {
        toast({ title: "Email failed — try WhatsApp", variant: "destructive" });
      } else {
        toast({ title: "Quote marked sent" });
      }
      setSendReviewOpen(false);
      void load();
    } catch {
      toast({ title: "Send failed", variant: "destructive" });
    } finally {
      setSending(false);
    }
  }

  async function persistDraft(): Promise<boolean> {
    if (!bid || !selected) return false;
    const milestoneDeposits = [
      {
        label: "Deposit",
        percent: selected.depositPercent,
        amountMinor: selected.depositAmountMinor,
      },
    ];
    try {
      await customFetch(`/api/businesses/${bid}/quotes/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personalMessage: selected.personalMessage,
          depositPercent: selected.depositPercent,
          milestoneDeposits,
          eventDaySheet: selected.eventDaySheet,
          enquiryId: selected.enquiryId ?? null,
          customerId: selected.customerId ?? null,
          lines: selected.lines.map((l) => ({
            name: l.name,
            quantity: Number(l.quantity),
            unit: l.unit,
            unitPriceMinor: l.unitPriceMinor,
          })),
        }),
      });
      return true;
    } catch {
      return false;
    }
  }

  async function openSendReview() {
    if (!selected) return;
    const billTo = quoteBillToName(selected.enquiry, selected.eventDaySheet, selected.customer);
    if (!billTo) {
      toast({ title: "Add Bill To before sending", variant: "destructive" });
      return;
    }
    if (selected.lines.length === 0) {
      toast({ title: "Add line items from your catalogue", variant: "destructive" });
      return;
    }
    if (selected.status === "draft") {
      const ok = await persistDraft();
      if (!ok) {
        toast({ title: "Save failed — fix errors and try again", variant: "destructive" });
        return;
      }
    }
    setSendReviewOpen(true);
  }

  async function saveDraft() {
    if (!bid || !selected) return;
    const ok = await persistDraft();
    if (ok) {
      toast({ title: "Quote saved" });
      void load();
    } else {
      toast({ title: "Save failed", variant: "destructive" });
    }
  }

  function updateDepositPercent(depositPercent: number) {
    if (!selected) return;
    const pct = Math.min(100, Math.max(0, depositPercent));
    const depositAmountMinor = Math.round((selected.subtotalMinor * pct) / 100);
    const balanceDueMinor = selected.subtotalMinor - depositAmountMinor;
    setSelected({
      ...selected,
      depositPercent: pct,
      depositAmountMinor,
      balanceDueMinor,
      milestoneDeposits: [{ label: "Deposit", percent: pct, amountMinor: depositAmountMinor }],
    });
  }

  async function createQuote(opts?: { enquiryId?: string; customerId?: string; forceNew?: boolean }) {
    if (!bid) return;
    try {
      const quote = await customFetch<Quote>(`/api/businesses/${bid}/quotes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enquiryId: opts?.enquiryId,
          customerId: opts?.customerId,
          forceNew: opts?.forceNew ?? false,
        }),
      });
      toast({ title: "Draft quote created" });
      setCreateOpen(false);
      setCreateEnquiryId("__blank__");
      setCreateCustomerId("__none__");
      await load();
      setSelected(normalizeQuote(quote));
    } catch {
      toast({ title: "Could not create quote", variant: "destructive" });
    }
  }

  async function removeQuote() {
    if (!bid || !selected || !["draft", "expired"].includes(selected.status)) return;
    const label = selected.status === "expired" ? "Remove this expired quote from your list?" : "Delete this draft quote?";
    if (!window.confirm(`${label} This cannot be undone.`)) return;
    try {
      await customFetch(`/api/businesses/${bid}/quotes/${selected.id}`, { method: "DELETE" });
      toast({ title: selected.status === "expired" ? "Quote removed" : "Draft deleted" });
      setSelected(null);
      void load();
    } catch {
      toast({ title: "Could not remove quote", variant: "destructive" });
    }
  }

  async function deleteDraft() {
    return removeQuote();
  }

  async function copyPrepNudge(taskId: string) {
    if (!bid || !selected) return;
    try {
      const { whatsappText } = await customFetch<{ whatsappText: string }>(
        `/api/businesses/${bid}/quotes/${selected.id}/event-prep/${taskId}/liv-nudge`,
      );
      await navigator.clipboard.writeText(whatsappText);
      toast({ title: "Liv prep nudge copied" });
    } catch {
      toast({ title: "Could not load nudge", variant: "destructive" });
    }
  }

  async function completePrepTask(taskId: string) {
    if (!bid || !selected) return;
    try {
      const next = await customFetch<NonNullable<typeof prepView>>(
        `/api/businesses/${bid}/quotes/${selected.id}/event-prep/${taskId}/complete`,
        { method: "PATCH" },
      );
      setPrepView(next);
      toast({ title: "Marked done" });
    } catch {
      toast({ title: "Could not update task", variant: "destructive" });
    }
  }

  async function resendDepositReminder() {
    if (!bid || !selected) return;
    try {
      const result = await customFetch<{ whatsappText?: string; skipped?: boolean }>(
        `/api/businesses/${bid}/quotes/${selected.id}/deposit-reminder`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ force: true }) },
      );
      if (result.whatsappText) {
        await navigator.clipboard.writeText(result.whatsappText);
        toast({ title: "Deposit reminder copied" });
      } else if (result.skipped) {
        toast({ title: "Deposit reminder already sent" });
      }
    } catch {
      toast({ title: "Could not send reminder", variant: "destructive" });
    }
  }

  const sheet = selected?.eventDaySheet;
  const clientName = selected ? quoteBillToName(selected.enquiry, sheet, selected.customer) : null;
  const clientEmail =
    selected?.enquiry?.contactEmail ??
    sheet?.billToEmail ??
    selected?.customer?.email ??
    null;
  const quoteRef = selected ? selected.publicToken.slice(0, 8).toUpperCase() : null;
  const pdfHref =
    business?.slug && selected
      ? `/api/public/${business.slug}/q/${selected.publicToken}/html`
      : null;

  return (
    <FeatureUnlockGate featureId="quote_generator">
    <PageFrame width="lg" className="space-y-4" data-testid="quotes-page">
      <PersonaRitualHeader
        variant="page"
        title="Quotes & invoices"
        subtitle="Build a line-item quote, send it like an invoice, client accepts online."
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]">
        <section className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-medium text-muted-foreground">Your quotes</h2>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button type="button" size="sm" variant="outline" className="h-8 text-xs">
                  <Plus className="h-3 w-3 mr-1" />
                  New
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create quote</DialogTitle>
                  <DialogDescription>
                    Start a blank invoice or pull details from an existing lead.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 pt-2">
                  {enquiries.length > 0 ? (
                    <div className="space-y-1">
                      <Label className="text-xs">From lead (optional)</Label>
                      <Select
                        value={createEnquiryId}
                        onValueChange={(v) => {
                          setCreateEnquiryId(v);
                          if (v !== "__blank__") setCreateCustomerId("__none__");
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Blank quote" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__blank__">Blank quote</SelectItem>
                          {enquiries.map((e) => (
                            <SelectItem key={e.id} value={e.id}>
                              {e.contactName} · {e.eventType ?? "Event"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : null}
                  {createEnquiryId === "__blank__" && customers.length > 0 ? (
                    <div className="space-y-1">
                      <Label className="text-xs">Bill to client (optional)</Label>
                      <Select value={createCustomerId} onValueChange={setCreateCustomerId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Enter later" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">Enter later</SelectItem>
                          {customers.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.displayName ??
                                [c.firstName, c.lastName].filter(Boolean).join(" ") ??
                                c.email ??
                                "Client"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : null}
                  <div className="flex flex-wrap gap-2 justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        void createQuote({
                          enquiryId:
                            createEnquiryId && createEnquiryId !== "__blank__"
                              ? createEnquiryId
                              : undefined,
                          customerId:
                            createCustomerId && createCustomerId !== "__none__"
                              ? createCustomerId
                              : undefined,
                        })
                      }
                    >
                      Create draft
                    </Button>
                    {createEnquiryId && createEnquiryId !== "__blank__" ? (
                      <Button
                        type="button"
                        onClick={() =>
                          void createQuote({ enquiryId: createEnquiryId, forceNew: true })
                        }
                      >
                        Force new (keep old drafts)
                      </Button>
                    ) : null}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          {listRows.map((row) => {
            const listLabel = studioQuoteListLabel({
              publicToken: row.publicToken,
              eventType: row.enquiry?.eventType ?? row.eventDaySheet?.eventType,
              eventDate: row.enquiry?.eventDate ?? row.eventDaySheet?.eventDate,
            });
            return (
            <button
              key={row.id}
              type="button"
              onClick={() => setSelected(normalizeQuote(row))}
              className={`w-full rounded-lg border p-3 text-left transition-colors hover:bg-muted/30 ${selected?.id === row.id ? "border-primary ring-1 ring-primary/30" : ""}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium truncate">{listLabel.primary}</p>
                  <p className="text-xs text-muted-foreground truncate">{listLabel.secondary}</p>
                </div>
                <span className="font-semibold shrink-0">{eur(row.subtotalMinor)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <Badge variant="secondary" className="text-[10px] uppercase">
                  {quotePipelineCurrent(row)}
                </Badge>
                <span className="text-[10px] text-muted-foreground">
                  {row.validUntil ? `Valid to ${row.validUntil}` : "No expiry"}
                </span>
              </div>
            </button>
            );
          })}
          {listRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No quotes yet.{" "}
              <button type="button" className="text-primary underline" onClick={() => setCreateOpen(true)}>
                Create one
              </button>{" "}
              or{" "}
              <Link href="/inbox" className="text-primary underline">
                open inbox
              </Link>
              .
            </p>
          ) : null}
        </section>

        {selected ? (
          <section className="rounded-xl border bg-card shadow-sm overflow-hidden min-w-0">
            <div className="border-b bg-muted/20 px-4 py-3 space-y-3">
              <ConsultPipelineTrack
                steps={QUOTE_STATUSES}
                current={quotePipelineCurrent(selected)}
              />
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-1 min-w-0">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <h2 className="font-semibold">{studioQuoteDetailTitle(selected.publicToken)}</h2>
                      {selected.status !== "draft" ? (
                        <QuoteSentNextSteps
                          status={selected.status}
                          depositPaidMinor={selected.depositPaidMinor}
                          depositAmountMinor={selected.depositAmountMinor}
                          clientLink={publicQuoteUrl || null}
                        />
                      ) : null}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {sheet?.eventType ?? selected.enquiry?.eventType ?? "Event"}
                      {sheet?.eventDate ? ` · ${sheet.eventDate}` : ""}
                      {sheet?.guestCount ? ` · ${sheet.guestCount} guests` : ""}
                    </p>
                  </div>
                </div>
                <div className="text-right text-sm">
                  <p className="font-semibold">{eur(selected.subtotalMinor)}</p>
                  <p className="text-xs text-muted-foreground">
                    Deposit {selected.depositPercent}% ({eur(selected.depositAmountMinor)})
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-4 max-w-2xl">
              <QuoteBillToPanel
                disabled={selected.status !== "draft"}
                enquiryId={selected.enquiryId}
                enquiry={selected.enquiry}
                enquiries={enquiries}
                sheet={sheet}
                customers={customers}
                onChange={(patch) => {
                  const linkedCustomer =
                    patch.customerId != null
                      ? customers.find((c) => c.id === patch.customerId) ?? selected.customer
                      : patch.customerId === null
                        ? null
                        : selected.customer;
                  const linkedEnquiry =
                    patch.enquiry !== undefined
                      ? patch.enquiry
                      : patch.enquiryId
                        ? enquiries.find((e) => e.id === patch.enquiryId) ?? selected.enquiry
                        : patch.enquiryId === null
                          ? null
                          : selected.enquiry;
                  const enquiryForState: EnquirySummary | null = linkedEnquiry
                    ? {
                        id: linkedEnquiry.id,
                        contactName: linkedEnquiry.contactName,
                        contactEmail: linkedEnquiry.contactEmail,
                        eventType: linkedEnquiry.eventType,
                        eventDate: linkedEnquiry.eventDate,
                        status:
                          "status" in linkedEnquiry && linkedEnquiry.status
                            ? linkedEnquiry.status
                            : selected.enquiry?.status ?? "new",
                      }
                    : null;
                  setSelected({
                    ...selected,
                    enquiryId: patch.enquiryId !== undefined ? patch.enquiryId : selected.enquiryId,
                    customerId: patch.customerId !== undefined ? patch.customerId : selected.customerId,
                    eventDaySheet: patch.eventDaySheet,
                    enquiry: enquiryForState,
                    customer: linkedCustomer ?? null,
                  });
                }}
              />

              {quoteBrief && selected.status === "draft" ? (
                <QuoteBriefPanel
                  hints={quoteBrief.briefIntelligence.hints}
                  suggestedTemplateName={quoteBrief.suggestedTemplateName}
                  suggestedMessage={quoteBrief.briefIntelligence.suggestedMessage}
                  onUseMessage={() =>
                    setSelected({
                      ...selected,
                      personalMessage: quoteBrief.briefIntelligence.suggestedMessage,
                    })
                  }
                />
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="quote-message">Cover message</Label>
                <Textarea
                  id="quote-message"
                  value={selected.personalMessage ?? ""}
                  onChange={(e) => setSelected({ ...selected, personalMessage: e.target.value })}
                  rows={3}
                  placeholder="Thank you for your enquiry — here is your personalised quote…"
                  disabled={selected.status !== "draft"}
                />
              </div>

              <QuoteLineItemsEditor
                lines={selected.lines}
                depositPercent={selected.depositPercent}
                disabled={selected.status !== "draft"}
                catalogue={catalogue}
                onChange={({ lines, subtotalMinor, depositAmountMinor, balanceDueMinor }) => {
                  const milestoneDeposits = [
                    {
                      label: "Deposit",
                      percent: selected.depositPercent,
                      amountMinor: depositAmountMinor,
                    },
                  ];
                  setSelected({
                    ...selected,
                    lines,
                    subtotalMinor,
                    depositAmountMinor,
                    balanceDueMinor,
                    milestoneDeposits,
                  });
                }}
              />

              <div className="rounded-lg border bg-muted/10 p-3 space-y-3 text-sm max-w-sm ml-auto">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{eur(selected.subtotalMinor)}</span>
                </div>
                <div className="flex items-end justify-between gap-3">
                  <div className="space-y-1 flex-1">
                    <Label htmlFor="deposit-pct" className="text-xs text-muted-foreground">
                      Deposit to secure booking
                    </Label>
                    <div className="flex items-center gap-1.5">
                      <Input
                        id="deposit-pct"
                        type="number"
                        min={0}
                        max={100}
                        value={selected.depositPercent}
                        disabled={selected.status !== "draft"}
                        onChange={(e) => updateDepositPercent(Number(e.target.value))}
                        className="h-8 w-16 text-sm tabular-nums"
                      />
                      <span className="text-xs text-muted-foreground">%</span>
                    </div>
                  </div>
                  <span className="font-semibold tabular-nums">{eur(selected.depositAmountMinor)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground text-xs pt-1 border-t">
                  <span>Balance before event</span>
                  <span className="tabular-nums">{eur(selected.balanceDueMinor)}</span>
                </div>
                {selected.depositPaidMinor > 0 ? (
                  <div className="flex justify-between text-emerald-700 dark:text-emerald-400 text-xs">
                    <span>Paid to date</span>
                    <span>{eur(selected.depositPaidMinor)}</span>
                  </div>
                ) : null}
              </div>

              {prepView?.prepInitializedAt ? (
                <EventPrepTimelinePanel
                  prep={prepView}
                  loading={prepLoading}
                  onComplete={(taskId) => void completePrepTask(taskId)}
                  onCopyNudge={(taskId) => void copyPrepNudge(taskId)}
                />
              ) : null}

              {selected.status === "accepted" &&
              selected.depositPaidMinor < selected.depositAmountMinor ? (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="text-amber-900 dark:text-amber-100 text-xs">
                    Deposit outstanding
                  </span>
                  <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={() => void resendDepositReminder()}>
                    Copy deposit reminder
                  </Button>
                </div>
              ) : null}

              {exitActions.length > 0 ? (
                <div className="rounded-lg border bg-muted/20 px-3 py-2 space-y-2">
                  {exitActions.map((action) => (
                    <div key={action.id} className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs text-muted-foreground">{action.hint}</p>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className={action.destructive ? "border-destructive/40 text-destructive hover:bg-destructive/10" : ""}
                        onClick={() => {
                          if (action.id === "client_withdrew") setWithdrewOpen(true);
                          else if (action.id === "remove_quote" && bid && selected) {
                            void removeQuote();
                          } else if (action.id === "mark_lost" && bid && selected) {
                            void customFetch(`/api/businesses/${bid}/quotes/${selected.id}/client-withdrew`, {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ reasonId: "unknown" }),
                            }).then(() => {
                              toast({ title: "Marked lost" });
                              void load();
                            });
                          }
                        }}
                        data-testid={`quote-exit-${action.id}`}
                      >
                        {action.label}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2 pt-2 border-t">
                {selected.status === "draft" || selected.status === "expired" ? (
                  <>
                    {selected.status === "draft" ? (
                      <Button size="sm" onClick={() => void saveDraft()}>
                        Save draft
                      </Button>
                    ) : null}
                    <Button size="sm" variant="destructive" onClick={() => void removeQuote()}>
                      <Trash2 className="mr-1 h-3 w-3" />
                      {selected.status === "expired" ? "Remove" : "Delete draft"}
                    </Button>
                    {selected.status === "draft" ? (
                      <Button size="sm" className="ml-auto" onClick={() => void openSendReview()}>
                        <Send className="mr-1 h-3 w-3" />
                        Review & send
                      </Button>
                    ) : null}
                  </>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => setSendReviewOpen(true)}>
                    View invoice
                  </Button>
                )}
                {selected.status === "sent" ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        if (!bid) return;
                        try {
                          const row = await customFetch<{ id: string; version?: number }>(
                            `/api/businesses/${bid}/quotes/${selected.id}/revise`,
                            { method: "POST" },
                          );
                          toast({ title: `Quote v${row.version ?? 2} draft created` });
                          window.location.href = `/quotes?id=${row.id}`;
                        } catch {
                          toast({ title: "Revise failed", variant: "destructive" });
                        }
                      }}
                    >
                      Revise quote (v+1)
                    </Button>
                    {selected.sentAt &&
                    Math.floor(
                      (Date.now() - new Date(selected.sentAt).getTime()) / (24 * 60 * 60 * 1000),
                    ) >= STALE_QUOTE_DAYS ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={async () => {
                          if (!bid) return;
                          try {
                            const row = await customFetch<{ whatsappText: string }>(
                              `/api/businesses/${bid}/quotes/${selected.id}/stale-liv-draft`,
                            );
                            await navigator.clipboard.writeText(row.whatsappText);
                            toast({
                              title: "Follow-up copied",
                              description: "Paste into WhatsApp — Liv drafted it.",
                            });
                          } catch {
                            toast({ title: "Could not copy follow-up", variant: "destructive" });
                          }
                        }}
                      >
                        Copy Liv follow-up
                      </Button>
                    ) : null}
                  </>
                ) : null}
              </div>
            </div>
          </section>
        ) : (
          <p className="text-sm text-muted-foreground">Select a quote to edit or send.</p>
        )}
      </div>

      {selected ? (
        <QuoteSendReviewDialog
          open={sendReviewOpen}
          onOpenChange={setSendReviewOpen}
          businessName={business?.name ?? "Your studio"}
          logoUrl={(business as { logoUrl?: string } | null)?.logoUrl}
          clientName={clientName}
          clientEmail={clientEmail}
          quoteRef={quoteRef}
          status={selected.status}
          personalMessage={selected.personalMessage}
          lines={selected.lines}
          subtotalMinor={selected.subtotalMinor}
          depositAmountMinor={selected.depositAmountMinor}
          balanceDueMinor={selected.balanceDueMinor}
          depositPercent={selected.depositPercent}
          validUntil={selected.validUntil}
          eventDaySheet={sheet}
          pdfHref={pdfHref}
          clientPayUrl={publicQuoteUrl || null}
          publicToken={selected.publicToken}
          sending={sending}
          onSendEmail={() => sendQuote("email")}
          onSendWhatsApp={() => sendQuote("whatsapp_assisted")}
        />
      ) : null}

      <Dialog open={withdrewOpen} onOpenChange={setWithdrewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Client withdrew</DialogTitle>
            <DialogDescription>
              Closes the quote and enquiry. If a deposit was paid, review your refund policy before confirming.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Reason (optional)</Label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              value={withdrewReason}
              onChange={(e) => setWithdrewReason(e.target.value as ClientWithdrawReasonId)}
            >
              {CLIENT_WITHDRAW_REASONS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setWithdrewOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={() => void recordClientWithdrew()}>
              Confirm withdrew
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageFrame>
    </FeatureUnlockGate>
  );
}
