import { useState, useRef, useEffect } from "react";
import { useSendPublicChatMessage } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Send, X, Loader2 } from "lucide-react";
import { AI_DISCLOSURE } from "@workspace/ai-disclosure";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  bookingId?: string | null;
}

const SUGGESTED = [
  "I need a haircut tomorrow afternoon",
  "What services do you offer?",
  "Book a 1-hour massage this weekend",
];

interface ChatWidgetProps {
  slug: string;
  businessName: string;
  greeting?: string;
  /** Jurisdiction pack copy; falls back to @workspace/ai-disclosure defaults. */
  disclosureFirstMessage?: string;
  disclosureFooterLine?: string;
  initialName?: string;
  initialEmail?: string;
  initialPhone?: string;
  onBooked?: (bookingId: string) => void;
}

export default function ChatWidget({
  slug,
  businessName,
  greeting,
  disclosureFirstMessage,
  disclosureFooterLine,
  initialName,
  initialEmail,
  initialPhone,
  onBooked,
}: ChatWidgetProps) {
  const firstMessage =
    disclosureFirstMessage ?? AI_DISCLOSURE.chatFirstMessage(businessName);
  const footerLine = disclosureFooterLine ?? AI_DISCLOSURE.chatFooterLine;
  const [open, setOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const sendMessage = useSendPublicChatMessage();

  useEffect(() => {
    if (open && messages.length === 0) {
      // EU AI Act Art. 50 — locked disclosure is ALWAYS the first message,
      // before any per-business greeting. Order matters: customer must see
      // the AI identity before the warmer greeting copy.
      const seed: ChatMessage[] = [
        {
          id: "disclosure",
          role: "assistant",
          content: firstMessage,
        },
      ];
      const customGreeting = greeting?.trim();
      if (customGreeting) {
        seed.push({ id: "greeting", role: "assistant", content: customGreeting });
      }
      setMessages(seed);
    }
  }, [open, greeting, businessName, messages.length]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sendMessage.isPending]);

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || sendMessage.isPending) return;

    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      role: "user",
      content: trimmed,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    sendMessage.mutate(
      {
        slug,
        data: {
          conversationId,
          message: trimmed,
          customerName: initialName,
          customerEmail: initialEmail,
          customerPhone: initialPhone,
        },
      },
      {
        onSuccess: (data: any) => {
          if (data.conversationId) setConversationId(data.conversationId);
          setMessages((prev) => [
            ...prev,
            {
              id: `a_${Date.now()}`,
              role: "assistant",
              content: data.reply,
              bookingId: data.bookingId,
            },
          ]);
          if (data.bookingId && onBooked) onBooked(data.bookingId);
        },
        onError: (err: any) => {
          const msg =
            err?.response?.data?.error ?? "Sorry, the assistant is having trouble. Try again?";
          setMessages((prev) => [
            ...prev,
            { id: `e_${Date.now()}`, role: "assistant", content: msg },
          ]);
        },
      },
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        data-testid="button-open-chat"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-[hsl(var(--chart-1))] px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[0_8px_30px_-6px_hsl(var(--primary)/0.6)] hover:scale-105 active:scale-95 transition-transform"
      >
        <Sparkles className="h-4 w-4" />
        Chat with AI
      </button>
    );
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex justify-end p-0 sm:p-4 md:items-end pointer-events-none">
      <div className="pointer-events-auto w-full sm:w-[400px] sm:max-w-full bg-card border border-border sm:rounded-2xl shadow-2xl flex flex-col h-[100dvh] sm:h-[600px] sm:max-h-[80vh] animate-in slide-in-from-bottom-4 fade-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-gradient-to-r from-primary/10 to-[hsl(var(--chart-1))]/10 sm:rounded-t-2xl">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-[hsl(var(--chart-1))]">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <div className="text-sm font-semibold leading-none">{businessName}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">AI booking assistant</div>
            </div>
          </div>
          <button
            type="button"
            data-testid="button-close-chat"
            onClick={() => setOpen(false)}
            className="text-muted-foreground hover:text-foreground p-1 rounded transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-background/50">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-200`}
            >
              <div
                data-testid={`msg-${m.role}`}
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-gradient-to-br from-primary to-[hsl(var(--chart-1))] text-primary-foreground rounded-br-sm"
                    : "bg-muted text-foreground rounded-bl-sm"
                }`}
              >
                {m.content}
                {m.bookingId && (
                  <div className="mt-2 pt-2 border-t border-foreground/10 text-[11px] font-mono opacity-80">
                    ✓ Booking confirmed · #{m.bookingId.slice(-6)}
                  </div>
                )}
              </div>
            </div>
          ))}

          {sendMessage.isPending && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3 text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span className="flex gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce"></span>
                </span>
              </div>
            </div>
          )}

          {messages.length <= 2 && !sendMessage.isPending && (
            <div className="flex flex-wrap gap-2 pt-2">
              {SUGGESTED.map((s) => (
                <button
                  key={s}
                  type="button"
                  data-testid={`suggested-${s.slice(0, 12)}`}
                  onClick={() => send(s)}
                  className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-muted/70 border border-border text-muted-foreground hover:text-foreground transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-center gap-2 px-3 py-3 border-t border-border bg-card sm:rounded-b-2xl"
        >
          <Input
            data-testid="input-chat-message"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about services, prices, availability..."
            disabled={sendMessage.isPending}
            className="flex-1"
          />
          <Button
            type="submit"
            size="icon"
            aria-label="Send message"
            disabled={!input.trim() || sendMessage.isPending}
            data-testid="button-send-chat"
            className="bg-gradient-to-br from-primary to-[hsl(var(--chart-1))]"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>

        {/* EU AI Act Art. 50 + Anthropic AUP — persistent disclosure footer. */}
        <div
          data-testid="chat-disclosure-footer"
          className="px-3 py-1.5 text-[10px] text-center text-muted-foreground border-t border-border bg-muted/30 sm:rounded-b-2xl"
        >
          {footerLine}
        </div>
      </div>
    </div>
  );
}
