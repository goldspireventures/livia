import { Link } from "wouter";
import { Bell, CheckCheck } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
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
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`;
  return `${Math.round(mins / 1440)}d ago`;
}

export function NotificationCenter({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, isLoading, markRead, markAllRead } =
    useInAppNotifications();

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
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
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
        <p className="text-xs text-muted-foreground pb-3">
          Tailored to your role — bookings, inbox, and multi-shop alerts when they need you.
        </p>
        <div className="flex-1 overflow-y-auto space-y-2 -mx-1 px-1">
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Loading…</p>
          ) : notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              You&apos;re all caught up. Liv will surface anything that needs a human here.
            </p>
          ) : (
            notifications.map((n) => {
              const inner = (
                <div
                  className={cn(
                    "rounded-lg border border-border border-l-4 p-3 text-left transition-colors",
                    priorityClass(n.priority),
                    !n.readAt && "bg-muted/40",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium leading-snug">{n.title}</p>
                    {!n.readAt ? (
                      <Badge variant="secondary" className="text-[9px] shrink-0">
                        New
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{n.body}</p>
                  <p className="text-[10px] text-muted-foreground mt-2">
                    {relativeTime(n.createdAt)}
                    {n.personaHint ? ` · ${n.personaHint}` : ""}
                  </p>
                </div>
              );

              if (n.href) {
                return (
                  <Link key={n.id} href={n.href} onClick={() => void onOpenItem(n)}>
                    {inner}
                  </Link>
                );
              }
              return (
                <button
                  key={n.id}
                  type="button"
                  className="w-full"
                  onClick={() => void onOpenItem(n)}
                >
                  {inner}
                </button>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
