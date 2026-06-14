import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-fetch";
import { usePathId } from "@/lib/detail-route-params";
import { useBusiness } from "@/lib/business-context";
import {
  useGetBooking,
  getGetBookingQueryKey,
  useUpdateBooking,
  getListBookingsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { formatDateTime } from "@/lib/format";
import { bookingExperienceCopy } from "@workspace/policy";
import { canMarkNoShow, noShowUnavailableHint } from "@/lib/booking-appointment-window";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, User, Sparkles, Clock, FileText, CalendarClock } from "lucide-react";
import { useOperationalChrome } from "@/lib/operational-chrome";
import { BookingRescheduleDialog } from "@/components/booking/booking-reschedule-dialog";
import { HelpSupportDialog } from "@/components/help-support-dialog";
import { BookingContextRail } from "@/components/booking/booking-context-rail";
import { PendingWhyLine } from "@/components/booking/pending-why-line";
import { BookingContinuityPanel } from "@/components/booking-continuity-panel";
import { BookingAftercarePanel } from "@/components/booking/booking-aftercare-panel";
import { BeautyWalletPassPanel } from "@/components/beauty/beauty-wallet-pass-panel";
import { TenantRetailAttachPanel } from "@/components/retail/tenant-retail-attach-panel";
import { useFeatureEntitled } from "@/components/billing/feature-unlock-panel";
import { verticalSupportsRetail } from "@workspace/policy";
import { BookingSourceBadge } from "@/components/booking/booking-source-badge";
import { invalidateOperationalState } from "@/lib/operational-cache";
import { OperationalPageShell } from "@/components/layout/operational-page-shell";
import { SettingsDisclosure } from "@/components/ui/settings-disclosure";
import {
  BookingLinkedInboxBanner,
  type LinkedInboxCaseDto,
} from "@/components/booking/booking-linked-inbox-banner";
import { useInAppNotifications } from "@/hooks/use-in-app-notifications";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-[hsl(var(--chart-4))]/10 text-[hsl(var(--chart-4))] border-[hsl(var(--chart-4))]/20",
  CONFIRMED: "bg-primary/10 text-primary border-primary/20",
  COMPLETED: "bg-[hsl(var(--chart-3))]/10 text-[hsl(var(--chart-3))] border-[hsl(var(--chart-3))]/20",
  CANCELLED: "bg-destructive/10 text-destructive border-destructive/20",
  NO_SHOW: "bg-muted text-muted-foreground border-border",
};

const TRANSITIONS: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["COMPLETED", "CANCELLED", "NO_SHOW"],
  CANCELLED: [],
  COMPLETED: [],
  NO_SHOW: [],
};


const ACTION_VARIANTS: Record<string, "default" | "destructive" | "outline"> = {
  CONFIRMED: "default",
  COMPLETED: "default",
  CANCELLED: "destructive",
  NO_SHOW: "outline",
};

