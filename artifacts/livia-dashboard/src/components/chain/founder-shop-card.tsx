import { ArrowRight, Building2, CalendarCheck, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MOTION } from "@/lib/motion";
import type { ChainPulseStatus, ChainShopRollup } from "./founder-chain-types";

function PulseBadge({ status }: { status: ChainPulseStatus }) {
  if (status === "ok") {
    return (
      <Badge variant="outline" className="text-emerald-600 border-emerald-600/40 text-[10px]">
        OK
      </Badge>
    );
  }
  if (status === "watch") {
    return (
      <Badge variant="outline" className="text-amber-600 border-amber-600/40 text-[10px]">
        Watch
      </Badge>
    );
  }
  return (
    <Badge variant="destructive" className="text-[10px]">
      Act
    </Badge>
  );
}

function verticalLabel(vertical?: string | null): string {
  if (!vertical) return "Business";
  return vertical.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function FounderShopCard({
  shop,
  vertical,
  period,
  onOpen,
}: {
  shop: ChainShopRollup;
  vertical?: string | null;
  period: "week" | "today";
  onOpen: () => void;
}) {
  const inboxWaiting = shop.openConversations + shop.handedOffConversations;
  const bookingKpi = period === "today" ? shop.todayBookings : shop.bookingsThisWeek;
  const bookingLabel = period === "today" ? "Today" : "This week";

  return (
    <article
      role="button"
      tabIndex={0}
      data-testid={`founder-shop-card-${shop.businessId}`}
      className={cn(
        "rounded-xl border bg-card p-4 cursor-pointer transition-all hover-elevate platform-default-card-lift",
        MOTION.listItem,
        shop.pulseStatus === "act"
          ? "border-destructive/50"
          : shop.pulseStatus === "watch"
            ? "border-amber-500/40"
            : "border-border/80 hover:border-primary/30",
      )}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
    >
      <div className="flex items-start gap-3">
        <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center shrink-0">
          <Building2 className="h-5 w-5 text-muted-foreground" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold truncate">{shop.name}</h3>
            <PulseBadge status={shop.pulseStatus} />
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {verticalLabel(vertical)}
            {shop.city ? ` · ${shop.city}` : ""}
          </p>
        </div>
      </div>

      {shop.pulseReason ? (
        <p className="text-xs text-amber-700 dark:text-amber-300 mt-3 line-clamp-2">{shop.pulseReason}</p>
      ) : null}

      <div className="grid grid-cols-3 gap-2 mt-4">
        <div className="rounded-lg border border-border/60 bg-muted/30 px-2 py-2 text-center">
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5">
            <CalendarCheck className="h-3 w-3" aria-hidden />
            <span className="text-[10px] uppercase tracking-wide">{bookingLabel}</span>
          </div>
          <p className="text-lg font-bold tabular-nums">{bookingKpi}</p>
        </div>
        <div className="rounded-lg border border-border/60 bg-muted/30 px-2 py-2 text-center">
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5">
            <MessageSquare className="h-3 w-3" aria-hidden />
            <span className="text-[10px] uppercase tracking-wide">Inbox</span>
          </div>
          <p className="text-lg font-bold tabular-nums">{inboxWaiting}</p>
        </div>
        <div className="rounded-lg border border-border/60 bg-muted/30 px-2 py-2 text-center">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground block mb-0.5">
            Pending
          </span>
          <p
            className={cn(
              "text-lg font-bold tabular-nums",
              shop.pendingBookings > 0 && "text-[hsl(var(--chart-4))]",
            )}
          >
            {shop.pendingBookings}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/60">
        <a
          href={`/b/${shop.slug}`}
          target="_blank"
          rel="noreferrer"
          className="text-[11px] text-primary hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          Public page ↗
        </a>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1 text-xs"
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
        >
          Open today
          <ArrowRight className="h-3 w-3" aria-hidden />
        </Button>
      </div>
    </article>
  );
}
