import { useState } from "react";
import { Link } from "wouter";
import { useBusiness } from "@/lib/business-context";
import {
  useListBookings,
  getListBookingsQueryKey,
  useUpdateBooking,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatDateTime } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarPlus, Search, Calendar, ChevronRight } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-[hsl(var(--chart-4))]/10 text-[hsl(var(--chart-4))] border-[hsl(var(--chart-4))]/20",
  CONFIRMED: "bg-primary/10 text-primary border-primary/20",
  COMPLETED: "bg-[hsl(var(--chart-3))]/10 text-[hsl(var(--chart-3))] border-[hsl(var(--chart-3))]/20",
  CANCELLED: "bg-destructive/10 text-destructive border-destructive/20",
  NO_SHOW: "bg-muted text-muted-foreground border-border",
};

export default function BookingsPage() {
  const { business } = useBusiness();
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");

  const statusParam = statusFilter !== "ALL" ? (statusFilter as any) : undefined;

  const { data, isLoading } = useListBookings(
    business?.id ?? "",
    { status: statusParam, limit: 50 },
    { query: { enabled: !!business?.id } as any }
  );

  const updateBooking = useUpdateBooking();

  const bookings = (data as any)?.data ?? data ?? [];
  const filtered = search
    ? bookings.filter((b: any) => {
        const name = `${b.customer?.firstName ?? ""} ${b.customer?.lastName ?? ""}`.toLowerCase();
        const svc = (b.service?.name ?? "").toLowerCase();
        return name.includes(search.toLowerCase()) || svc.includes(search.toLowerCase());
      })
    : bookings;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bookings</h1>
          <p className="text-muted-foreground">Manage appointments and reservations</p>
        </div>
        <Link href="/bookings/new">
          <Button data-testid="button-new-booking">
            <CalendarPlus className="h-4 w-4 mr-2" />
            New Booking
          </Button>
        </Link>
      </div>

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
          <SelectTrigger className="w-40" data-testid="select-status-filter">
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
          {isLoading ? (
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
                <Link href="/bookings/new">
                  <Button className="mt-4" variant="outline">
                    <CalendarPlus className="h-4 w-4 mr-2" />
                    New Booking
                  </Button>
                </Link>
              )}
            </div>
          ) : (
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
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          STATUS_COLORS[booking.status] ?? ""
                        }`}
                      >
                        {booking.status}
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
