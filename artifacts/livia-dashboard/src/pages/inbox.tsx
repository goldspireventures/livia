import { useState, useMemo, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListConversations,
  useGetConversation,
  useUpdateConversation,
  getListConversationsQueryKey,
  getGetConversationQueryKey,
} from "@workspace/api-client-react";
import { useBusiness } from "@/lib/business-context";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { OperationalPageShell } from "@/components/layout/operational-page-shell";
import {
  beautyNativeMorphForVertical,
  isConstellationPresentation,
  readCssPresentation,
  useBeautyChrome,
  useWellnessChrome,
  wellnessNativeMorphForVertical,
} from "@/lib/presentation-layout";
import { effectivePresentationMorph } from "@/lib/appearance-preview-mode";
import { useTenantExperience } from "@/lib/tenant-experience-api";
import { parseUserFacingError } from "@/lib/user-facing-errors";
import { cn } from "@/lib/utils";
import {
  beautyOutlineButton,
  beautyPrimaryButton,
} from "@/lib/beauty-operational-ui";
import { InboxRelationshipChip } from "@/components/inbox/inbox-relationship-chip";
import { HelpSupportDialog } from "@/components/help-support-dialog";
import { usePersona } from "@/lib/persona";
import { useUser } from "@clerk/clerk-react";
import { timeGreeting } from "@/lib/persona-rituals";
import {
  countUnifiedInboxQueueLens,
  sortInboxThreadsByAttention,
  inboxThreadNeedsAttention,
  defaultInboxQueueLens,
  inboxScreenTitle,
  INBOX_QUEUE_LENS_LABELS,
  matchesUnifiedInboxQueueLens,
  groupInboxThreadsByCustomer,
  inboxUnifiedListRowToThreadRow,
  unifiedInboxGuestNeedsAttention,
  shouldShowInboxContextRail,
  buildTenantPostSessionInboxDraft,
  tenantRetailPostSessionInboxBanner,
  verticalSupportsRetail,
  wellnessRetailSkuById,
  inboxFloorGuidance,
  inboxReplyPlaceholderForCompose,
  inboxReplyDeliveredOnChannel,
  inboxReplyOnChannelLabel,
  resolveInboxComposeReplyChannel,
  resolveInboxEffectiveReplyConversationId,
  buildInboxGuestChannelContext,
  resolveInboxMessageReplyRoute,
  toggleInboxReplyChannelPick,
  isInboxReplyChannelSelected,
  inboxNeedsOwnerReply,
  type InboxQueueLens,
} from "@workspace/policy";
import { InboxThreadList, type InboxThreadRow } from "@/components/inbox/inbox-thread-list";
import { InboxChannelIcon, InboxChannelIconRow } from "@/components/inbox/inbox-channel-icon";
import { InboxContextRail } from "@/components/inbox/inbox-context-rail";
import { invalidateOperationalState, OPERATIONAL_REFETCH_MS } from "@/lib/operational-cache";
import { apiFetch } from "@/lib/api-fetch";
import { getListBookingsQueryKey } from "@workspace/api-client-react";
import {
  InboxResolveDialog,
  type ResolveOutcome,
} from "@/components/inbox/inbox-resolve-dialog";
import { resolutionSummary, type ConversationResolution } from "@/lib/conversation-resolution";
import { inboxMessagesMinHeight } from "@/lib/inbox-thread-layout";
import { Textarea } from "@/components/ui/textarea";
import {
  Sparkles,
  CheckCircle2,
  HandHelping,
  MessageSquare,
  ArrowUp,
} from "lucide-react";
import { Link } from "wouter";
import EventVendorUnifiedInboxPage from "@/pages/enquiries";

interface ConversationListItem {
  id: string;
  channel: string;
  status: string;
  customerId?: string | null;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  aiHandled: boolean;
  lastMessage: string | null;
  summary?: string | null;
  lastMessageAt: string;
  createdAt: string;
  messageCount: number;
  bookingCount: number;
  linkedBookingId?: string | null;
  caseIntent?: string | null;
  resolution?: ConversationResolution | null;
}

interface ConversationDetail {
  conversation: ConversationListItem;
  messages: ConversationMessageItem[];
}

