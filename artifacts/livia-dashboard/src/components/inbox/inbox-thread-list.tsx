import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  CalendarCheck,
  Globe,
  HandHelping,
  MessageSquare,
  Phone,
  User as UserIcon,
} from "lucide-react";
import { MOTION } from "@/lib/motion";
import { cn } from "@/lib/utils";

export type InboxThreadRow = {
  id: string;
  channel: string;
  status: string;
  customerName: string | null;
  aiHandled: boolean;
  lastMessage: string | null;
  summary?: string | null;
  lastMessageAt: string;
  bookingCount: number;
};

function formatRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

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

export function InboxThreadList({
  threads,
  loading,
  selectedId,
  onSelect,
  emptyTitle,
  emptySubtitle,
}: {
  threads: InboxThreadRow[];
  loading?: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  emptyTitle: string;
  emptySubtitle: string;
}) {
  if (loading) {
    return (
      <div className="p-2 space-y-2" data-testid="inbox-thread-loading">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-[72px] w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (threads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8 min-h-[280px]">
        <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-3">
          <Sparkles className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="font-medium text-sm">{emptyTitle}</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-[240px] leading-relaxed">{emptySubtitle}</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border overflow-y-auto max-h-[min(720px,calc(100vh-220px))]" data-testid="inbox-thread-list">
      {threads.map((c, i) => {
        const isActive = selectedId === c.id;
        const needsHuman = c.status === "HANDED_OFF" || (c.status === "OPEN" && !c.aiHandled);
        return (
          <button
            key={c.id}
            type="button"
            data-testid={`conversation-${c.id}`}
            onClick={() => onSelect(c.id)}
            className={cn(
              "w-full text-left px-3 py-3 transition-colors",
              isActive ? "bg-primary/10" : "hover:bg-muted/50",
              needsHuman && !isActive ? "font-medium" : "",
              MOTION.listItem,
            )}
            style={{ animationDelay: `${i * 35}ms` }}
          >
            <div className="flex items-start gap-2">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary/25 to-violet-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <UserIcon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className={cn("text-sm truncate", needsHuman ? "font-semibold" : "font-medium")}>
                    {c.customerName ?? "Anonymous visitor"}
                  </span>
                  <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
                    {formatRelative(c.lastMessageAt)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 leading-snug mb-1.5">
                  {c.lastMessage ??
                    c.summary ??
                    (c.aiHandled ? "Liv is handling this thread" : "(no messages yet)")}
                </p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Badge variant="outline" className="h-5 px-1.5 text-[10px] gap-1 font-normal">
                    {channelIcon(c.channel)}
                    {c.channel}
                  </Badge>
                  {c.status === "HANDED_OFF" ? (
                    <Badge className="h-5 px-1.5 text-[10px] gap-1 bg-amber-500/15 text-amber-800 dark:text-amber-200 border-amber-500/30">
                      <HandHelping className="h-2.5 w-2.5" />
                      HANDOFF
                    </Badge>
                  ) : c.aiHandled ? (
                    <Badge className="h-5 px-1.5 text-[10px] gap-1 bg-primary/15 text-primary border-primary/30">
                      <Sparkles className="h-2.5 w-2.5" />
                      AI
                    </Badge>
                  ) : c.status === "OPEN" ? (
                    <Badge className="h-5 px-1.5 text-[10px] bg-[hsl(var(--chart-4))]/15 text-[hsl(var(--chart-4))] border-[hsl(var(--chart-4))]/30">
                      Needs you
                    </Badge>
                  ) : null}
                  {c.bookingCount > 0 ? (
                    <Badge className="h-5 px-1.5 text-[10px] gap-1 bg-[hsl(var(--chart-3))]/15 text-[hsl(var(--chart-3))] border-[hsl(var(--chart-3))]/30">
                      <CalendarCheck className="h-2.5 w-2.5" />
                      {c.bookingCount}
                    </Badge>
                  ) : null}
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
