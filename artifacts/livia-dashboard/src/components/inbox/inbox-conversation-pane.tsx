import { useMemo, useState } from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetConversation,
  useUpdateConversation,
  getGetConversationQueryKey,
  getListConversationsQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api-fetch";
import { invalidateOperationalState } from "@/lib/operational-cache";
import { inboxReplyDeliveredOnChannel, inboxReplyPlaceholder } from "@workspace/policy";
import { CheckCircle2, Globe, HandHelping, MessageSquare, Phone, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type ConversationHeader = {
  id: string;
  channel: string;
  status: string;
  customerId?: string | null;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  aiHandled: boolean;
};

function channelIcon(channel: string) {
  switch (channel) {
    case "WEB":
      return <Globe className="h-3 w-3" />;
    case "WHATSAPP":
      return <MessageSquare className="h-3 w-3 text-emerald-500" />;
    case "SMS":
      return <Phone className="h-3 w-3" />;
    default:
      return <MessageSquare className="h-3 w-3" />;
  }
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/** Slim thread pane for consult-first unified inbox (no booking context rail). */
export function InboxConversationPane({
  businessId,
  conversationId,
}: {
  businessId: string;
  conversationId: string;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [replyDraft, setReplyDraft] = useState("");
  const [sending, setSending] = useState(false);

  const { data: detail, isLoading } = useGetConversation(businessId, conversationId, {
    query: {
      enabled: !!businessId && !!conversationId,
      refetchInterval: 5_000,
    } as never,
  });

  const updateConversation = useUpdateConversation();

  const conversation = (detail as { conversation?: ConversationHeader } | undefined)?.conversation;
  const messages =
    (detail as { messages?: Array<{ id: string; role: string; content: string; createdAt: string }> })
      ?.messages ?? [];

  const visibleMessages = useMemo(
    () => messages.filter((m) => m.role === "USER" || m.role === "ASSISTANT"),
    [messages],
  );

  async function handleStatusChange(status: "OPEN" | "HANDED_OFF" | "CLOSED") {
    if (!businessId || !conversationId) return;
    await new Promise<void>((resolve, reject) => {
      updateConversation.mutate(
        { businessId, conversationId, data: { status } },
        { onSuccess: () => resolve(), onError: () => reject(new Error("status failed")) },
      );
    });
    invalidateOperationalState(qc, businessId);
    await qc.invalidateQueries({ queryKey: getGetConversationQueryKey(businessId, conversationId) });
    await qc.invalidateQueries({ queryKey: getListConversationsQueryKey(businessId) });
  }

  async function sendReply(releaseAfterSend = false) {
    if (!businessId || !conversationId || !replyDraft.trim() || sending) return;
    setSending(true);
    try {
      await apiFetch(`/businesses/${businessId}/conversations/${conversationId}/messages`, {
        method: "POST",
        body: JSON.stringify({ content: replyDraft.trim() }),
      });
      setReplyDraft("");
      if (releaseAfterSend) await handleStatusChange("OPEN");
      invalidateOperationalState(qc, businessId);
      await qc.invalidateQueries({ queryKey: getGetConversationQueryKey(businessId, conversationId) });
      await qc.invalidateQueries({ queryKey: getListConversationsQueryKey(businessId) });
      toast({ title: releaseAfterSend ? "Sent — Liv's back on this thread" : "Reply sent" });
    } catch {
      toast({ title: "Could not send reply", variant: "destructive" });
    } finally {
      setSending(false);
    }
  }

  if (isLoading && !conversation) {
    return (
      <div className="p-4 space-y-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (!conversation) {
    return <p className="p-4 text-sm text-muted-foreground">Thread not found.</p>;
  }

  const releaseAfterSend = conversation.status === "HANDED_OFF" && replyDraft.trim().length > 0;

  return (
    <div className="flex flex-col h-full min-h-[420px] bg-gradient-to-b from-muted/20 to-background" data-testid="inbox-conversation-pane">
      <div className="border-b px-4 py-3 space-y-2 shrink-0 bg-card/80 backdrop-blur-sm">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="min-w-0">
            <div className="font-semibold truncate flex items-center gap-2">
              {channelIcon(conversation.channel)}
              {conversation.customerId ? (
                <Link href={`/customers/${conversation.customerId}`} className="hover:text-primary truncate">
                  {conversation.customerName ?? "Client"}
                </Link>
              ) : (
                (conversation.customerName ?? "Anonymous visitor")
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {conversation.customerEmail ?? conversation.customerPhone ?? "No contact on file"}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {inboxReplyDeliveredOnChannel(conversation.channel)}
            </p>
          </div>
          <div className="flex flex-wrap gap-1">
            {conversation.status !== "HANDED_OFF" && conversation.status !== "CLOSED" ? (
              <Button size="sm" variant="outline" onClick={() => void handleStatusChange("HANDED_OFF")}>
                <HandHelping className="h-3.5 w-3.5 mr-1" />
                Take over
              </Button>
            ) : null}
            {conversation.status === "HANDED_OFF" && !replyDraft.trim() ? (
              <Button size="sm" variant="outline" onClick={() => void handleStatusChange("OPEN")}>
                <Sparkles className="h-3.5 w-3.5 mr-1" />
                Release to Liv
              </Button>
            ) : null}
            {conversation.status !== "CLOSED" ? (
              <Button size="sm" variant="ghost" onClick={() => void handleStatusChange("CLOSED")}>
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                Archive
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent">
        {visibleMessages.map((m) => {
          const isClient = m.role === "USER";
          return (
            <div
              key={m.id}
              className={cn("flex", isClient ? "justify-start" : "justify-end")}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm",
                  isClient
                    ? "bg-card border border-border/80 rounded-tl-sm"
                    : "bg-primary/15 border border-primary/20 text-foreground rounded-tr-sm",
                )}
              >
                <p className="text-[10px] font-medium uppercase tracking-wide mb-1 opacity-60">
                  {isClient ? "Client" : "Liv / You"}
                </p>
                <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                <p className="text-[10px] text-muted-foreground mt-1.5 tabular-nums">{formatTime(m.createdAt)}</p>
              </div>
            </div>
          );
        })}
        {visibleMessages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No messages yet.</p>
        ) : null}
      </div>

      {conversation.status !== "CLOSED" ? (
        <div className="border-t p-3 space-y-2 shrink-0 bg-card/90 backdrop-blur-sm">
          <Textarea
            value={replyDraft}
            onChange={(e) => setReplyDraft(e.target.value)}
            placeholder={inboxReplyPlaceholder(conversation.channel)}
            rows={2}
            className="resize-none text-sm"
          />
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              disabled={!replyDraft.trim() || sending}
              onClick={() => void sendReply(releaseAfterSend)}
            >
              {releaseAfterSend ? "Send & release to Liv" : "Send reply"}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
