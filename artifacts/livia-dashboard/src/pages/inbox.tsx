import { useState, useMemo, useEffect } from "react";
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
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { OperationalPageShell } from "@/components/layout/operational-page-shell";
import { LivInboxAssist } from "@/components/inbox/liv-inbox-assist";
import { HelpSupportDialog } from "@/components/help-support-dialog";
import { usePersona } from "@/lib/persona";
import { useUser } from "@clerk/clerk-react";
import { timeGreeting } from "@/lib/persona-rituals";
import {
  countByInboxQueueLens,
  defaultInboxQueueLens,
  inboxScreenTitle,
  INBOX_QUEUE_LENS_LABELS,
  matchesInboxQueueLens,
  type InboxQueueLens,
} from "@workspace/policy";
import { InboxLinkedBooking } from "@/components/inbox/inbox-linked-booking";
import { invalidateOperationalState, OPERATIONAL_REFETCH_MS } from "@/lib/operational-cache";
import { apiFetch } from "@/lib/api-fetch";
import { Textarea } from "@/components/ui/textarea";
import {
  Sparkles,
  User as UserIcon,
  CheckCircle2,
  HandHelping,
  CalendarCheck,
  MessageSquare,
  Globe,
  Phone,
} from "lucide-react";

interface ConversationListItem {
  id: string;
  channel: string;
  status: string;
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
}

interface ConversationDetail {
  conversation: ConversationListItem;
  messages: ConversationMessageItem[];
}

interface ConversationMessageItem {
  id: string;
  role: "USER" | "ASSISTANT" | "SYSTEM" | "TOOL";
  content: string;
  toolName: string | null;
  bookingId: string | null;
  authorUserId?: string | null;
  createdAt: string;
}

function formatRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function channelIcon(channel: string) {
  switch (channel) {
    case "WEB":
      return <Globe className="h-3 w-3" />;
    case "WHATSAPP":
      return <MessageSquare className="h-3 w-3 text-emerald-500" />;
    case "INSTAGRAM":
      return <Sparkles className="h-3 w-3 text-pink-500" />;
    case "MESSENGER":
      return <MessageSquare className="h-3 w-3 text-blue-500" />;
    case "SMS":
      return <Phone className="h-3 w-3" />;
    case "VOICE":
      return <MessageSquare className="h-3 w-3" />;
    default:
      return <MessageSquare className="h-3 w-3" />;
  }
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

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"OPEN" | "HANDED_OFF" | "CLOSED" | "ALL">("OPEN");
  const [queueLens, setQueueLens] = useState<InboxQueueLens>("liv_handling");
  const [replyDraft, setReplyDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [livAssisting, setLivAssisting] = useState(false);

  const showRitual = persona === "manager" || persona === "owner" || persona === "org_admin";

  useEffect(() => {
    if (showRitual) setQueueLens(defaultInboxQueueLens(persona));
  }, [persona, showRitual]);

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

  const { data: detail, isLoading: isLoadingDetail } = useGetConversation(
    businessId,
    selectedId ?? "",
    {
      query: {
        enabled: !!businessId && !!selectedId,
        refetchInterval: 5_000,
      } as any,
    },
  );

  const updateConversation = useUpdateConversation();

  const conversations = (convos ?? []) as unknown as ConversationListItem[];
  const queueCounts = useMemo(() => countByInboxQueueLens(conversations), [conversations]);
  const filteredConversations = useMemo(() => {
    if (!showRitual) return conversations;
    return conversations.filter((c) => matchesInboxQueueLens(c, queueLens));
  }, [conversations, queueLens, showRitual]);

  const detailData = detail as
    | { conversation: ConversationListItem; messages: ConversationMessageItem[] }
    | undefined;

  const selectedConversation = useMemo(() => {
    if (!selectedId) return null;
    return (
      detailData?.conversation ?? conversations.find((c) => c.id === selectedId) ?? null
    );
  }, [selectedId, detailData, conversations]);

  const [resolving, setResolving] = useState(false);

  async function resolveCase(
    outcome: "refund_and_cancel" | "cancel_no_refund" | "close_no_action",
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
      toast({
        title: "Case resolved",
        description: result.effects?.join(" · ") ?? "Done",
      });
    } catch (err: unknown) {
      toast({
        title: "Could not resolve case",
        description: err instanceof Error ? err.message : undefined,
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
                ? "AI paused — you've taken over"
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

  const ritualTitle =
    persona === "org_admin"
      ? `${inboxScreenTitle(persona)} · all locations`
      : `${inboxScreenTitle(persona)} · ${business?.name ?? "this shop"}`;

  const QUEUE_LENSES: InboxQueueLens[] = [
    "needs_you",
    "liv_handling",
    "taken_over",
    "closed",
  ];

  return (
    <OperationalPageShell
      title={showRitual ? ritualTitle : "Inbox"}
      subtitle={
        showRitual
          ? INBOX_QUEUE_LENS_LABELS[queueLens].description
          : "Conversations between your customers and Liv"
      }
      actions={
        <div className="flex items-center gap-1 bg-muted rounded-md p-1 flex-wrap max-w-full">
          {showRitual
            ? QUEUE_LENSES.map((lens) => (
                <button
                  key={lens}
                  type="button"
                  data-testid={`queue-lens-${lens}`}
                  onClick={() => setQueueLens(lens)}
                  className={`text-xs px-3 py-1 rounded transition-colors whitespace-nowrap ${
                    queueLens === lens
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {INBOX_QUEUE_LENS_LABELS[lens].short}
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
      <div className="grid grid-cols-1 md:grid-cols-[360px_1fr] gap-4">
        {/* Conversation list */}
        <Card className="flex flex-col">
          {isLoadingConvos ? (
            <div className="p-3 space-y-2">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-3">
                <Sparkles className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="font-medium text-sm">
                {showRitual ? `No threads in “${INBOX_QUEUE_LENS_LABELS[queueLens].short}”` : "No conversations yet"}
              </p>
              <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">
                {showRitual
                  ? INBOX_QUEUE_LENS_LABELS[queueLens].description
                  : "When customers message Liv on your booking page or SMS line, conversations appear here."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredConversations.map((c) => {
                const isActive = selectedId === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    data-testid={`conversation-${c.id}`}
                    onClick={() => setSelectedId(c.id)}
                    className={`w-full text-left px-4 py-3 transition-colors ${
                      isActive ? "bg-primary/10" : "hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary/30 to-[hsl(var(--chart-1))]/30 flex items-center justify-center shrink-0">
                          <UserIcon className="h-3.5 w-3.5" />
                        </div>
                        <span className="font-medium text-sm truncate">
                          {c.customerName ?? "Anonymous visitor"}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {formatRelative(c.lastMessageAt)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1 mb-1.5">
                      {c.lastMessage ??
                        c.summary ??
                        (c.aiHandled ? "Liv is handling this thread" : "(no messages yet)")}
                    </p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge
                        variant="outline"
                        className="h-5 px-1.5 text-[10px] gap-1 font-normal"
                      >
                        {channelIcon(c.channel)}
                        {c.channel}
                      </Badge>
                      {c.status === "HANDED_OFF" ? (
                        <Badge className="h-5 px-1.5 text-[10px] gap-1 bg-[hsl(var(--chart-4))]/15 text-[hsl(var(--chart-4))] border-[hsl(var(--chart-4))]/30">
                          <HandHelping className="h-2.5 w-2.5" />
                          You
                        </Badge>
                      ) : c.aiHandled ? (
                        <Badge className="h-5 px-1.5 text-[10px] gap-1 bg-primary/15 text-primary border-primary/30">
                          <Sparkles className="h-2.5 w-2.5" />
                          AI
                        </Badge>
                      ) : null}
                      {c.bookingCount > 0 && (
                        <Badge className="h-5 px-1.5 text-[10px] gap-1 bg-[hsl(var(--chart-3))]/15 text-[hsl(var(--chart-3))] border-[hsl(var(--chart-3))]/30">
                          <CalendarCheck className="h-2.5 w-2.5" />
                          {c.bookingCount} booking{c.bookingCount > 1 ? "s" : ""}
                        </Badge>
                      )}
                      {c.status === "CLOSED" && (
                        <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                          Closed
                        </Badge>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </Card>

        {/* Thread view */}
        <Card className="flex flex-col min-h-0 overflow-hidden">
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
            <>
              {selectedConversation && (
                <div className="border-b border-border px-4 py-3 flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="font-semibold truncate">
                      {selectedConversation.customerName ?? "Anonymous visitor"}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {selectedConversation.customerEmail ??
                        selectedConversation.customerPhone ??
                        "no contact info shared"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <HelpSupportDialog
                      defaultCategory="liv_error"
                      context={{
                        conversationId: selectedId,
                        channel: selectedConversation.channel,
                      }}
                      trigger={
                        <Button variant="ghost" size="sm" data-testid="button-report-liv-inbox">
                          Report Liv
                        </Button>
                      }
                    />
                    {selectedConversation.status !== "HANDED_OFF" &&
                      selectedConversation.status !== "CLOSED" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange("HANDED_OFF")}
                          disabled={updateConversation.isPending}
                          data-testid="button-take-over"
                        >
                          <HandHelping className="h-3.5 w-3.5 mr-1.5" />
                          Take over
                        </Button>
                      )}
                    {selectedConversation.status === "HANDED_OFF" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange("OPEN")}
                        disabled={updateConversation.isPending}
                        data-testid="button-resume-ai"
                      >
                        <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                        Resume AI
                      </Button>
                    )}
                    {selectedConversation.status !== "CLOSED" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange("CLOSED")}
                        disabled={updateConversation.isPending}
                        data-testid="button-close-conversation"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                        Close (no action)
                      </Button>
                    )}
                  </div>
                  </div>
                  {selectedConversation.status !== "CLOSED" &&
                  (selectedConversation.caseIntent === "refund_request" ||
                    selectedConversation.summary?.toLowerCase().includes("refund")) ? (
                    <div className="flex flex-wrap gap-2" data-testid="inbox-case-resolve">
                      <Button
                        size="sm"
                        variant="default"
                        disabled={resolving}
                        data-testid="inbox-resolve-refund"
                        onClick={() =>
                          void resolveCase("refund_and_cancel", {
                            refundMinor: 6000,
                            customerMessage:
                              "Hi Sean — your €60 deposit refund is processed and today's appointment is cancelled. Hope we see you again soon.",
                          })
                        }
                      >
                        Refund €60 + cancel booking
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={resolving}
                        onClick={() =>
                          void resolveCase("cancel_no_refund", {
                            customerMessage:
                              "Hi Sean — we've cancelled today's appointment per our late-cancel policy. The deposit isn't refundable this time.",
                          })
                        }
                      >
                        Cancel only (no refund)
                      </Button>
                    </div>
                  ) : null}
                </div>
              )}

              {selectedConversation?.linkedBookingId && businessId ? (
                <InboxLinkedBooking
                  businessId={businessId}
                  bookingId={selectedConversation.linkedBookingId}
                />
              ) : null}

              <div className="p-4 space-y-3 bg-background/30">
                {detailData?.messages
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
                    return (
                      <div
                        key={m.id}
                        className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          data-testid={`thread-msg-${m.role.toLowerCase()}`}
                          className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap ${
                            isUser
                              ? "bg-primary text-primary-foreground rounded-br-sm"
                              : isStaff
                                ? "bg-[hsl(var(--chart-3))]/20 border border-[hsl(var(--chart-3))]/30 rounded-bl-sm"
                                : "bg-muted rounded-bl-sm"
                          }`}
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
                      </div>
                    );
                  })}

                {detailData?.messages.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No messages yet
                  </p>
                )}
              </div>

              {selectedId && selectedConversation?.status !== "CLOSED" ? (
                <div className="border-t border-border p-3 space-y-2 bg-card/80">
                  {(selectedConversation?.status === "OPEN" ||
                    selectedConversation?.status === "HANDED_OFF") ? (
                    <LivInboxAssist
                      mode={
                        selectedConversation?.status === "HANDED_OFF" ? "handoff" : "open"
                      }
                      disabled={livAssisting || sending}
                      loading={livAssisting}
                      onAsk={async (prompt) => {
                        if (!businessId || !selectedId) return;
                        setLivAssisting(true);
                        try {
                          const result = await apiFetch<{
                            reply: string;
                            toolsUsed?: string[];
                          }>(
                            `/businesses/${businessId}/conversations/${selectedId}/liv-assist`,
                            {
                              method: "POST",
                              body: JSON.stringify({ message: prompt }),
                            },
                          );
                          setReplyDraft(result.reply);
                          await qc.invalidateQueries({
                            queryKey: getGetConversationQueryKey(businessId, selectedId),
                          });
                          const tools = result.toolsUsed?.length
                            ? ` · Tools: ${result.toolsUsed.join(", ")}`
                            : "";
                          toast({
                            title: "Liv drafted a reply",
                            description: `Review before sending${tools}`,
                          });
                        } catch (err: unknown) {
                          toast({
                            title: "Liv could not assist",
                            description: err instanceof Error ? err.message : "Try again",
                            variant: "destructive",
                          });
                        } finally {
                          setLivAssisting(false);
                        }
                      }}
                    />
                  ) : null}
                  {selectedConversation?.status === "HANDED_OFF" ? (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <HandHelping className="h-3.5 w-3.5 shrink-0" />
                      Liv is paused — your reply goes to the customer on their channel when configured.
                    </p>
                  ) : null}
                  <Textarea
                    placeholder="Reply to customer…"
                    value={replyDraft}
                    onChange={(e) => setReplyDraft(e.target.value)}
                    rows={2}
                    className="resize-none text-sm"
                    data-testid="inbox-reply-input"
                  />
                  <div className="flex flex-wrap justify-end gap-2">
                    {selectedConversation?.status === "OPEN" ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={livAssisting || sending}
                        data-testid="inbox-ask-liv"
                        onClick={async () => {
                          if (!businessId || !selectedId) return;
                          setLivAssisting(true);
                          try {
                            const prompt =
                              replyDraft.trim() ||
                              "Read this thread and draft the next helpful reply for the customer. Be concise and on-brand.";
                            const result = await apiFetch<{ reply: string }>(
                              `/businesses/${businessId}/conversations/${selectedId}/liv-assist`,
                              {
                                method: "POST",
                                body: JSON.stringify({ message: prompt }),
                              },
                            );
                            setReplyDraft(result.reply);
                            await qc.invalidateQueries({
                              queryKey: getGetConversationQueryKey(businessId, selectedId),
                            });
                            toast({ title: "Liv drafted a reply — review before sending" });
                          } catch (err: unknown) {
                            toast({
                              title: "Liv could not assist",
                              description: err instanceof Error ? err.message : "Try again",
                              variant: "destructive",
                            });
                          } finally {
                            setLivAssisting(false);
                          }
                        }}
                      >
                        <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                        {livAssisting ? "Liv is thinking…" : "Ask Liv"}
                      </Button>
                    ) : null}
                    <Button
                      size="sm"
                      disabled={sending || !replyDraft.trim()}
                      data-testid="inbox-send-reply"
                      onClick={async () => {
                        if (!businessId || !selectedId) return;
                        setSending(true);
                        try {
                          await apiFetch(
                            `/businesses/${businessId}/conversations/${selectedId}/messages`,
                            {
                              method: "POST",
                              body: JSON.stringify({ content: replyDraft.trim() }),
                            },
                          );
                          setReplyDraft("");
                          await qc.invalidateQueries({
                            queryKey: getGetConversationQueryKey(businessId, selectedId),
                          });
                          await qc.invalidateQueries({
                            queryKey: getListConversationsQueryKey(businessId),
                          });
                          toast({ title: "Reply sent" });
                        } catch (err: unknown) {
                          toast({
                            title: "Could not send reply",
                            description: err instanceof Error ? err.message : "Send failed",
                            variant: "destructive",
                          });
                        } finally {
                          setSending(false);
                        }
                      }}
                    >
                      {sending ? "Sending…" : "Send reply"}
                    </Button>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </Card>
      </div>
    </OperationalPageShell>
  );
}
