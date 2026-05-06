import { useParams, Link } from "wouter";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, User, Scissors, Clock, FileText } from "lucide-react";

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

const ACTION_LABELS: Record<string, string> = {
  CONFIRMED: "Confirm",
  COMPLETED: "Mark Complete",
  CANCELLED: "Cancel",
  NO_SHOW: "No Show",
};

const ACTION_VARIANTS: Record<string, "default" | "destructive" | "outline"> = {
  CONFIRMED: "default",
  COMPLETED: "default",
  CANCELLED: "destructive",
  NO_SHOW: "outline",
};

export default function BookingDetailPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const { business } = useBusiness();
  const { toast } = useToast();
  const qc = useQueryClient();

  const bid = business?.id ?? "";
  const bkId = bookingId ?? "";

  const { data: booking, isLoading } = useGetBooking(
    bid,
    bkId,
    { query: { enabled: !!bid && !!bkId } as any }
  );

  const updateBooking = useUpdateBooking();

  function handleTransition(newStatus: string) {
    if (!bid || !bkId) return;
    updateBooking.mutate(
      { businessId: bid, bookingId: bkId, data: { status: newStatus as any } },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getGetBookingQueryKey(bid, bkId) });
          qc.invalidateQueries({ queryKey: getListBookingsQueryKey(bid) });
          toast({ title: `Booking ${newStatus.toLowerCase()}` });
        },
        onError: () => toast({ title: "Failed to update booking", variant: "destructive" }),
      }
    );
  }

  const allowedTransitions = (booking as any) ? TRANSITIONS[(booking as any).status] ?? [] : [];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/bookings">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Booking Detail</h1>
          <p className="text-muted-foreground">View and manage appointment</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : !booking ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">Booking not found</CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Status</CardTitle>
              <span
                className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                  STATUS_COLORS[(booking as any).status] ?? ""
                }`}
              >
                {(booking as any).status}
              </span>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <Clock className="h-4 w-4" />
                {formatDateTime((booking as any).startAt)} — {formatDateTime((booking as any).endAt)}
              </div>
              {allowedTransitions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {allowedTransitions.map((status) => (
                    <Button
                      key={status}
                      variant={ACTION_VARIANTS[status] ?? "outline"}
                      size="sm"
                      disabled={updateBooking.isPending}
                      onClick={() => handleTransition(status)}
                      data-testid={`button-transition-${status}`}
                    >
                      {ACTION_LABELS[status]}
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Customer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {(booking as any).customer ? (
                  <>
                    <Link href={`/customers/${(booking as any).customer.id}`}>
                      <p className="font-medium hover:text-primary transition-colors cursor-pointer">
                        {(booking as any).customer.firstName} {(booking as any).customer.lastName}
                      </p>
                    </Link>
                    {(booking as any).customer.email && (
                      <p className="text-sm text-muted-foreground">{(booking as any).customer.email}</p>
                    )}
                    {(booking as any).customer.phone && (
                      <p className="text-sm text-muted-foreground">{(booking as any).customer.phone}</p>
                    )}
                  </>
                ) : (
                  <p className="text-muted-foreground text-sm">No customer</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Scissors className="h-4 w-4" />
                  Service
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {(booking as any).service ? (
                  <>
                    <p className="font-medium">{(booking as any).service.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(booking as any).service.durationMinutes} minutes
                    </p>
                    {(booking as any).staff && (
                      <p className="text-sm text-muted-foreground">
                        with {(booking as any).staff.displayName}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-muted-foreground text-sm">No service</p>
                )}
              </CardContent>
            </Card>
          </div>

          {(booking as any).notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{(booking as any).notes}</p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
