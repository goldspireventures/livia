import { useState, useMemo } from "react";
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
import {
  Inbox as InboxIcon,
  Sparkles,
  User as UserIcon,
  CheckCircle2,
  HandHelping,
  CalendarCheck,
  MessageSquare,
  Globe,
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
  lastMessageAt: string;
  createdAt: string;
  messageCount: number;
  bookingCount: number;
}

interface ConversationMessageItem {
  id: string;
  role: "USER" | "ASSISTANT" | "SYSTEM" | "TOOL";
  content: string;
  toolName: string | null;
  bookingId: string | null;
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
    default:
      return <MessageSquare className="h-3 w-3" />;
  }
}

export default function InboxPage() {
  const { business } = useBusiness();
  const { toast } = useToast();
  const qc = useQueryClient();
  const businessId = business?.id ?? "";

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"OPEN" | "HANDED_OFF" | "CLOSED" | "ALL">("OPEN");

  const { data: convos, isLoading: isLoadingConvos } = useListConversations(
    businessId,
    statusFilter === "ALL" ? {} : { status: statusFilter },
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
  const detailData = detail as
    | { conversation: ConversationListItem; messages: ConversationMessageItem[] }
    | undefined;

  const selectedConversation = useMemo(() => {
    if (!selectedId) return null;
    return (
      detailData?.conversation ?? conversations.find((c) => c.id === selectedId) ?? null
    );
  }, [selectedId, detailData, conversations]);

  function handleStatusChange(status: "OPEN" | "HANDED_OFF" | "CLOSED") {
    if (!selectedId || !businessId) return;
    updateConversation.mutate(
      { businessId, conversationId: selectedId, data: { status } },
      {
        onSuccess: () => {
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

  return (
    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 h-[calc(100dvh-7rem)] md:h-[calc(100dvh-4rem)]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <InboxIcon className="h-6 w-6" />
            Inbox
          </h1>
          <p className="text-sm text-muted-foreground">
            Conversations between your customers and the AI assistant
          </p>
        </div>
        <div className="flex items-center gap-1 bg-muted rounded-md p-1">
          {(["OPEN", "HANDED_OFF", "CLOSED", "ALL"] as const).map((s) => (
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[360px_1fr] gap-4 flex-1 min-h-0">
        {/* Conversation list */}
        <Card className="flex flex-col min-h-0 overflow-hidden">
          {isLoadingConvos ? (
            <div className="p-3 space-y-2">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-3">
                <Sparkles className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="font-medium text-sm">No conversations yet</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">
                When customers chat with your AI assistant, conversations will show up here.
              </p>
            </div>
          ) : (
            <div className="overflow-y-auto flex-1 divide-y divide-border">
              {conversations.map((c) => {
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
                      {c.lastMessage ?? "(no messages yet)"}
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
                <div className="border-b border-border px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
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
                        Mark resolved
                      </Button>
                    )}
                  </div>
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-background/30">
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
                              : "bg-muted rounded-bl-sm"
                          }`}
                        >
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

              {selectedConversation?.status === "HANDED_OFF" && (
                <div className="border-t border-border bg-[hsl(var(--chart-4))]/5 px-4 py-3 text-xs text-muted-foreground">
                  <HandHelping className="h-3.5 w-3.5 inline mr-1" />
                  AI is paused. Customer messages are being saved but not auto-replied. Reach out via email or phone to follow up.
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