export default function BookingDetailPage() {
  const bookingId = usePathId("bookings");
  const { business } = useBusiness();
  const { toast } = useToast();
  const qc = useQueryClient();
  const businessVertical = (business as { vertical?: string } | null)?.vertical;
  const businessCategory = (business as { category?: string } | null)?.category;
  const exp = bookingExperienceCopy(businessVertical, businessCategory);
  const op = useOperationalChrome(businessVertical);
  const hasRetailEntitlement = useFeatureEntitled("take_home_retail");

  const bid = business?.id ?? "";
  const bkId = bookingId ?? "";
  const { markReadByResource } = useInAppNotifications();

  useEffect(() => {
    if (!bid || !bkId) return;
    void markReadByResource({
      resourceKind: "booking",
      resourceId: bkId,
      businessId: bid,
    });
  }, [bid, bkId, markReadByResource]);

  const { data: booking, isLoading } = useGetBooking(
    bid,
    bkId,
    { query: { enabled: !!bid && !!bkId } as any }
  );

  const { data: retailBundle } = useQuery({
    queryKey: ["retail-store", bid],
    queryFn: () =>
      apiFetch<{
        settings: { enabled: boolean; postSessionSuggest?: boolean };
        products: Array<{ id: string; name: string; priceMinor: number; currency: string; isActive?: boolean }>;
      }>(`/api/businesses/${bid}/retail/store`),
    enabled: !!bid && verticalSupportsRetail(businessVertical),
  });

  const retailProducts = useMemo(
    () => (retailBundle?.products ?? []).filter((p) => p.isActive !== false),
    [retailBundle],
  );

  const updateBooking = useUpdateBooking();
  const [rescheduleOpen, setRescheduleOpen] = useState(false);

  function handleTransition(newStatus: string) {
    if (!bid || !bkId) return;
    updateBooking.mutate(
      { businessId: bid, bookingId: bkId, data: { status: newStatus as any } },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getGetBookingQueryKey(bid, bkId) });
          invalidateOperationalState(qc, bid);
          toast({ title: exp.toastStatusUpdated(newStatus) });
        },
        onError: () => toast({ title: "Failed to update booking", variant: "destructive" }),
      }
    );
  }

  const bookingStatus = (booking as { status?: string })?.status ?? "";
  const bookingStartAt = (booking as { startAt?: string })?.startAt ?? "";

  const allowedTransitions = useMemo(() => {
    const base = booking ? (TRANSITIONS[bookingStatus] ?? []) : [];
    if (!canMarkNoShow(bookingStartAt, bookingStatus)) {
      return base.filter((s) => s !== "NO_SHOW");
    }
    return base;
  }, [booking, bookingStatus, bookingStartAt]);

  const noShowHidden =
    booking &&
    (TRANSITIONS[bookingStatus] ?? []).includes("NO_SHOW") &&
    !allowedTransitions.includes("NO_SHOW");

  const linkedInboxCase = (booking as { linkedInboxCase?: LinkedInboxCaseDto | null } | undefined)
    ?.linkedInboxCase;
  const refundCaseBlocksActions =
    linkedInboxCase &&
    (linkedInboxCase.status === "OPEN" || linkedInboxCase.status === "HANDED_OFF") &&
    (linkedInboxCase.caseIntent === "refund_request" ||
      linkedInboxCase.summary?.toLowerCase().includes("refund"));

  return (
    <OperationalPageShell
      data-testid="booking-detail-page"
      width="md"
      title={exp.detailPageTitle}
      subtitle={exp.detailPageSubtitle}
      actions={
        <div className="flex items-center gap-2">
          <Link href="/bookings">
            <Button variant="ghost" size="icon" data-testid="button-back" aria-label={exp.backToListAria}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          {booking ? (
            <HelpSupportDialog
              defaultCategory="liv_error"
              context={{ bookingId: bkId, bookingStatus: (booking as { status?: string }).status }}
            />
          ) : null}
        </div>
      }
    >
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-36 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      ) : !booking ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">Booking not found</CardContent>
        </Card>
      ) : (
        <>
          <BookingLinkedInboxBanner
            bookingStatus={bookingStatus}
            linkedCase={linkedInboxCase}
            cancelPending={updateBooking.isPending}
            onCancelBooking={() => handleTransition("CANCELLED")}
          />
          <Card className={op.wellness ? "wellness-list-shell border-0 shadow-sm" : undefined}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{exp.statusSectionTitle}</CardTitle>
              <span
                className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                  STATUS_COLORS[(booking as any).status] ?? ""
                }`}
              >
                {(booking as any).status}
              </span>
            </CardHeader>
            <CardContent>
              <div className="mb-3">
                <BookingSourceBadge source={(booking as { source?: string }).source} />
              </div>
              {(booking as any).status === "PENDING" ? (
                <div className="mb-3 rounded-md border border-amber-500/25 bg-amber-500/5 px-3 py-2">
                  <PendingWhyLine
                    reason={(booking as { pendingReason?: string }).pendingReason}
                    vertical={businessVertical}
                    category={businessCategory}
                  />
                </div>
              ) : null}
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <Clock className="h-4 w-4" />
                {formatDateTime((booking as any).startAt)} — {formatDateTime((booking as any).endAt)}
              </div>
              <div className="mb-4">
                <BookingContextRail
                  businessId={bid}
                  bookingId={bkId}
                  status={(booking as { status: string }).status}
                  customerName={
                    (booking as { customer?: { firstName?: string; lastName?: string } }).customer
                      ? [
                          (booking as { customer?: { firstName?: string } }).customer?.firstName,
                          (booking as { customer?: { lastName?: string } }).customer?.lastName,
                        ]
                          .filter(Boolean)
                          .join(" ")
                      : undefined
                  }
                  continuityConversationId={
                    (booking as { continuityConversationId?: string }).continuityConversationId
                  }
                  linkedInboxConversationId={linkedInboxCase?.conversationId}
                />
              </div>
              {noShowHidden ? (
                <p className="text-xs text-muted-foreground mb-3">
                  {noShowUnavailableHint(bookingStartAt)}
                </p>
              ) : null}
              {refundCaseBlocksActions ? (
                <p className="text-xs text-muted-foreground mb-3" data-testid="booking-actions-held">
                  Status changes are paused while the refund thread is open — resolve in inbox first.
                </p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                {(bookingStatus === "PENDING" || bookingStatus === "CONFIRMED") &&
                !refundCaseBlocksActions ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRescheduleOpen(true)}
                    data-testid="button-reschedule-booking"
                  >
                    <CalendarClock className="h-3.5 w-3.5 mr-1.5" />
                    Reschedule
                  </Button>
                ) : null}
                {allowedTransitions.length > 0 && !refundCaseBlocksActions
                  ? allowedTransitions.map((status) => (
                      <Button
                        key={status}
                        variant={ACTION_VARIANTS[status] ?? "outline"}
                        size="sm"
                        disabled={updateBooking.isPending}
                        onClick={() => handleTransition(status)}
                        data-testid={`button-transition-${status}`}
                      >
                        {exp.statusActions[status as keyof typeof exp.statusActions] ?? status}
                      </Button>
                    ))
                  : null}
              </div>
              {(booking as { serviceId: string }).serviceId ? (
                <BookingRescheduleDialog
                  open={rescheduleOpen}
                  onOpenChange={setRescheduleOpen}
                  bookingId={bkId}
                  serviceId={(booking as { serviceId: string }).serviceId}
                  staffId={(booking as { staffId?: string | null }).staffId}
                  customerLabel={
                    [
                      (booking as { customer?: { firstName?: string } }).customer?.firstName,
                      (booking as { customer?: { lastName?: string } }).customer?.lastName,
                    ]
                      .filter(Boolean)
                      .join(" ") || "Guest"
                  }
                  serviceName={(booking as { service: { name: string } }).service.name}
                  currentStartAt={bookingStartAt}
                />
              ) : null}
            </CardContent>
          </Card>

          <BookingContinuityPanel
            businessId={bid}
            bookingId={bkId}
            pendingReason={(booking as { pendingReason?: string }).pendingReason}
            continuityConversationId={
              (booking as { continuityConversationId?: string }).continuityConversationId
            }
            vertical={businessVertical}
            category={businessCategory}
            copy={exp}
          />

          <BookingAftercarePanel
            businessId={bid}
            bookingId={bkId}
            status={booking.status}
          />

          {verticalSupportsRetail(businessVertical) && booking.status === "COMPLETED" ? (
            <TenantRetailAttachPanel
              businessId={bid}
              businessName={business?.name ?? "Studio"}
              businessVertical={businessVertical}
              guestFirstName={(booking as { customer?: { firstName?: string } }).customer?.firstName}
              products={retailProducts}
              enabled={
                hasRetailEntitlement &&
                retailBundle?.settings?.enabled &&
                retailBundle.settings.postSessionSuggest !== false
              }
            />
          ) : null}

          {businessVertical === "beauty" && ["CONFIRMED", "PENDING"].includes(booking.status) ? (
            <BeautyWalletPassPanel businessId={bid} bookingId={bkId} />
          ) : null}

          <Card
            data-testid="booking-detail-party"
            className={op.wellness ? "wellness-list-shell border-0 shadow-sm" : undefined}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{exp.partyCardTitle}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 text-sm">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  {exp.clientFieldLabel}
                </p>
                {(booking as any).customer ? (
                  <>
                    <Link href={`/customers/${(booking as any).customer.id}`}>
                      <p className="font-medium hover:text-primary transition-colors">
                        {(booking as any).customer.firstName} {(booking as any).customer.lastName}
                      </p>
                    </Link>
                    {(booking as any).customer.email ? (
                      <p className="text-muted-foreground">{(booking as any).customer.email}</p>
                    ) : null}
                    {(booking as any).customer.phone ? (
                      <p className="text-muted-foreground">{(booking as any).customer.phone}</p>
                    ) : null}
                  </>
                ) : (
                  <p className="text-muted-foreground">{exp.noGuestLabel}</p>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  {exp.serviceFieldLabel}
                </p>
                {(booking as any).service ? (
                  <>
                    <p className="font-medium">{(booking as any).service.name}</p>
                    <p className="text-muted-foreground">
                      {(booking as any).service.durationMinutes} min
                      {(booking as any).staff ? ` · ${(booking as any).staff.displayName}` : ""}
                    </p>
                  </>
                ) : (
                  <p className="text-muted-foreground">{exp.noServiceLabel}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {Array.isArray((booking as any).media) && (booking as any).media.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{exp.mediaCardTitle}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {(booking as any).media.map((m: { id: string; url: string }) => (
                  <a
                    key={m.id}
                    href={m.url}
                    target="_blank"
                    rel="noreferrer"
                    className="h-20 w-20 rounded-md overflow-hidden border block"
                  >
                    <img src={m.url} alt="" className="h-full w-full object-cover" />
                  </a>
                ))}
              </CardContent>
            </Card>
          )}

          {(booking as any).notes ? (
            <SettingsDisclosure
              title={exp.notesDisclosureTitle}
              description={exp.notesDisclosureDescription}
              defaultOpen={false}
            >
              <p className="text-sm text-muted-foreground pt-1 flex items-start gap-2">
                <FileText className="h-4 w-4 shrink-0 mt-0.5" />
                {(booking as any).notes}
              </p>
            </SettingsDisclosure>
          ) : null}
        </>
      )}
    </OperationalPageShell>
  );
}
