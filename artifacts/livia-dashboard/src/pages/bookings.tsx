import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { BookingGuidedDialog } from "@/components/booking/booking-guided-dialog";
import { useBusiness } from "@/lib/business-context";
import {
  getGetDashboardSummaryQueryKey,
  useGetDashboardSummary,
  useListBookings,
  listBookings,
  useUpdateBooking,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useNewBookingArrivalToast } from "@/hooks/use-new-booking-arrival";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarPlus, Search, Calendar, Loader2 } from "lucide-react";
import { usePersona } from "@/lib/persona";
import { BookingCreateDialog } from "@/components/booking/booking-create-dialog";
import { OperationalPageShell } from "@/components/layout/operational-page-shell";
import { bookingExperienceCopy, verticalOperationalCopy, classifyPendingBookingAttention } from "@workspace/policy";
import { useOperationalChrome } from "@/lib/operational-chrome";
import { cn } from "@/lib/utils";
import { bookingsListRowHeightClass, bookingsListScrollViewportClass } from "@/lib/bookings-list-layout";
import { onContainedScrollWheel } from "@/lib/use-contained-scroll";
import { usePresentationSurface } from "@/lib/presentation-surface";
import {
  beautyNativeMorphForVertical,
  isConstellationPresentation,
  wellnessNativeMorphForVertical,
} from "@/lib/presentation-layout";
import { BookingsMorphFallbackRow, BookingsMorphList } from "@/components/booking/bookings-morph-list";

const PAGE_SIZE = 40;

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-[hsl(var(--chart-4))]/10 text-[hsl(var(--chart-4))] border-[hsl(var(--chart-4))]/20",
  CONFIRMED: "bg-primary/10 text-primary border-primary/20",
  COMPLETED: "bg-[hsl(var(--chart-3))]/10 text-[hsl(var(--chart-3))] border-[hsl(var(--chart-3))]/20",
  CANCELLED: "bg-destructive/10 text-destructive border-destructive/20",
  NO_SHOW: "bg-muted text-muted-foreground border-border",
};

