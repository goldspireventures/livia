import { useParams, Link } from "wouter";
import { useBusiness } from "@/lib/business-context";
import {
  useGetCustomer,
  getGetCustomerQueryKey,
  useUpdateCustomer,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { formatDateTime } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Mail, Phone, Calendar, AlertCircle } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "text-[hsl(var(--chart-4))]",
  CONFIRMED: "text-primary",
  COMPLETED: "text-[hsl(var(--chart-3))]",
  CANCELLED: "text-destructive",
  NO_SHOW: "text-muted-foreground",
};

export default function CustomerDetailPage() {
  const { customerId } = useParams<{ customerId: string }>();
  const { business } = useBusiness();
  const { toast } = useToast();
  const qc = useQueryClient();

  const bid = business?.id ?? "";
  const cid = customerId ?? "";

  const { data: customer, isLoading } = useGetCustomer(
    bid,
    cid,
    { query: { enabled: !!bid && !!cid } as any }
  );

  const updateCustomer = useUpdateCustomer();

  function toggleBlock() {
    if (!bid || !cid || !customer) return;
    updateCustomer.mutate(
      { businessId: bid, customerId: cid, data: { isBlocked: !(customer as any).isBlocked } },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getGetCustomerQueryKey(bid, cid) });
          toast({ title: (customer as any).isBlocked ? "Customer unblocked" : "Customer blocked" });
        },
        onError: () => toast({ title: "Failed to update customer", variant: "destructive" }),
      }
    );
  }

  const c = customer as any;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/customers">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customer Profile</h1>
          <p className="text-muted-foreground">View booking history and details</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-40" />
          <Skeleton className="h-64" />
        </div>
      ) : !c ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">Customer not found</CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xl">
                    {c.firstName?.charAt(0) ?? "?"}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold" data-testid="text-customer-name">
                      {c.firstName} {c.lastName}
                    </h2>
                    {c.isBlocked && (
                      <span className="inline-flex items-center gap-1 text-xs text-destructive">
                        <AlertCircle className="h-3 w-3" />
                        Blocked
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  variant={c.isBlocked ? "outline" : "destructive"}
                  size="sm"
                  onClick={toggleBlock}
                  disabled={updateCustomer.isPending}
                  data-testid="button-toggle-block"
                >
                  {c.isBlocked ? "Unblock" : "Block"}
                </Button>
              </div>

              <div className="mt-6 space-y-3">
                {c.email && (
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${c.email}`} className="hover:text-primary transition-colors">
                      {c.email}
                    </a>
                  </div>
                )}
                {c.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${c.phone}`} className="hover:text-primary transition-colors">
                      {c.phone}
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Booking History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {!c.recentBookings || c.recentBookings.length === 0 ? (
                <p className="text-sm text-muted-foreground px-6 py-8 text-center">No bookings yet</p>
              ) : (
                <div className="divide-y divide-border">
                  {c.recentBookings.map((booking: any) => (
                    <Link key={booking.id} href={`/bookings/${booking.id}`}>
                      <div className="flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors cursor-pointer">
                        <div>
                          <p className="font-medium text-sm">{booking.service?.name ?? "—"}</p>
                          <p className="text-xs text-muted-foreground">{formatDateTime(booking.startAt)}</p>
                        </div>
                        <span className={`text-xs font-semibold ${STATUS_COLORS[booking.status] ?? ""}`}>
                          {booking.status}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
