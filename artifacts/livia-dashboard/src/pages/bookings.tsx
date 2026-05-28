import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { useBusiness } from "@/lib/business-context";
import {
  useListBookings,
  getListBookingsQueryKey,
  useUpdateBooking,
  listBookings,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatDateTime } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarPlus, Search, Calendar, ChevronRight, Loader2 } from "lucide-react";
import { usePersona } from "@/lib/persona";
import { OPERATIONAL_REFETCH_MS } from "@/lib/operational-cache";
import { BookingCreateDialog } from "@/components/booking/booking-create-dialog";
import { pendingReasonLabel } from "@/lib/booking-pending";
import { BookingRowActions } from "@/components/booking/booking-row-actions";
import { OperationalPageShell } from "@/components/layout/operational-page-shell";

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
  const [, setLocation] = useLocation();
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [offset, setOffset] = useState(0);
  const [accumulated, setAccumulated] = useState<any[]>([]);

  const bid = business?.id ?? "";
  const statusParam = statusFilter !== "ALL" ? (statusFilter as any) : undefined;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("create") === "1") {
      setBookingDialogOpen(true);
      params.delete("create");
      const qs = params.toString();
      window.history.replaceState(null, "", qs ? `/bookings?${qs}` : "/bookings");
    }
  }, []);

  useEffect(() => {
    setOffset(0);
    setAccumulated([]);
  }, [statusFilter, bid]);

  const { data, isLoading, isFetching } = useListBookings(
    bid,
    { status: statusParam, limit: PAGE_SIZE, offset },
    { query: { enabled: !!bid, refetchInterval: OPERATIONAL_REFETCH_MS } as any },
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

  const updateBooking = useUpdateBooking();

  const filtered = search
    ? accumulated.filter((b: any) => {
        const name = `${b.customer?.firstName ?? ""} ${b.customer?.lastName ?? ""}`.toLowerCase();
        const svc = (b.service?.name ?? "").toLowerCase();
        return name.includes(search.toLowerCase()) || svc.includes(search.toLowerCase());
      })
    : accumulated;

  const listLoading = isLoading && offset === 0;

  const showRitual = persona === "receptionist" || persona === "manager" || persona === "owner";

  return (
    <OperationalPageShell
      title={
        showRitual
          ? persona === "receptionist"
            ? "The floor"
            : `Bookings · ${business?.name ?? "this shop"}`
          : "Bookings"
      }
      subtitle={
        showRitual
          ? "Calendar and walk-ins — add a booking without leaving the list."
          : "Manage appointments and reservations"
      }
      width="full"
      actions={
        <div className="flex gap-2">
          <Link href="/bookings/new">
            <Button variant="outline" data-testid="button-new-booking-full">
              Full booking
            </Button>
          </Link>
          <Button data-testid="button-new-booking" onClick={() => setBookingDialogOpen(true)}>
            <CalendarPlus className="h-4 w-4 mr-2" />
            Quick booking
          </Button>
        </div>
      }
    >

      <BookingCreateDialog
        open={bookingDialogOpen}
        onOpenChange={setBookingDialogOpen}
        onCreated={(id) => setLocation(`/bookings/${id}`)}
      />

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customer or service..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="input-search-bookings"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40" aria-label="Filter by status" data-testid="select-status-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="CONFIRMED">Confirmed</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
            <SelectItem value="NO_SHOW">No Show</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {listLoading ? (
            <div className="divide-y divide-border">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Calendar className="h-10 w-10 text-muted-foreground mb-4 opacity-40" />
              <p className="font-medium">No bookings found</p>
              <p className="text-sm text-muted-foreground mt-1">
                {search || statusFilter !== "ALL"
                  ? "Try adjusting your filters"
                  : "Create your first booking to get started"}
              </p>
              {!search && statusFilter === "ALL" && (
                <Button className="mt-4" variant="outline" onClick={() => setBookingDialogOpen(true)}>
                  <CalendarPlus className="h-4 w-4 mr-2" />
                  New booking
                </Button>
              )}
            </div>
          ) : (
            <>
            <div className="divide-y divide-border">
              {filtered.map((booking: any) => (
                <Link key={booking.id} href={`/bookings/${booking.id}`}>
                  <div
                    data-testid={`row-booking-${booking.id}`}
                    className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm shrink-0">
                      {booking.customer?.firstName?.charAt(0) ?? "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {booking.customer?.firstName} {booking.customer?.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {booking.service?.name}
                        {booking.staff ? ` · ${booking.staff.displayName}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-sm font-medium">{formatDateTime(booking.startAt)}</span>
                      <div className="flex flex-col items-end gap-0.5">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                            STATUS_COLORS[booking.status] ?? ""
                          }`}
                        >
                          {booking.status}
                        </span>
                        {booking.status === "PENDING" && booking.pendingReason ? (
                          <span className="text-[9px] text-muted-foreground max-w-[140px] truncate text-right">
                            {pendingReasonLabel(booking.pendingReason)}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <BookingRowActions
                      bookingId={booking.id}
                      status={booking.status}
                      customerFirstName={booking.customer?.firstName}
                      customerLastName={booking.customer?.lastName}
                    />
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
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
            </>
          )}
        </CardContent>
      </Card>
    </OperationalPageShell>
  );
}
