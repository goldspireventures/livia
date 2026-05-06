import { useState } from "react";
import { useLocation } from "wouter";
import { useBusiness } from "@/lib/business-context";
import {
  useListCustomers,
  useListServices,
  useListStaff,
  useGetAvailableSlots,
  useCreateBooking,
  getListBookingsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { formatTime } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, CalendarPlus, Clock } from "lucide-react";
import { Link } from "wouter";

export default function BookingNewPage() {
  const [, setLocation] = useLocation();
  const { business } = useBusiness();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [customerId, setCustomerId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [staffId, setStaffId] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [notes, setNotes] = useState("");

  const bid = business?.id ?? "";

  const { data: customersData } = useListCustomers(bid, { limit: 200 }, { query: { enabled: !!bid } as any });
  const { data: servicesData } = useListServices(bid, { isActive: true }, { query: { enabled: !!bid } as any });
  const { data: staffData } = useListStaff(bid, { isActive: true }, { query: { enabled: !!bid } as any });

  const { data: slotsData, isLoading: isLoadingSlots } = useGetAvailableSlots(
    bid,
    { serviceId, date, staffId: staffId || undefined },
    { query: { enabled: !!bid && !!serviceId && !!date } as any }
  );

  const createBooking = useCreateBooking();

  const customers = (customersData as any)?.data ?? customersData ?? [];
  const services = servicesData ?? [];
  const staff = staffData ?? [];
  const availableSlots = ((slotsData as any)?.slots ?? []).filter((s: any) => s.available);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!bid || !customerId || !serviceId || !selectedSlot) {
      toast({ title: "Missing required fields", variant: "destructive" });
      return;
    }
    createBooking.mutate(
      {
        businessId: bid,
        data: {
          customerId,
          serviceId,
          staffId: staffId || undefined,
          startAt: selectedSlot,
          notes: notes || undefined,
        },
      },
      {
        onSuccess: (booking: any) => {
          qc.invalidateQueries({ queryKey: getListBookingsQueryKey(bid) });
          toast({ title: "Booking created" });
          setLocation(`/bookings/${booking.id}`);
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.error ?? "Failed to create booking";
          toast({ title: msg, variant: "destructive" });
        },
      }
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/bookings">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Booking</h1>
          <p className="text-muted-foreground">Schedule a new appointment</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Appointment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Customer *</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger data-testid="select-customer">
                  <SelectValue placeholder="Select customer..." />
                </SelectTrigger>
                <SelectContent>
                  {(customers as any[]).map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.firstName} {c.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Service *</Label>
              <Select
                value={serviceId}
                onValueChange={(v) => { setServiceId(v); setSelectedSlot(""); }}
              >
                <SelectTrigger data-testid="select-service">
                  <SelectValue placeholder="Select service..." />
                </SelectTrigger>
                <SelectContent>
                  {(services as any[]).map((s: any) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} ({s.durationMinutes} min)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Staff member</Label>
              <Select
                value={staffId}
                onValueChange={(v) => { setStaffId(v); setSelectedSlot(""); }}
              >
                <SelectTrigger data-testid="select-staff">
                  <SelectValue placeholder="Any available" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any available</SelectItem>
                  {(staff as any[]).map((s: any) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date *</Label>
              <Input
                type="date"
                value={date}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => { setDate(e.target.value); setSelectedSlot(""); }}
                data-testid="input-date"
              />
            </div>

            {serviceId && date && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Available Times *
                </Label>
                {isLoadingSlots ? (
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-10" />)}
                  </div>
                ) : availableSlots.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center border rounded-md">
                    No available slots for this date
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                    {availableSlots.map((slot: any) => (
                      <button
                        key={slot.startAt}
                        type="button"
                        data-testid={`button-slot-${slot.startAt}`}
                        onClick={() => setSelectedSlot(slot.startAt)}
                        className={`px-3 py-2 rounded-md text-sm font-medium border transition-colors ${
                          selectedSlot === slot.startAt
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border hover:bg-muted"
                        }`}
                      >
                        {formatTime(slot.startAt)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Any special requests or notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                data-testid="input-notes"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Link href="/bookings">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
          <Button
            type="submit"
            disabled={!customerId || !serviceId || !selectedSlot || createBooking.isPending}
            data-testid="button-submit-booking"
          >
            <CalendarPlus className="h-4 w-4 mr-2" />
            {createBooking.isPending ? "Creating..." : "Create Booking"}
          </Button>
        </div>
      </form>
    </div>
  );
}