interface ConversationMessageItem {
  id: string;
  conversationId?: string;
  channel?: string;
  role: "USER" | "ASSISTANT" | "SYSTEM" | "TOOL";
  content: string;
  toolName: string | null;
  bookingId: string | null;
  authorUserId?: string | null;
  createdAt: string;
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function inboxGreeting(firstName: string | null | undefined, multiShop: boolean): string {
  const t = timeGreeting();
  const prefix =
    t === "morning" ? "Good morning" : t === "afternoon" ? "Good afternoon" : "Good evening";
  const name = firstName?.trim() || "there";
  return multiShop
    ? `${prefix}, ${name} — queue across your locations.`
    : `${prefix}, ${name} — here's your conversation queue.`;
}

export default function InboxPage() {
  const { user } = useUser();
  const { kind: persona } = usePersona();
  const { business } = useBusiness();
  const { toast } = useToast();
  const qc = useQueryClient();
  const businessId = business?.id ?? "";
  const tenantVertical = (business as { vertical?: string } | null)?.vertical ?? null;
  if (tenantVertical === "event-vendors") {
    return <EventVendorUnifiedInboxPage />;
  }
  const { data: tenantXp } = useTenantExperience(businessId || undefined);
  const layoutMorph = effectivePresentationMorph(
    tenantVertical,
    tenantXp?.presentation?.presetId,
  );
  const beautyChrome = useBeautyChrome(tenantVertical);
  const wellnessChrome = useWellnessChrome(tenantVertical);
  const wellnessInboxMorph = wellnessNativeMorphForVertical(tenantVertical, layoutMorph);
  const beautyInboxMorph = beautyNativeMorphForVertical(tenantVertical, layoutMorph);
  const presentationCss =
    tenantXp?.presentation?.cssPreset ?? readCssPresentation();
  const isConstellationInbox =
    !beautyInboxMorph &&
    !wellnessInboxMorph &&
    isConstellationPresentation(presentationCss);
  const compactInboxCompose = Boolean(
    wellnessInboxMorph || beautyInboxMorph || isConstellationInbox,
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"OPEN" | "HANDED_OFF" | "CLOSED" | "ALL">("OPEN");
  const [queueLens, setQueueLens] = useState<InboxQueueLens>("liv_handling");
  const [replyDraft, setReplyDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [replyChannelPick, setReplyChannelPick] = useState<{
    conversationId: string;
    channel: string;
  } | null>(null);
  const [postSessionFlow, setPostSessionFlow] = useState<{
    productName?: string;
    steps: string[];
  } | null>(null);

  const showRitual =
    persona === "manager" ||
    persona === "owner" ||
    persona === "org_admin" ||
    persona === "receptionist";
  const floorGuidance = inboxFloorGuidance(persona);

  useEffect(() => {
    if (showRitual) setQueueLens(defaultInboxQueueLens(persona));
  }, [persona, showRitual]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("conversation") ?? params.get("conversationId");
    if (id) setSelectedId(id);
    const lens = params.get("lens");
    if (
      lens === "all" ||
      lens === "needs_you" ||
      lens === "liv_handling" ||
      lens === "taken_over" ||
      lens === "closed"
    ) {
      setQueueLens(lens);
    }

    if (params.get("flow") === "post_session" && verticalSupportsRetail(tenantVertical)) {
      const productParam = params.get("product") ?? undefined;
      const skuId = params.get("sku") ?? undefined;
      const skuName =
        tenantVertical === "wellness" && skuId ? wellnessRetailSkuById(skuId)?.name : undefined;
      const productName = productParam ?? skuName;
      const draft = buildTenantPostSessionInboxDraft(tenantVertical, { productName });
      setReplyDraft(draft.body);
      setPostSessionFlow({ productName, steps: draft.steps });
      setStatusFilter("ALL");
      setQueueLens("all");
    }
  }, [tenantVertical]);

  const { data: convos, isLoading: isLoadingConvos } = useListConversations(
    businessId,
    showRitual ? {} : statusFilter === "ALL" ? {} : { status: statusFilter },
    {
      query: {
        enabled: !!businessId,
        refetchInterval: 10_000,
      } as any,
    },
  );

  const {
    data: detail,
    isLoading: isLoadingDetail,
    isError: isDetailError,
  } = useGetConversation(businessId, selectedId ?? "", {
    query: {
      enabled: !!businessId && !!selectedId,
      refetchInterval: 5_000,
      retry: 1,
    } as any,
  });

  const updateConversation = useUpdateConversation();

  const conversations = (convos ?? []) as unknown as ConversationListItem[];
  const guestGroups = useMemo(() => groupInboxThreadsByCustomer(conversations), [conversations]);
  const queueCounts = useMemo(() => countUnifiedInboxQueueLens(guestGroups), [guestGroups]);
  const filteredConversations = useMemo(() => {
    const groups = !showRitual
      ? guestGroups
      : guestGroups.filter((g) => {
          if (queueLens === "all") return g.threads.some((t) => t.status !== "CLOSED");
          return matchesUnifiedInboxQueueLens(g, queueLens);
        });
    const rows: InboxThreadRow[] = groups.map((g) => {
      const aggregate = inboxUnifiedListRowToThreadRow(g);
      return {
        ...aggregate,
        channels: g.activeChannels.length ? g.activeChannels : g.channels,
        customerName: g.customerName ?? null,
        lastMessage: aggregate.lastMessage ?? null,
        bookingCount: aggregate.bookingCount ?? 0,
      };
    });
    return sortInboxThreadsByAttention(rows);
  }, [guestGroups, queueLens, showRitual]);

  const detailData = detail as
    | {
        conversation: ConversationListItem;
        messages: (ConversationMessageItem & { channel?: string })[];
        isUnifiedView?: boolean;
        replyConversationId?: string;
        replyChannel?: string;
        siblingThreads?: Array<{
          id: string;
          channel: string;
          status: string;
          lastMessage?: string | null;
          lastMessageAt: string;
        }>;
      }
    | undefined;

  const activeChannelCountByCustomer = useMemo(() => {
    const counts = new Map<string, number>();
    for (const g of guestGroups) {
      if (g.customerId && g.activeChannels.length > 1) {
        counts.set(g.customerId, g.activeChannels.length);
      }
    }
    return counts;
  }, [guestGroups]);

  const selectedConversation = useMemo(() => {
    if (!selectedId) return null;
    return (
      detailData?.conversation ?? conversations.find((c) => c.id === selectedId) ?? null
    );
  }, [selectedId, detailData, conversations]);

  const replyConversationId = detailData?.replyConversationId ?? selectedId;
  const isUnifiedView = detailData?.isUnifiedView ?? false;
  const replyChannel = detailData?.replyChannel ?? selectedConversation?.channel;

  const guestChannelContext = useMemo(
    () => buildInboxGuestChannelContext(selectedConversation?.customerId, guestGroups),
    [selectedConversation?.customerId, guestGroups],
  );

  const replyDetailReady = !!detailData && !isLoadingDetail;

  useEffect(() => {
    setReplyChannelPick(null);
  }, [selectedId]);

  useEffect(() => {
    if (isLoadingConvos) return;
    if (!selectedId) return;
    const knownIds = new Set([
      ...conversations.map((c) => c.id),
      ...guestGroups.map((g) => g.primaryConversationId),
    ]);
    if (knownIds.has(selectedId)) return;
    const fallbackId = filteredConversations[0]?.id ?? null;
    setSelectedId(fallbackId);
    const params = new URLSearchParams(window.location.search);
    if (params.has("conversation") || params.has("conversationId")) {
      params.delete("conversation");
      params.delete("conversationId");
      const qs = params.toString();
      window.history.replaceState(
        null,
        "",
        qs ? `${window.location.pathname}?${qs}` : window.location.pathname,
      );
    }
  }, [isLoadingConvos, conversations, guestGroups, selectedId, filteredConversations]);

  const effectiveReplyConversationId = resolveInboxEffectiveReplyConversationId(
    replyChannelPick,
    replyConversationId,
    selectedId,
  );
  const effectiveReplyChannel = resolveInboxComposeReplyChannel({
    pick: replyChannelPick,
    apiReplyChannel: replyChannel,
    threadChannel: selectedConversation?.channel,
    multiChannel: guestChannelContext.multi,
    detailReady: replyDetailReady,
  });

  useEffect(() => {
    if (!replyChannelPick) return;
    function onPointerDown(e: PointerEvent) {
      const el = e.target as HTMLElement | null;
      if (el?.closest("[data-inbox-channel-pick]")) return;
      setReplyChannelPick(null);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [replyChannelPick]);

  function selectReplyChannelForMessage(m: ConversationMessageItem & { channel?: string }) {
    if (!guestChannelContext.multi || !selectedId) return;
    const route = resolveInboxMessageReplyRoute(
      m,
      guestChannelContext,
      selectedId,
      conversations,
      selectedConversation?.channel,
    );
    if (!route) return;
    setReplyChannelPick(toggleInboxReplyChannelPick(replyChannelPick, route));
  }

  const replyConversation = useMemo(() => {
    if (!effectiveReplyConversationId) return selectedConversation;
    return (
      conversations.find((c) => c.id === effectiveReplyConversationId) ??
      detailData?.conversation ??
      selectedConversation
    );
  }, [effectiveReplyConversationId, conversations, detailData?.conversation, selectedConversation]);

  const showMergedTimeline = isUnifiedView || guestChannelContext.multi;

  const ownerCanReply = useMemo(() => {
    if (!selectedConversation) return false;
    if (showMergedTimeline && selectedConversation.customerId) {
      const group = guestGroups.find((g) => g.customerId === selectedConversation.customerId);
      return group?.threads.some((t) => inboxNeedsOwnerReply(t)) ?? false;
    }
    return inboxNeedsOwnerReply(replyConversation ?? selectedConversation);
  }, [selectedConversation, showMergedTimeline, guestGroups, replyConversation]);

  const [resolving, setResolving] = useState(false);
  const [resolveDialog, setResolveDialog] = useState<{
    outcome: ResolveOutcome;
    refundMinor?: number;
  } | null>(null);

  async function resolveCase(
    outcome: ResolveOutcome,
    opts?: { refundMinor?: number; customerMessage?: string },
  ) {
    if (!selectedId || !businessId) return;
    setResolving(true);
    try {
      const result = await apiFetch<{ effects: string[] }>(
        `/businesses/${businessId}/conversations/${selectedId}/resolve`,
        {
          method: "POST",
          body: JSON.stringify({
            outcome,
            refundMinor: opts?.refundMinor,
            customerMessage: opts?.customerMessage,
          }),
        },
      );
      invalidateOperationalState(qc, businessId);
      qc.invalidateQueries({ queryKey: getListBookingsQueryKey(businessId) });
      setResolveDialog(null);
      toast({
        title: "Case resolved",
        description: result.effects?.join(" · ") ?? "Done",
      });
    } catch (err: unknown) {
      toast({
        title: "Could not resolve case",
        description: parseUserFacingError(err, "Could not resolve this case"),
        variant: "destructive",
      });
    } finally {
      setResolving(false);
    }
  }

  function handleStatusChange(status: "OPEN" | "HANDED_OFF" | "CLOSED") {
    if (!selectedId || !businessId) return;
    updateConversation.mutate(
      { businessId, conversationId: selectedId, data: { status } },
      {
        onSuccess: () => {
          invalidateOperationalState(qc, businessId);
          qc.invalidateQueries({ queryKey: getListConversationsQueryKey(businessId) });
          qc.invalidateQueries({
            queryKey: getGetConversationQueryKey(businessId, selectedId),
          });
          toast({
            title:
              status === "HANDED_OFF"
                ? "You're on this thread — Liv is standing by"
                : status === "OPEN"
                  ? "Back to Liv — she'll handle this thread again"
                  : status === "CLOSED"
                  ? "Conversation closed"
                  : "Conversation reopened",
          });
        },
        onError: () => {
          toast({ title: "Failed to update conversation", variant: "destructive" });
        },
      },
    );
  }

  async function sendOwnerReply(releaseAfterSend: boolean) {
    const targetId = effectiveReplyConversationId ?? selectedId;
    if (!businessId || !targetId || !replyDraft.trim()) return;
    setSending(true);
    try {
      await apiFetch(`/businesses/${businessId}/conversations/${targetId}/messages`, {
        method: "POST",
        body: JSON.stringify({ content: replyDraft.trim() }),
      });
      setReplyDraft("");
      if (releaseAfterSend) {
        await new Promise<void>((resolve, reject) => {
          updateConversation.mutate(
            { businessId, conversationId: targetId, data: { status: "OPEN" } },
            {
              onSuccess: () => resolve(),
              onError: () => reject(new Error("release failed")),
            },
          );
        });
      }
      invalidateOperationalState(qc, businessId);
      if (selectedId) {
        await qc.invalidateQueries({
          queryKey: getGetConversationQueryKey(businessId, selectedId),
        });
      }
      await qc.invalidateQueries({
        queryKey: getListConversationsQueryKey(businessId),
      });
      toast({
        title: releaseAfterSend ? "Sent — Liv's back on this thread" : "Reply sent",
      });
    } catch (err: unknown) {
      toast({
        title: "Could not send reply",
        description: parseUserFacingError(err, "Could not send your reply"),
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  }

  const ritualTitle =
    persona === "org_admin"
      ? `${inboxScreenTitle(persona)} · all locations`
      : `${inboxScreenTitle(persona)} · ${business?.name ?? "this shop"}`;

  const QUEUE_LENSES: InboxQueueLens[] = [
    "all",
    "needs_you",
    "liv_handling",
    "taken_over",
    "closed",
  ];

  const emptyInboxTitle = showRitual
    ? queueLens === "needs_you"
      ? "Nothing needs you right now"
      : queueLens === "all" && conversations.filter((c) => c.status !== "CLOSED").length === 0
        ? "Inbox clear — Liv is watching your channels"
        : `No threads in “${INBOX_QUEUE_LENS_LABELS[queueLens].short}”`
    : "No conversations yet";

  const emptyInboxSubtitle = showRitual
    ? queueLens === "all"
      ? "Connect WhatsApp in Settings when you're ready for more channels."
      : INBOX_QUEUE_LENS_LABELS[queueLens].description
    : "When customers message Liv on your booking page or SMS line, conversations appear here.";

  let showContextRail = shouldShowInboxContextRail(!!selectedConversation);
  let paneGrid = showContextRail
    ? "lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)_minmax(0,260px)]"
    : "lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)]";

  if (wellnessInboxMorph === "timeline-rail") {
    showContextRail = false;
    paneGrid = "lg:grid-cols-1 max-w-3xl mx-auto w-full";
  } else if (wellnessInboxMorph === "ledger") {
    showContextRail = false;
    paneGrid = "lg:grid-cols-1 max-w-4xl mx-auto w-full";
  } else if (wellnessInboxMorph === "atrium") {
    showContextRail = false;
    paneGrid = "lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)]";
  } else if (beautyInboxMorph === "split-inbox") {
    showContextRail = shouldShowInboxContextRail(!!selectedConversation);
    paneGrid = showContextRail
      ? "lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)_minmax(0,240px)]"
      : "lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)]";
  } else if (beautyInboxMorph === "atrium") {
    showContextRail = false;
    paneGrid = "lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]";
  } else if (beautyInboxMorph === "menu-card") {
    showContextRail = false;
    paneGrid = "lg:grid-cols-[minmax(0,240px)_minmax(0,1fr)] max-w-5xl mx-auto w-full";
  } else if (beautyInboxMorph === "cockpit") {
    showContextRail = !!selectedConversation;
    paneGrid = showContextRail
      ? "lg:grid-cols-[minmax(0,220px)_minmax(0,1fr)_minmax(0,200px)]"
      : "lg:grid-cols-[minmax(0,220px)_minmax(0,1fr)]";
  } else if (isConstellationInbox) {
    showContextRail = shouldShowInboxContextRail(!!selectedConversation);
    paneGrid = showContextRail
      ? "lg:grid-cols-[minmax(0,264px)_minmax(0,1.1fr)_minmax(0,242px)]"
      : "lg:grid-cols-[minmax(0,264px)_minmax(0,1.1fr)]";
  }

  const inboxShellClass = cn(
    wellnessInboxMorph && "wellness-inbox-page",
    beautyInboxMorph && "beauty-inbox-page",
    isConstellationInbox && "constellation-inbox-page",
  );
  const inboxGridMinH =
    wellnessInboxMorph || beautyInboxMorph
      ? "h-[calc(100dvh-8rem)] min-h-[min(720px,calc(100dvh-7.5rem))] max-h-[calc(100dvh-5rem)]"
      : isConstellationInbox
        ? "h-[calc(100dvh-5rem)] min-h-[min(720px,calc(100dvh-5rem))]"
        : "h-[calc(100dvh-9rem)] min-h-[min(640px,calc(100dvh-8.5rem))] max-h-[calc(100dvh-5.5rem)]";

  const threadMessages = detailData?.messages ?? [];

  const threadMessageCount = useMemo(() => {
    return threadMessages.filter((m) => m.role !== "SYSTEM" && m.role !== "TOOL").length;
  }, [threadMessages]);

  return (
    <OperationalPageShell
      className={inboxShellClass}
      title={showRitual ? ritualTitle : "Inbox"}
      subtitle={
        showRitual
          ? INBOX_QUEUE_LENS_LABELS[queueLens].description
          : "Conversations between your customers and Liv"
      }
      actions={
        <div
          className={cn(
            "flex items-center gap-1 rounded-md p-1 flex-wrap max-w-full",
            beautyChrome
              ? "beauty-inbox-queue-lens border border-border/70"
              : "bg-muted",
          )}
        >
          {showRitual
            ? QUEUE_LENSES.map((lens) => (
                <button
                  key={lens}
                  type="button"
                  data-testid={`queue-lens-${lens}`}
                  data-active={queueLens === lens ? "true" : undefined}
                  onClick={() => setQueueLens(lens)}
                  className={cn(
                    "text-xs px-3 py-1 rounded transition-colors whitespace-nowrap",
                    queueLens === lens && !beautyChrome
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {lens === "liv_handling" ? "Liv handling" : INBOX_QUEUE_LENS_LABELS[lens].short}
                  {queueCounts[lens] > 0 ? ` (${queueCounts[lens]})` : ""}
                </button>
              ))
            : (["OPEN", "HANDED_OFF", "CLOSED", "ALL"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  data-testid={`filter-${s.toLowerCase()}`}
                  onClick={() => setStatusFilter(s)}
                  className={`text-xs px-3 py-1 rounded transition-colors ${
                    statusFilter === s
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {s === "HANDED_OFF" ? "Taken over" : s.charAt(0) + s.slice(1).toLowerCase()}
                </button>
              ))}
        </div>
      }
    >
      {postSessionFlow ? (
        <div
          className="mb-3 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2.5 text-sm"
          data-testid="inbox-post-session-flow"
        >
          <p className="font-medium text-foreground">
            {tenantRetailPostSessionInboxBanner(tenantVertical)}
          </p>
          <ol className="mt-1 list-decimal pl-5 text-xs text-muted-foreground space-y-0.5">
            {postSessionFlow.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          {postSessionFlow.productName ? (
            <p className="text-xs text-muted-foreground mt-1.5">
              Product mention: <span className="text-foreground">{postSessionFlow.productName}</span>
            </p>
          ) : null}
        </div>
      ) : null}
      {floorGuidance ? (
        <div
          className={cn(
            "mb-3 flex flex-col gap-2 rounded-lg border px-3 py-2.5 text-sm sm:flex-row sm:items-center sm:justify-between",
            isConstellationInbox
              ? "constellation-inbox-floor-guidance border-[rgba(217,195,154,0.22)] bg-[rgba(217,195,154,0.06)]"
              : "border-border/80 bg-muted/30",
          )}
          data-testid="inbox-floor-guidance"
        >
          <div className="min-w-0">
            <p className="font-medium text-foreground">{floorGuidance.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{floorGuidance.body}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className={cn("shrink-0", beautyOutlineButton(beautyChrome))}
            asChild
          >
            <Link href={floorGuidance.href}>{floorGuidance.cta}</Link>
          </Button>
        </div>
      ) : null}
      <div
        className={cn(
          "grid grid-cols-1 gap-0 border border-border/80 rounded-xl overflow-hidden",
          inboxGridMinH,
          paneGrid,
          beautyChrome ? "beauty-operational-panel beauty-inbox-shell" : "bg-card",
          isConstellationInbox && "constellation-inbox-shell platform-default-liv-glass",
          wellnessChrome && "wellness-list-shell",
          wellnessInboxMorph && `wellness-inbox-grid wellness-inbox--${wellnessInboxMorph}`,
          beautyInboxMorph && `beauty-inbox-grid beauty-inbox--${beautyInboxMorph}`,
          isConstellationInbox && "constellation-inbox-grid constellation-inbox--constellation",
        )}
        data-testid="inbox-three-pane"
      >
        {/* Thread list */}
        <div
          className={cn(
            "flex flex-col min-h-0 h-full border-b lg:border-b-0 lg:border-r border-border/80 overflow-hidden",
            beautyChrome && "beauty-inbox-thread-pane",
          )}
        >
          <div className="flex-1 min-h-0 overflow-y-auto">
            <InboxThreadList
            threads={filteredConversations}
            loading={isLoadingConvos}
            selectedId={selectedId}
            onSelect={setSelectedId}
            emptyTitle={emptyInboxTitle}
            emptySubtitle={emptyInboxSubtitle}
            beautyChrome={beautyChrome}
            activeChannelCountByCustomer={activeChannelCountByCustomer}
          />
          </div>
        </div>

        {/* Conversation */}
        <div
          className={cn(
            "flex flex-col min-h-0 min-w-0 h-full border-b lg:border-b-0 lg:border-r border-border/80",
            beautyChrome && "beauty-inbox-conversation-pane",
            wellnessInboxMorph && "wellness-inbox-conversation-col",
            beautyInboxMorph && "beauty-inbox-conversation-col",
            isConstellationInbox && "constellation-inbox-conversation-col",
          )}
        >
          {!selectedId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <MessageSquare className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="font-medium">Select a conversation</p>
              <p className="text-sm text-muted-foreground mt-1">
                Choose a conversation to read the thread
              </p>
            </div>
          ) : isLoadingDetail && !detailData ? (
            <div className="p-4 space-y-3">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="relative flex flex-col flex-1 min-h-0 overflow-hidden constellation-inbox-thread">
              {selectedConversation && (
                <div
                  className={cn(
                    "border-b border-border px-4 flex flex-col gap-3 shrink-0",
                    compactInboxCompose ? "py-2" : "py-3",
                  )}
                >
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="font-semibold truncate flex items-center gap-2">
                      <InboxChannelIcon channel={selectedConversation.channel} size="md" />
                      {selectedConversation.customerId ? (
                        <Link
                          href={`/customers/${selectedConversation.customerId}`}
                          className="hover:text-primary transition-colors truncate"
                          data-testid="inbox-thread-customer-link"
                        >
                          {selectedConversation.customerName ?? "Guest"}
                        </Link>
                      ) : (
                        selectedConversation.customerName ?? "Anonymous visitor"
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {selectedConversation.customerEmail ??
                        selectedConversation.customerPhone ??
                        "no contact info shared"}
                    </div>
                    {guestChannelContext.multi ? (
                      <p
                        className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1.5"
                        data-testid="inbox-unified-channels"
                      >
                        <span>Liv on</span>
                        <InboxChannelIconRow channels={guestChannelContext.channels} size="sm" />
                      </p>
                    ) : null}
                    {selectedConversation.customerId && businessId ? (
                      <InboxRelationshipChip
                        businessId={businessId}
                        customerId={selectedConversation.customerId}
                        compact
                        className="mt-1.5 lg:hidden"
                      />
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <HelpSupportDialog
                      defaultCategory="liv_error"
                      context={{
                        conversationId: selectedId,
                        channel: selectedConversation.channel,
                      }}
                      trigger={
                        <Button
                          variant="ghost"
                          size="sm"
                          className={beautyOutlineButton(beautyChrome)}
                          data-testid="button-report-liv-inbox"
                        >
                          Report Liv
                        </Button>
                      }
                    />
                    {selectedConversation.status !== "HANDED_OFF" &&
                      selectedConversation.status !== "CLOSED" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className={beautyOutlineButton(beautyChrome)}
                          onClick={() => handleStatusChange("HANDED_OFF")}
                          disabled={updateConversation.isPending}
                          data-testid="button-take-over"
                        >
                          <HandHelping className="h-3.5 w-3.5 mr-1.5" />
                          Take over
                        </Button>
                      )}
                    {selectedConversation.status === "HANDED_OFF" &&
                    !replyDraft.trim() ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className={beautyOutlineButton(beautyChrome)}
                        onClick={() => handleStatusChange("OPEN")}
                        disabled={updateConversation.isPending}
                        data-testid="button-back-to-liv"
                      >
                        <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                        Release to Liv
                      </Button>
                    ) : null}
                    {selectedConversation.status !== "CLOSED" &&
                    !(
                      selectedConversation.caseIntent === "refund_request" ||
                      selectedConversation.summary?.toLowerCase().includes("refund")
                    ) ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className={beautyOutlineButton(beautyChrome)}
                        onClick={() => handleStatusChange("CLOSED")}
                        disabled={updateConversation.isPending}
                        data-testid="button-close-conversation"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                        Archive thread
                      </Button>
                    ) : null}
                  </div>
                  </div>
                  {selectedConversation.status !== "CLOSED" &&
                  (selectedConversation.caseIntent === "refund_request" ||
                    selectedConversation.summary?.toLowerCase().includes("refund")) ? (
                    <div
                      className={cn(
                        "flex flex-col gap-2 rounded-lg border px-3 py-3",
                        isConstellationInbox
                          ? "constellation-inbox-case-resolve border-[rgba(217,195,154,0.28)] bg-[rgba(217,195,154,0.06)]"
                          : "border-primary/30 bg-primary/5",
                      )}
                      data-testid="inbox-case-resolve"
                    >
                      <p className="text-xs font-medium text-foreground">
                        Refund request — reply below, then confirm refund and booking update.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          disabled={resolving}
                          data-testid="inbox-resolve-refund"
                          onClick={() =>
                            setResolveDialog({ outcome: "refund_and_cancel", refundMinor: 6000 })
                          }
                        >
                          Refund & close case
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={resolving}
                          data-testid="inbox-resolve-cancel-no-refund"
                          onClick={() => setResolveDialog({ outcome: "cancel_no_refund" })}
                        >
                          Cancel appointment
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={resolving}
                          data-testid="inbox-resolve-close-case"
                          onClick={() => setResolveDialog({ outcome: "close_no_action" })}
                        >
                          Close case
                        </Button>
                      </div>
                    </div>
                  ) : null}
                  {selectedConversation.status === "CLOSED" &&
                  resolutionSummary(selectedConversation.resolution) ? (
                    <p
                      className="text-xs text-muted-foreground px-4"
                      data-testid="inbox-resolution-summary"
                    >
                      Outcome: {resolutionSummary(selectedConversation.resolution)}
                    </p>
                  ) : null}
                </div>
              )}

              <div
                className={cn(
                  "flex-1 min-h-[12rem] overflow-y-auto p-4 space-y-3 motion-wizard-enter inbox-messages-scroll",
                  beautyChrome ? "beauty-inbox-messages" : "bg-background/30",
                  wellnessInboxMorph && "wellness-inbox-messages-scroll",
                  beautyInboxMorph && "beauty-inbox-messages-scroll",
                  isConstellationInbox && "constellation-inbox-messages-scroll",
                )}
                style={
                  inboxMessagesMinHeight(threadMessageCount, { ownerComposing: ownerCanReply })
                    ? {
                        minHeight: inboxMessagesMinHeight(threadMessageCount, {
                          ownerComposing: ownerCanReply,
                        }),
                      }
                    : undefined
                }
                data-testid="inbox-messages-scroll"
              >
                {isDetailError && !detailData ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Could not load this thread — select another conversation or refresh.
                  </p>
                ) : null}

                {threadMessages
                  .filter((m) => m.role !== "SYSTEM")
                  .map((m) => {
                    if (m.role === "TOOL") {
                      return (
                        <details
                          key={m.id}
                          className="text-[11px] font-mono text-muted-foreground bg-muted/40 rounded px-2 py-1 max-w-[80%]"
                        >
                          <summary className="cursor-pointer">
                            ⚙ {m.toolName ?? "tool"} {m.bookingId && `→ booked #${m.bookingId.slice(-6)}`}
                          </summary>
                          <pre className="mt-1 whitespace-pre-wrap break-all">{m.content}</pre>
                        </details>
                      );
                    }
                    const isUser = m.role === "USER";
                    const isStaff = m.role === "ASSISTANT" && !!m.authorUserId;
                    const isLiv = m.role === "ASSISTANT" && !m.authorUserId;
                    const msgChannel =
                      m.channel ??
                      (m.conversationId
                        ? conversations.find((c) => c.id === m.conversationId)?.channel
                        : undefined) ??
                      selectedConversation?.channel;
                    const isReplyTarget = isInboxReplyChannelSelected(
                      replyChannelPick,
                      m,
                      guestChannelContext,
                      selectedId ?? "",
                      conversations,
                      selectedConversation?.channel,
                    );
                    return (
                      <div
                        key={m.id}
                        className={cn(
                          "flex gap-2 items-end",
                          isUser ? "justify-end" : "justify-start",
                        )}
                      >
                        {!isUser && isLiv ? (
                          <div
                            className={cn(
                              "h-7 w-7 rounded-full flex items-center justify-center shrink-0 mb-0.5",
                              beautyChrome
                                ? "beauty-inbox-avatar"
                                : isConstellationInbox
                                  ? "constellation-inbox-avatar"
                                  : "bg-primary/15",
                            )}
                          >
                            <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
                          </div>
                        ) : null}
                        {!isUser && guestChannelContext.multi && msgChannel ? (
                          <button
                            type="button"
                            data-inbox-channel-pick
                            onClick={() => selectReplyChannelForMessage(m)}
                            className={cn(
                              "shrink-0 mb-1 rounded-md p-1 transition-colors",
                              isReplyTarget
                                ? "bg-primary/20 ring-2 ring-primary/50"
                                : "hover:bg-muted/60 opacity-80 hover:opacity-100",
                            )}
                            title={inboxReplyOnChannelLabel(msgChannel)}
                            aria-label={inboxReplyOnChannelLabel(msgChannel)}
                            data-testid={`inbox-msg-channel-${m.id}`}
                          >
                            <InboxChannelIcon channel={msgChannel} size="sm" />
                          </button>
                        ) : null}
                        <div
                          data-testid={`thread-msg-${m.role.toLowerCase()}`}
                          className={cn(
                            "max-w-[80%] rounded-2xl px-3.5 py-2 text-[15px] leading-[1.45] whitespace-pre-wrap",
                            isUser
                              ? beautyChrome
                                ? "beauty-inbox-bubble--guest rounded-br-sm"
                                : isConstellationInbox
                                  ? "constellation-inbox-bubble--guest rounded-br-sm"
                                  : "bg-primary text-primary-foreground rounded-br-sm"
                              : isStaff
                                ? beautyChrome
                                  ? "beauty-inbox-bubble--team rounded-bl-sm"
                                  : isConstellationInbox
                                    ? "constellation-inbox-bubble--team rounded-bl-sm"
                                    : "bg-[hsl(var(--chart-3))]/20 border border-[hsl(var(--chart-3))]/30 rounded-bl-sm"
                                : beautyChrome
                                  ? "beauty-inbox-bubble--liv rounded-bl-sm"
                                  : isConstellationInbox
                                    ? "constellation-inbox-bubble--liv rounded-bl-sm"
                                    : "bg-muted rounded-bl-sm",
                          )}
                        >
                          {isStaff ? (
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                              Team
                            </p>
                          ) : null}
                          <div>{m.content}</div>
                          {m.bookingId && (
                            <div className="mt-1 pt-1 border-t border-foreground/10 text-[10px] font-mono opacity-70">
                              ✓ Booking #{m.bookingId.slice(-6)}
                            </div>
                          )}
                          <div
                            className={`text-[10px] mt-1 opacity-60 ${
                              isUser ? "text-right" : ""
                            }`}
                          >
                            {formatTime(m.createdAt)}
                          </div>
                        </div>
                        {isUser && guestChannelContext.multi && msgChannel ? (
                          <button
                            type="button"
                            data-inbox-channel-pick
                            onClick={() => selectReplyChannelForMessage(m)}
                            className={cn(
                              "shrink-0 mb-1 rounded-md p-1 transition-colors",
                              isReplyTarget
                                ? "bg-primary/20 ring-2 ring-primary/50"
                                : "hover:bg-muted/60 opacity-80 hover:opacity-100",
                            )}
                            title={inboxReplyOnChannelLabel(msgChannel)}
                            aria-label={inboxReplyOnChannelLabel(msgChannel)}
                          >
                            <InboxChannelIcon channel={msgChannel} size="sm" />
                          </button>
                        ) : null}
                      </div>
                    );
                  })}

                {!isDetailError && detailData && threadMessages.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No messages yet
                  </p>
                )}
              </div>

              {selectedId && ownerCanReply ? (
                <div
                  className={cn(
                    "shrink-0 border-t backdrop-blur-sm z-10 constellation-inbox-footer",
                    compactInboxCompose ? "p-2 space-y-1.5" : "p-3 space-y-2",
                    wellnessInboxMorph && "wellness-inbox-compose",
                    beautyChrome && "beauty-inbox-compose",
                    beautyInboxMorph && "beauty-inbox-compose--compact",
                    isConstellationInbox && "constellation-inbox-compose",
                    !beautyChrome && !wellnessInboxMorph && !isConstellationInbox && "border-border bg-card/95 mt-auto",
                  )}
                >
                  <p className="sr-only" data-testid="inbox-thread-channel-hint">
                    {inboxReplyDeliveredOnChannel(effectiveReplyChannel)}
                  </p>
                  <div className="relative">
                    <Textarea
                      placeholder={inboxReplyPlaceholderForCompose(
                        effectiveReplyChannel,
                        guestChannelContext.multi,
                        replyDetailReady,
                      )}
                      value={replyDraft}
                      onChange={(e) => setReplyDraft(e.target.value)}
                      rows={2}
                      className={cn(
                        "resize-none text-sm bg-background/80 pr-12",
                        beautyChrome
                          ? "border-border/80 focus-visible:ring-primary/30"
                          : isConstellationInbox
                            ? "constellation-inbox-reply-input border-border/80 focus-visible:ring-primary/30"
                            : "border-primary/35 ring-1 ring-primary/25 focus-visible:ring-2 focus-visible:ring-primary/50",
                      )}
                      data-testid="inbox-reply-input"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          if (!sending && replyDraft.trim()) {
                            void sendOwnerReply(selectedConversation?.status === "HANDED_OFF");
                          }
                        }
                      }}
                    />
                    <Button
                      type="button"
                      size="icon"
                      className={cn(
                        "absolute bottom-2 right-2 h-8 w-8 rounded-full shrink-0",
                        beautyPrimaryButton(beautyChrome),
                      )}
                      disabled={sending || !replyDraft.trim()}
                      data-testid="inbox-send-reply"
                      aria-label={
                        selectedConversation?.status === "HANDED_OFF"
                          ? "Send reply and return thread to Liv"
                          : "Send reply"
                      }
                      onClick={() =>
                        void sendOwnerReply(selectedConversation?.status === "HANDED_OFF")
                      }
                    >
                      <ArrowUp className="h-4 w-4" aria-hidden />
                    </Button>
                  </div>
                  {selectedConversation?.status === "HANDED_OFF" && replyDraft.trim() ? (
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      data-testid="inbox-release-without-send"
                      disabled={updateConversation.isPending}
                      onClick={() => handleStatusChange("OPEN")}
                    >
                      Release to Liv without sending
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          )}
        </div>

        {showContextRail ? (
          <InboxContextRail
            businessId={businessId ?? ""}
            conversation={selectedConversation}
            beautyChrome={beautyChrome}
          />
        ) : null}
      </div>

      <InboxResolveDialog
        open={resolveDialog !== null}
        outcome={resolveDialog?.outcome ?? null}
        refundMinor={resolveDialog?.refundMinor}
        customerName={selectedConversation?.customerName ?? undefined}
        busy={resolving}
        onOpenChange={(open) => {
          if (!open) setResolveDialog(null);
        }}
        onConfirm={(message) => {
          if (!resolveDialog) return;
          void resolveCase(resolveDialog.outcome, {
            refundMinor: resolveDialog.refundMinor,
            customerMessage: message,
          });
        }}
      />
    </OperationalPageShell>
  );
}
