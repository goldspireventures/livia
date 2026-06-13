import { useState } from "react";
import { useBusiness } from "@/lib/business-context";
import { apiFetch } from "@/lib/api-fetch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type AssistMessage = { role: "user" | "assistant"; content: string };

export function OwnerLivOpsPanel({
  className,
  compact,
  variant,
}: {
  className?: string;
  compact?: boolean;
  variant?: "default" | "event-vendors";
}) {
  const { business } = useBusiness();
  const bid = business?.id ?? "";
  const isEventVendor = variant === "event-vendors";
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<AssistMessage[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  async function send(prompt?: string) {
    const text = (prompt ?? message).trim();
    if (!bid || !text || loading) return;
    setLoading(true);
    setMessage("");
    try {
      const res = await apiFetch<{ reply: string; suggestions: string[] }>(
        `/businesses/${bid}/liv-owner/assist`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text, history }),
        },
      );
      setHistory((h) => [
        ...h,
        { role: "user", content: text },
        { role: "assistant", content: res.reply },
      ]);
      setSuggestions(res.suggestions ?? []);
    } finally {
      setLoading(false);
    }
  }

  const lastReply = [...history].reverse().find((m) => m.role === "assistant")?.content;

  return (
    <Card className={cn("border-primary/20", className)} data-testid="owner-liv-ops-panel">
      <CardHeader className={compact ? "pb-2" : undefined}>
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Ask Liv
        </CardTitle>
        <CardDescription>
          {isEventVendor
            ? "Enquiries, quotes, and follow-ups — grounded in your pipeline."
            : "Revenue, inbox, and setup — grounded in your shop, not generic chat."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {lastReply ? (
          <p className="text-sm text-muted-foreground whitespace-pre-wrap border rounded-lg p-3 bg-muted/30">
            {lastReply}
          </p>
        ) : null}
        {suggestions.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <Button
                key={s}
                size="sm"
                variant="outline"
                className="h-auto py-1 px-2 text-xs whitespace-normal text-left max-w-full"
                disabled={loading}
                onClick={() => void send(s)}
              >
                {s.length > 48 ? `${s.slice(0, 46)}…` : s}
              </Button>
            ))}
          </div>
        ) : null}
        <div className="flex gap-2">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={
              isEventVendor
                ? "Which enquiries need a quote today?"
                : "What's worth my attention on the floor today?"
            }
            className="min-h-[72px] text-sm"
            disabled={loading || !bid}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
          />
          <Button disabled={loading || !bid || !message.trim()} onClick={() => void send()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ask"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
