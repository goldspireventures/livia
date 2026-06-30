import { useState } from "react";
import { Link } from "wouter";
import {
  useGetOwnerIntelligence,
  usePostLivOwnerAssist,
} from "@workspace/api-client-react";
import { useBusiness } from "@/lib/business-context";
import { LivMomentsStrip } from "@/components/ritual/liv-moments-strip";
import { OwnerIntelligenceStack } from "@/components/dashboard/owner-intelligence-stack";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, MessageSquare, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type Turn = { role: "user" | "assistant"; content: string };

const FALLBACK_PROMPTS = [
  "What's worth my attention today?",
  "What should I confirm on the calendar first?",
  "How do I tune how Liv greets guests on my booking page?",
];

export function LivSettingsOperationalPanel({
  className,
  compact,
}: {
  className?: string;
  compact?: boolean;
}) {
  const { business } = useBusiness();
  const bid = business?.id ?? "";
  const [message, setMessage] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const { data: intel } = useGetOwnerIntelligence(bid, {
    query: { enabled: !!bid, staleTime: 90_000 } as never,
  });

  const promptChips =
    suggestions.length > 0
      ? suggestions
      : (intel?.livPrompts?.length ? intel.livPrompts.slice(0, 3) : FALLBACK_PROMPTS);

  const assist = usePostLivOwnerAssist({
    mutation: {
      onSuccess: (result) => {
        setTurns((t) => [...t, { role: "assistant", content: result.reply }]);
        if (result.suggestions?.length) setSuggestions(result.suggestions);
      },
      onError: () => {
        setTurns((t) => [
          ...t,
          {
            role: "assistant",
            content: "Liv couldn't reach the server — try again or open Liv hub for the full thread.",
          },
        ]);
      },
    },
  });

  function send(prompt?: string) {
    const text = (prompt ?? message).trim();
    if (!text || !bid || assist.isPending) return;
    setMessage("");
    const history = turns.slice(-8);
    setTurns((t) => [...t, { role: "user", content: text }]);
    assist.mutate({ businessId: bid, data: { message: text, history } });
  }

  return (
    <div className={cn("space-y-4", className)} data-testid="liv-settings-operational-panel">
      <LivMomentsStrip />
      <OwnerIntelligenceStack variant="owner-home" />

      <Card className="border-primary/20" data-testid="liv-operational-ask">
        <CardHeader className={compact ? "pb-2" : undefined}>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Ask Liv
          </CardTitle>
          <CardDescription>
            Day-to-day questions — inbox, bookings, tone, and what to fix next. For full threads, open Liv hub.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {turns.length > 0 ? (
            <div className="max-h-40 overflow-y-auto space-y-2 rounded-md border border-border/60 p-3 text-sm bg-muted/30">
              {turns.map((t, i) => (
                <p
                  key={i}
                  className={t.role === "user" ? "text-foreground" : "text-muted-foreground"}
                >
                  {t.role === "user" ? "You: " : "Liv: "}
                  {t.content}
                </p>
              ))}
            </div>
          ) : null}
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask about today's floor, guest replies, or shop settings…"
            rows={compact ? 2 : 3}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />
          <div className="flex flex-wrap gap-2">
            {promptChips.map((s) => (
              <Button
                key={s}
                type="button"
                variant="outline"
                size="sm"
                className="text-xs h-auto py-1.5"
                disabled={assist.isPending}
                onClick={() => send(s)}
              >
                {s.length > 44 ? `${s.slice(0, 42)}…` : s}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => send()} disabled={assist.isPending || !message.trim()}>
              {assist.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Send
            </Button>
            <Button type="button" variant="ghost" size="sm" asChild>
              <Link href="/settings?tab=liv">
                <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                Open Liv settings
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
