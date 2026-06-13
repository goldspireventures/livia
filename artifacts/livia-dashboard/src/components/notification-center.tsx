import { Link } from "wouter";
import {
  Bell,
  Building2,
  CalendarCheck,
  CheckCheck,
  ClipboardCheck,
  CreditCard,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { notificationsEmptySubtitle } from "@workspace/policy";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { MOTION } from "@/lib/motion";
import {
  groupNotificationsByDay,
  notificationFeedIcon,
  type NotificationFeedIcon,
} from "@workspace/policy";
import {
  useInAppNotifications,
  type InAppNotification,
} from "@/hooks/use-in-app-notifications";

function priorityClass(p: InAppNotification["priority"]): string {
  switch (p) {
    case "act":
      return "border-l-red-500";
    case "watch":
      return "border-l-amber-500";
    default:
      return "border-l-border";
  }
}

function relativeTime(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  if (mins < 1440) return `${Math.round(mins / 60)}h`;
  return `${Math.round(mins / 1440)}d`;
}

function FeedIcon({ type }: { type: NotificationFeedIcon }) {
  const cls = "h-4 w-4 shrink-0";
  switch (type) {
    case "booking":
      return <CalendarCheck className={cn(cls, "text-primary")} aria-hidden />;
    case "inbox":
      return <MessageSquare className={cn(cls, "text-emerald-600 dark:text-emerald-400")} aria-hidden />;
    case "chain":
      return <Building2 className={cn(cls, "text-violet-600 dark:text-violet-400")} aria-hidden />;
    case "commerce":
      return <CreditCard className={cn(cls, "text-emerald-600 dark:text-emerald-400")} aria-hidden />;
    case "twin":
      return <Sparkles className={cn(cls, "text-violet-600 dark:text-violet-400")} aria-hidden />;
    default:
      return <ClipboardCheck className={cn(cls, "text-amber-600 dark:text-amber-400")} aria-hidden />;
  }
}

function NotificationRow({
  n,
  onOpen,
}: {
  n: InAppNotification;
  onOpen: () => void;
}) {
  const iconType = notificationFeedIcon(n.kind);
  const inner = (
    <div
      className={cn(
        "flex gap-3 min-h-[72px] items-center rounded-lg border border-border border-l-4 px-3 py-2.5 text-left transition-opacity",
        priorityClass(n.priority),
        !n.readAt && "bg-muted/40 font-medium",
        MOTION.listItem,
      )}
      data-testid={`notification-row-${n.id}`}
    >
      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
        <FeedIcon type={iconType} />
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm leading-snug truncate", !n.readAt && "font-semibold")}>{n.title}</p>
        <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2 leading-[1.35]">{n.body}</p>
      </div>
      <span className="text-[11px] text-muted-foreground shrink-0 tabular-nums self-start pt-1">
        {relativeTime(n.createdAt)}
      </span>
    </div>
  );

  if (n.href) {
    return (
      <Link href={n.href} onClick={onOpen}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" className="w-full" onClick={onOpen}>
      {inner}
    </button>
  );
}

function NotificationGroup({
  label,
  items,
  onOpenItem,
}: {
  label: string;
  items: InAppNotification[];
  onOpenItem: (n: InAppNotification) => void;
}) {
  if (items.length === 0) return null;
  return (
    <section className="space-y-2">
      <h3 className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium px-0.5">
        {label}
      </h3>
      {items.map((n) => (
        <NotificationRow key={n.id} n={n} onOpen={() => void onOpenItem(n)} />
      ))}
    </section>
  );
}

function NotificationListSkeleton() {
  return (
    <div className="space-y-2" data-testid="notification-list-loading">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-[72px] w-full rounded-lg" />
      ))}
    </div>
  );
}

export function NotificationCenter({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, isLoading, markRead, markAllRead } =
    useInAppNotifications();

  const { today, earlier } = groupNotificationsByDay(notifications);

  const onOpenItem = async (n: InAppNotification) => {
    if (!n.readAt) await markRead(n.id);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("relative shrink-0", className)}
          aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
          data-testid="notification-bell"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 ? (
            <span
              className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground"
              data-testid="notification-unread-badge"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col" data-testid="notification-sheet">
        <SheetHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <SheetTitle>Notifications</SheetTitle>
          {unreadCount > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs gap-1"
              onClick={() => void markAllRead()}
              data-testid="notification-mark-all-read"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </Button>
          ) : null}
        </SheetHeader>
        <div className="flex-1 overflow-y-auto space-y-5 -mx-1 px-1 pb-4">
          {isLoading ? (
            <NotificationListSkeleton />
          ) : notifications.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center text-center py-12"
              data-testid="notification-empty"
            >
              <div className="h-16 w-16 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center mb-4">
                <Bell className="h-7 w-7 text-muted-foreground/60" strokeWidth={1.5} />
              </div>
              <p className="font-medium text-sm">You&apos;re all caught up</p>
              <p className="text-xs text-muted-foreground mt-2 max-w-[240px] leading-relaxed">
                {notificationsEmptySubtitle()}
              </p>
            </div>
          ) : (
            <>
              <NotificationGroup label="Today" items={today} onOpenItem={onOpenItem} />
              <NotificationGroup label="Earlier" items={earlier} onOpenItem={onOpenItem} />
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