export default function BookingsPage() {
  const { kind: persona } = usePersona();
  const { business } = useBusiness();
  const qc = useQueryClient();
  const [location, setLocation] = useLocation();
  const [statusFilter, setStatusFilter] = useState<string>("PENDING");
  const [pendingLens, setPendingLens] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [guidedDialogOpen, setGuidedDialogOpen] = useState(false);
  const [offset, setOffset] = useState(0);
  const [accumulated, setAccumulated] = useState<any[]>([]);

  const bid = business?.id ?? "";
  const businessVertical = (business as { vertical?: string } | null)?.vertical;
  const businessCategory = (business as { category?: string } | null)?.category;
  const op = useOperationalChrome(businessVertical);
  const opCopy = verticalOperationalCopy(businessVertical, businessCategory);
  const bookingCopy = bookingExperienceCopy(businessVertical, businessCategory);
  const statusParam = statusFilter !== "ALL" ? (statusFilter as any) : undefined;
  const presentation = usePresentationSurface(bid);
  const beautyMorph = beautyNativeMorphForVertical(businessVertical, presentation.layoutMorph);
  const wellnessMorph = wellnessNativeMorphForVertical(businessVertical, presentation.layoutMorph);
  const constellationMorph =
    !beautyMorph &&
    !wellnessMorph &&
    isConstellationPresentation(presentation.cssPreset) &&
    presentation.layoutMorph === "constellation";
  const bookingsMorph = beautyMorph ?? wellnessMorph ?? (constellationMorph ? "constellation" : null);
  const updateBooking = useUpdateBooking();
  const [assigningBookingId, setAssigningBookingId] = useState<string | null>(null);
  const { data: dashboardSummary } = useGetDashboardSummary(bid, {
    query: { enabled: !!bid && !!bookingsMorph } as never,
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let changed = false;
    if (params.get("create") === "1") {
      setBookingDialogOpen(true);
      params.delete("create");
      changed = true;
    }
    if (params.get("guided") === "1") {
      setGuidedDialogOpen(true);
      params.delete("guided");
      changed = true;
    }
    if (params.get("status") === "PENDING") {
      setStatusFilter("PENDING");
      params.delete("status");
      changed = true;
    }
    const lens = params.get("lens");
    if (lens === "needs_you" || lens === "guest_action" || lens === "all") {
      setPendingLens(lens);
      setStatusFilter("PENDING");
      params.delete("lens");
      changed = true;
    }
    if (changed) {
      const qs = params.toString();
      window.history.replaceState(null, "", qs ? `/bookings?${qs}` : "/bookings");
    }
  }, []);

  useEffect(() => {
    if (!bid) return;
    void qc.invalidateQueries({
      predicate: (query) => {
        const key = query.queryKey[0];
        return typeof key === "string" && key === `/api/businesses/${bid}/bookings`;
      },
    });
  }, [location, bid, qc]);

  useEffect(() => {
    setOffset(0);
    setAccumulated([]);
  }, [statusFilter, bid]);

  const { data, isLoading, isFetching } = useListBookings(
    bid,
    { status: statusParam, limit: PAGE_SIZE, offset },
    {
      query: {
        enabled: !!bid,
        refetchInterval: 12_000,
        refetchOnWindowFocus: true,
        refetchOnMount: "always",
        staleTime: 0,
      } as any,
    },
  );

  const page = useMemo(() => {
    const raw = data as { data?: unknown[]; total?: number } | unknown[] | undefined;
    if (Array.isArray(raw)) return { data: raw, total: raw.length };
    return { data: (raw?.data ?? []) as any[], total: raw?.total };
  }, [data]);

  useEffect(() => {
    if (!bid || isLoading) return;
    setAccumulated((prev) => {
      if (offset === 0) return page.data;
      const ids = new Set(prev.map((b: { id: string }) => b.id));
      return [...prev, ...page.data.filter((b: { id: string }) => !ids.has(b.id))];
    });
  }, [page.data, offset, bid, isLoading]);

  useNewBookingArrivalToast(accumulated, !!bid && offset === 0 && !isLoading);

  const total = page.total;
  const hasMore =
    total !== undefined ? accumulated.length < total : page.data.length === PAGE_SIZE;

  const loadMore = useCallback(async () => {
    if (!bid || !hasMore || isFetching) return;
    const nextOffset = offset + PAGE_SIZE;
    const more = await listBookings(bid, {
      status: statusParam,
      limit: PAGE_SIZE,
      offset: nextOffset,
    });
    const rows = (more as { data?: any[] }).data ?? [];
    setOffset(nextOffset);
    setAccumulated((prev) => {
      const ids = new Set(prev.map((b: { id: string }) => b.id));
      return [...prev, ...(rows ?? []).filter((b: { id: string }) => !ids.has(b.id))];
    });
  }, [bid, hasMore, isFetching, offset, statusParam]);

  const filtered = search
    ? accumulated.filter((b: any) => {
        const name = `${b.customer?.firstName ?? ""} ${b.customer?.lastName ?? ""}`.toLowerCase();
        const svc = (b.service?.name ?? "").toLowerCase();
        return name.includes(search.toLowerCase()) || svc.includes(search.toLowerCase());
      })
    : accumulated;

  const lensFiltered =
    statusFilter === "PENDING" && pendingLens !== "all"
      ? filtered.filter((b: { status: string; pendingReason?: string | null }) => {
          if (b.status !== "PENDING") return true;
          const bucket = classifyPendingBookingAttention(b.pendingReason);
          if (pendingLens === "needs_you") return bucket === "needs_you";
          if (pendingLens === "guest_action") return bucket === "guest_action";
          return true;
        })
      : filtered;

  const listLoading = isLoading && offset === 0;
  const pendingCount = lensFiltered.filter((b: { status: string }) => b.status === "PENDING").length;
  const completedCount = lensFiltered.filter((b: { status: string }) => b.status === "COMPLETED").length;

  const onAssignBookingToResource = useCallback(
    async (bookingId: string, resourceId: string | null) => {
      if (!bid) return false;
      setAssigningBookingId(bookingId);
      try {
        await updateBooking.mutateAsync({
          businessId: bid,
          bookingId,
          data: { resourceId },
        });
        await qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey(bid) });
        return true;
      } catch {
        return false;
      } finally {
        setAssigningBookingId(null);
      }
    },
    [bid, updateBooking, qc],
  );

  const showRitual = persona === "receptionist" || persona === "manager" || persona === "owner";

  return (
    <OperationalPageShell
      data-testid="bookings-page"
      title={
        showRitual
          ? persona === "receptionist"
            ? "The floor"
            : `${opCopy.bookingsPageTitle} · ${business?.name ?? "this shop"}`
          : opCopy.bookingsPageTitle
      }
      subtitle={showRitual ? opCopy.bookingsPageSubtitle : opCopy.bookingsPageSubtitle}
      width="full"
      actions={
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className={op.outlineButton()}
            data-testid="button-new-booking-quick"
            onClick={() => setBookingDialogOpen(true)}
          >
            <CalendarPlus className="h-4 w-4 mr-2" />
            {bookingCopy.listQuickAddLabel}
          </Button>
          <Button
            size="sm"
            data-testid="button-new-booking-guided"
            className={op.primaryButton()}
            onClick={() => setGuidedDialogOpen(true)}
          >
            {bookingCopy.listGuidedBookingTitle}
          </Button>
        </div>
      }
    >

      <BookingCreateDialog
        open={bookingDialogOpen}
        onOpenChange={setBookingDialogOpen}
        onCreated={(id) => setLocation(`/bookings/${id}`)}
      />
      <BookingGuidedDialog
        open={guidedDialogOpen}
        onOpenChange={setGuidedDialogOpen}
        onCreated={(id) => setLocation(`/bookings/${id}`)}
      />

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={opCopy.searchBookingsPlaceholder}
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="input-search-bookings"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40" aria-label="Filter by status" data-testid="select-status-filter">
            <SelectValue placeholder="Pending" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="CONFIRMED">Confirmed</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
            <SelectItem value="NO_SHOW">{bookingCopy.statusFilterNoShow}</SelectItem>
            <SelectItem value="ALL">All statuses</SelectItem>
          </SelectContent>
        </Select>
        {statusFilter === "PENDING" ? (
          <div className="flex flex-wrap gap-1" data-testid="bookings-pending-lens">
            {(
              [
                ["all", "All pending"],
                ["needs_you", "Needs you"],
                ["guest_action", "Guest completing"],
              ] as const
            ).map(([id, label]) => (
              <Button
                key={id}
                size="sm"
                variant={pendingLens === id ? "default" : "outline"}
                className="h-8"
                onClick={() => setPendingLens(id)}
              >
                {label}
              </Button>
            ))}
          </div>
        ) : null}
      </div>

      <Card className={cn(op.panel())}>
        <CardContent className="p-0 flex flex-col">
          {listLoading ? (
            <div className="divide-y divide-border">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          ) : lensFiltered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Calendar className="h-9 w-9 text-muted-foreground mb-3 opacity-40" />
              <p className="font-medium">{bookingCopy.listEmptyTitle}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {search || statusFilter !== "PENDING"
                  ? "Try adjusting your filters"
                  : "Create your first booking to get started"}
              </p>
              {!search && statusFilter === "PENDING" && (
                <Button
                  className={cn("mt-4", op.outlineButton())}
                  variant="outline"
                  onClick={() => setBookingDialogOpen(true)}
                >
                  <CalendarPlus className="h-4 w-4 mr-2" />
                  {bookingCopy.listEmptyPendingCta}
                </Button>
              )}
            </div>
          ) : (
            <div className="flex flex-col">
            {bookingsMorph ? (
              <div
                className="p-4 flex flex-col"
                data-testid={`bookings-morph-${bookingsMorph}`}
              >
                <BookingsMorphList
                  morph={bookingsMorph}
                  vertical={businessVertical}
                  category={businessCategory}
                  bookings={lensFiltered}
                  pendingCount={pendingCount}
                  completedCount={completedCount}
                  packageCreditSummary={dashboardSummary?.packageCreditSummary ?? null}
                  bookingResources={dashboardSummary?.bookingResources}
                  onAssignBookingToResource={
                    dashboardSummary?.bookingResources?.length ? onAssignBookingToResource : undefined
                  }
                  assigningBookingId={assigningBookingId}
                  statusColors={STATUS_COLORS}
                  rowClass={op.row}
                  avatarClass={op.avatarRing}
                  bookingStatusClass={op.bookingStatus}
                />
              </div>
            ) : (
            <div
              className={cn(op.listScroll(), bookingsListScrollViewportClass)}
              onWheel={onContainedScrollWheel}
            >
              {lensFiltered.map((booking: any) => (
                <BookingsMorphFallbackRow
                  key={booking.id}
                  booking={booking}
                  rowClass={(pending) => cn(op.row(pending), bookingsListRowHeightClass)}
                  avatarClass={op.avatarRing}
                  bookingStatusClass={op.bookingStatus}
                  statusColors={STATUS_COLORS}
                  vertical={businessVertical}
                  category={businessCategory}
                />
              ))}
            </div>
            )}
            {!search && hasMore && (
              <div className="p-4 border-t flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void loadMore()}
                  disabled={isFetching}
                  data-testid="button-load-more-bookings"
                >
                  {isFetching ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading…
                    </>
                  ) : (
                    "Load more"
                  )}
                </Button>
              </div>
            )}
            </div>
          )}
        </CardContent>
      </Card>
    </OperationalPageShell>
  );
}
