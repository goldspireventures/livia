import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { customFetch, useGetCustomerRelationship } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SettingsDisclosure } from "@/components/ui/settings-disclosure";
import { CalendarCheck, ExternalLink, Sparkles, User } from "lucide-react";
import { OPERATIONAL_REFETCH_MS } from "@/lib/operational-cache";
import { beautyOutlineButton } from "@/lib/beauty-operational-ui";
import { cn } from "@/lib/utils";
import {
  unknownGuestInboxHint,
  unknownGuestInboxLabel,
  inboxContextBookingSectionTitle,
  inboxContextBookingStatusLabel,
  inboxContextBookingSummary,
  isUpcomingBookingStatus,
} from "@workspace/policy";

type LinkedBooking = {
  id: string;
  status: string;
  startAt: string;
  service?: { name: string } | null;
  customer?: { id?: string; displayName: string | null; createdAt?: string } | null;
};

const STAGE_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  trusted: "default",
  active: "default",
  new: "secondary",
  prospect: "outline",
  at_risk: "destructive",
  lapsed: "destructive",
};

function formatBookingWhen(startAt: string): string {
  return new Date(startAt).toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function InboxContextRail({
  businessId,
  conversation,
  beautyChrome,
}: {
  businessId: string;
  beautyChrome?: boolean;
  conversation: {
    customerId?: string | null;
    customerName: string | null;
    customerEmail: string | null;
    customerPhone: string | null;
    linkedBookingId?: string | null;
    createdAt: string;
    bookingCount: number;
  } | null;
}) {
  const bookingId = conversation?.linkedBookingId;
  const customerId = conversation?.customerId ?? null;

  const { data: booking, isLoading } = useQuery({
    queryKey: ["inbox-context-booking", businessId, bookingId],
    queryFn: () =>
      customFetch<LinkedBooking>(`/api/businesses/${businessId}/bookings/${bookingId}`),
    enabled: !!businessId && !!bookingId,
    refetchInterval: OPERATIONAL_REFETCH_MS,
  });

  const { data: relationship, isLoading: relLoading } = useGetCustomerRelationship(
    businessId,
    customerId ?? "",
    { query: { enabled: !!businessId && !!customerId } as never },
  );

  if (!conversation) {
    return null;
  }

  const threadSince = new Date(conversation.createdAt).toLocaleDateString([], {
    month: "short",
    year: "numeric",
  });

  const rel = relationship as
    | {
        stage?: string;
        stageLabel?: string;
        headline?: string;
        nextBookingAt?: string | null;
        memoryHighlight?: string | null;
      }
    | undefined;

  const profileHref = customerId ? `/customers/${customerId}` : "/customers";
  const hasMemory = !!rel?.memoryHighlight?.trim();
  const hasRelationship =
    !!rel &&
    !!(rel.stageLabel || rel.headline || rel.nextBookingAt || hasMemory);
  const relationshipSummary = relLoading
    ? "Loading…"
    : hasMemory
      ? "Liv memory for this guest"
      : hasRelationship
        ? rel?.stageLabel ?? rel?.headline ?? "Visit history"
        : customerId
          ? "No visit history yet"
          : `${unknownGuestInboxLabel()} — ${unknownGuestInboxHint()}`;

  const nextBookingSummary = booking
    ? inboxContextBookingSummary(
        booking.service?.name,
        booking.startAt,
        booking.status,
        formatBookingWhen,
      )
    : bookingId && isLoading
      ? "Loading…"
      : "Nothing linked on this thread";

  const bookingSectionTitle = booking
    ? inboxContextBookingSectionTitle(booking.status)
    : "Booking";

  const showRelationshipNextVisit =
    !!rel?.nextBookingAt &&
    (!booking || !isUpcomingBookingStatus(booking.status));

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col overflow-hidden min-h-0",
        beautyChrome ? "beauty-inbox-context-rail" : "bg-card/30",
      )}
      data-testid="inbox-context-rail"
    >
      <div className="px-4 py-3 border-b border-border/60">
        <h2 className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
          Thread context
        </h2>
        <p className="text-xs text-muted-foreground mt-1">Since {threadSince}</p>
      </div>
      <div className="p-4 space-y-4 flex-1 overflow-y-auto">
        {hasMemory ? (
          <div
            className={cn(
              "rounded-lg border p-3 text-sm space-y-1.5",
              beautyChrome
                ? "beauty-inbox-context-card border-primary/20"
                : "border-primary/25 bg-primary/5",
            )}
            data-testid="inbox-context-liv-memory"
          >
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-primary" />
              Liv remembers
            </p>
            <p className="text-xs leading-snug">{rel!.memoryHighlight}</p>
            {customerId ? (
              <Link
                href={profileHref}
                className="text-[10px] text-primary hover:underline inline-block"
              >
                View full memory
              </Link>
            ) : null}
          </div>
        ) : null}

        {customerId ? (
          <SettingsDisclosure
            title="Relationship"
            description={relationshipSummary}
            defaultOpen={hasMemory}
            data-testid="inbox-context-relationship-section"
          >
            {relLoading ? (
              <Skeleton className="h-16 w-full rounded-lg" />
            ) : hasRelationship ? (
              <div
                className={cn(
                  "rounded-lg border p-3 text-sm space-y-2",
                  beautyChrome ? "beauty-inbox-context-card" : "border-border/80 bg-muted/30",
                )}
                data-testid="inbox-context-relationship"
              >
                <div className="flex flex-wrap gap-1.5">
                  {rel?.stageLabel ? (
                    <Badge variant={STAGE_VARIANT[rel.stage ?? ""] ?? "outline"}>{rel.stageLabel}</Badge>
                  ) : null}
                </div>
                {rel?.headline ? (
                  <p className="text-xs text-muted-foreground leading-snug">{rel.headline}</p>
                ) : null}
                {rel?.nextBookingAt ? (
                  <p className="text-[10px] font-mono uppercase tracking-wide text-muted-foreground">
                    Next visit · {formatBookingWhen(rel.nextBookingAt)}
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No visit history yet.</p>
            )}
          </SettingsDisclosure>
        ) : null}

        <SettingsDisclosure
          title={bookingSectionTitle}
          description={nextBookingSummary}
          defaultOpen={Boolean(booking && isUpcomingBookingStatus(booking.status))}
          className="[&_summary]:py-2 [&>div]:pb-2"
          data-testid="inbox-context-booking-section"
        >
          {bookingId && isLoading ? (
            <Skeleton className="h-12 w-full rounded-lg" />
          ) : booking ? (
            <div
              className={cn(
                "rounded-lg border p-2.5 text-sm space-y-0.5",
                beautyChrome
                  ? "beauty-inbox-context-card"
                  : "border-primary/25 bg-primary/5",
              )}
            >
              <div className="flex items-center gap-2 font-medium text-sm">
                <CalendarCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                {booking.service?.name ?? "Appointment"}
              </div>
              <p className="text-xs text-muted-foreground pl-5">{formatBookingWhen(booking.startAt)}</p>
              <p className="text-[10px] font-medium tracking-wide text-muted-foreground pl-5">
                {inboxContextBookingStatusLabel(booking.status)}
              </p>
            </div>
          ) : null}
          {showRelationshipNextVisit && rel?.nextBookingAt ? (
            <p className="text-xs text-muted-foreground pt-1">
              Next visit · {formatBookingWhen(rel.nextBookingAt)}
            </p>
          ) : null}
        </SettingsDisclosure>

        <div className="space-y-2 pt-1">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Quick links</p>
          <Button
            variant="outline"
            size="sm"
            className={cn("w-full justify-start gap-2", beautyOutlineButton(beautyChrome))}
            asChild
          >
            <Link href={profileHref}>
              <User className="h-3.5 w-3.5" />
              {customerId ? "Open guest profile" : "Customer directory"}
            </Link>
          </Button>
          {bookingId ? (
            <Button
              variant="outline"
              size="sm"
              className={cn("w-full justify-start gap-2", beautyOutlineButton(beautyChrome))}
              asChild
            >
              <Link href={`/bookings/${bookingId}`}>
                <ExternalLink className="h-3.5 w-3.5" />
                Open booking
              </Link>
            </Button>
          ) : customerId ? (
            <Button
              variant="outline"
              size="sm"
              className={cn("w-full justify-start gap-2", beautyOutlineButton(beautyChrome))}
              asChild
            >
              <Link href={`/bookings?create=1&customerId=${customerId}`}>
                <CalendarCheck className="h-3.5 w-3.5" />
                Book from thread
              </Link>
            </Button>
          ) : null}
        </div>

        {conversation.bookingCount > 0 ? (
          <p className="text-xs text-muted-foreground font-mono">
            {conversation.bookingCount} booking{conversation.bookingCount === 1 ? "" : "s"} on thread
          </p>
        ) : null}
      </div>
    </aside>
  );
}
