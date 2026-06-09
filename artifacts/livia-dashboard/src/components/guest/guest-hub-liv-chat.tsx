import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { GUEST_HUB_COPY } from "@workspace/policy";
import { cn } from "@/lib/utils";

type ChatAction = { label: string; href: string };

type ChatTurn = {
  role: "user" | "assistant";
  text: string;
  actions?: ChatAction[];
};

export function GuestHubLivChat({
  hubToken,
  variant = "inline",
}: {
  hubToken: string;
  variant?: "inline" | "panel";
}) {
  const isPanel = variant === "panel";
  const [open, setOpen] = useState(isPanel);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [turns, setTurns] = useState<ChatTurn[]>([
    {
      role: "assistant",
      text: GUEST_HUB_COPY.livChatWelcome,
    },
  ]);
  const [err, setErr] = useState<string | null>(null);

  async function send() {
    const text = message.trim();
    if (!text || busy) return;
    setBusy(true);
    setErr(null);
    setMessage("");
    setTurns((t) => [...t, { role: "user", text }]);
    try {
      const r = await fetch("/api/public/guest-hub/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Guest-Hub-Token": hubToken,
        },
        body: JSON.stringify({ message: text }),
      });
      const j = (await r.json().catch(() => ({}))) as {
        reply?: string;
        actions?: ChatAction[];
        error?: string;
      };
      if (!r.ok) throw new Error(j.error ?? "Could not reach Liv");
      setTurns((t) => [
        ...t,
        {
          role: "assistant",
          text: j.reply ?? "Done.",
          actions: j.actions,
        },
      ]);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Try again");
    } finally {
      setBusy(false);
    }
  }

  if (isPanel) {
    return (
      <section
        className="rounded-xl border border-primary/25 bg-gradient-to-br from-primary/10 via-card to-card overflow-hidden shadow-sm max-w-2xl"
        data-testid="guest-hub-liv-chat"
      >
        <header className="px-3 py-2.5 border-b border-primary/10 flex gap-2 items-start">
          <div className="h-7 w-7 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
            <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-medium text-foreground">{GUEST_HUB_COPY.livStripTitle}</h2>
            <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
              {GUEST_HUB_COPY.livStripBody}
            </p>
          </div>
        </header>
        <div className="px-3 py-2.5 space-y-2.5">
          <ul
            className="min-h-[4.5rem] max-h-48 overflow-y-auto space-y-2 text-xs"
            data-testid="guest-hub-liv-messages"
          >
            {turns.map((turn, i) => (
              <li
                key={i}
                className={cn(
                  "rounded-md px-2.5 py-1.5",
                  turn.role === "user"
                    ? "ml-6 bg-primary/15 text-foreground text-right"
                    : "mr-6 bg-muted/50 text-muted-foreground text-left",
                )}
              >
                {turn.text}
                {turn.actions?.length ? (
                  <div className="flex flex-wrap gap-1.5 mt-1.5 justify-start">
                    {turn.actions.map((a) => (
                      <Button key={a.href} size="sm" variant="secondary" asChild className="min-h-8 h-8 text-xs px-2.5">
                        <Link href={a.href}>{a.label}</Link>
                      </Button>
                    ))}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
          {err ? <p className="text-xs text-destructive">{err}</p> : null}
          <div className="flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={GUEST_HUB_COPY.livChatPlaceholder}
              className="min-h-9 h-9 text-sm flex-1"
              data-testid="guest-hub-liv-input"
              onKeyDown={(e) => {
                if (e.key === "Enter") void send();
              }}
            />
            <Button
              type="button"
              size="sm"
              className="min-h-9 h-9 shrink-0 px-4"
              disabled={busy || !message.trim()}
              data-testid="guest-hub-liv-send"
              onClick={() => void send()}
            >
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Send"}
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <aside
      className="rounded-xl border border-primary/20 bg-gradient-to-r from-primary/10 to-transparent overflow-hidden"
      data-testid="guest-hub-liv-chat"
    >
      <button
        type="button"
        className="w-full px-4 py-3 flex gap-2 items-start text-left"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" aria-hidden />
        <span className="text-xs text-muted-foreground leading-relaxed flex-1">
          <span className="text-foreground font-medium">{GUEST_HUB_COPY.livStripTitle}</span>
          {open ? " — tap to collapse" : ` — ${GUEST_HUB_COPY.livStripBody}`}
        </span>
      </button>
      {open ? (
        <div className="px-4 pb-4 space-y-3 border-t border-primary/10">
          <ul className="max-h-48 overflow-y-auto space-y-2 text-xs" data-testid="guest-hub-liv-messages">
            {turns.map((turn, i) => (
              <li
                key={i}
                className={
                  turn.role === "user"
                    ? "text-foreground text-right"
                    : "text-muted-foreground text-left"
                }
              >
                {turn.text}
                {turn.actions?.length ? (
                  <div className="flex flex-wrap gap-2 mt-2 justify-start">
                    {turn.actions.map((a) => (
                      <Button key={a.href} size="sm" variant="secondary" asChild className="min-h-[40px]">
                        <Link href={a.href}>{a.label}</Link>
                      </Button>
                    ))}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
          {err ? <p className="text-xs text-destructive">{err}</p> : null}
          <div className="flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Book my usual at…"
              className="min-h-[44px] text-base"
              data-testid="guest-hub-liv-input"
              onKeyDown={(e) => {
                if (e.key === "Enter") void send();
              }}
            />
            <Button
              type="button"
              className="min-h-[44px] shrink-0"
              disabled={busy || !message.trim()}
              data-testid="guest-hub-liv-send"
              onClick={() => void send()}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send"}
            </Button>
          </div>
        </div>
      ) : null}
    </aside>
  );
}
