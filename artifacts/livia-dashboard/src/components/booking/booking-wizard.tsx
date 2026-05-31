import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { useBusiness } from "@/lib/business-context";
import { staffListParams } from "@/lib/staff-params";
import { formatDateTime, formatTime } from "@/lib/format";
import { verticalPackUi } from "@/lib/vertical-pack-ui";
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
import { invalidateOperationalState } from "@/lib/operational-cache";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { CalendarPlus, Check, ChevronRight, Clock, UserPlus } from "lucide-react";

const STEPS = ["Client", "Service", "Team", "Time", "Confirm"] as const;
type Step = (typeof STEPS)[number];

const PAGE_SIZE = 30;

type BookingWizardProps = {
  mode?: "page" | "dialog";
  /** Minimal flow for front-desk / quick add. */
  quick?: boolean;
  onCreated?: (bookingId: string) => void;
  onCancel?: () => void;
};

export function BookingWizard({ mode = "page", quick = false, onCreated, onCancel }: BookingWizardProps) {
  const [, setLocation] = useLocation();
  const { business } = useBusiness();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [step, setStep] = useState<Step>("Client");
  const [customerId, setCustomerId] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [staffId, setStaffId] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [notes, setNotes] = useState("");

  const bid = business?.id ?? "";

  useEffect(() => {
    const prefill = new URLSearchParams(window.location.search).get("customerId");
    if (prefill) setCustomerId(prefill);
  }, []);
  const debouncedCustomerSearch = useDebouncedValue(customerSearch, 300);

  const { data: customersData, isLoading: customersLoading } = useListCustomers(
    bid,
    { search: debouncedCustomerSearch || undefined, limit: PAGE_SIZE },
    { query: { enabled: !!bid && step === "Client" } as never },
  );

  const { data: servicesData } = useListServices(
    bid,
    { isActive: true },
    { query: { enabled: !!bid } as never },
  );

  const { data: staffData, isLoading: staffLoading } = useListStaff(
    bid,
    staffListParams({ isActive: true, serviceId: serviceId || undefined }),
    { query: { enabled: !!bid && !!serviceId } as never },
  );

  const { data: slotsData, isLoading: isLoadingSlots } = useGetAvailableSlots(
    bid,
    { serviceId, date, staffId: staffId || undefined },
    { query: { enabled: !!bid && !!serviceId && !!date && step === "Time" } as never },
  );

  const createBooking = useCreateBooking();

  const customers = (customersData as { data?: unknown[] })?.data ?? customersData ?? [];
  const services = servicesData ?? [];
  const staff = staffData ?? [];
  const availableSlots = ((slotsData as { slots?: { startAt: string; available: boolean }[] })?.slots ?? []).filter(
    (s) => s.available,
  );

  const selectedCustomer = (customers as { id: string; firstName?: string; lastName?: string }[]).find(
    (c) => c.id === customerId,
  );
  const selectedService = (services as { id: string; name: string; durationMinutes?: number }[]).find(
    (s) => s.id === serviceId,
  );
  const selectedStaff = (staff as { id: string; displayName: string }[]).find((s) => s.id === staffId);

  const vocab = verticalPackUi(
    (business as { vertical?: string } | null)?.vertical,
    business?.category,
  );

  const activeSteps = useMemo((): Step[] => {
    // Quick book: skip Team when there's only one eligible staff member or none are configured.
    // Full wizard: keep Team unless there are truly zero eligible staff.
    const base = [...STEPS];
    if (!serviceId || staffLoading) return base;
    const eligibleCount = staff.length;
    if (quick && eligibleCount <= 1) {
      return base.filter((s) => s !== "Team") as Step[];
    }
    if (eligibleCount === 0) {
      return base.filter((s) => s !== "Team") as Step[];
    }
    return base;
  }, [quick, serviceId, staffLoading, staff.length]);

  // Auto-pick the only eligible staff member in quick mode.
  useEffect(() => {
    if (!quick) return;
    if (!serviceId || staffLoading) return;
    if (staff.length === 1) {
      const only = (staff as { id: string }[])[0];
      if (only?.id && staffId !== only.id) {
        setStaffId(only.id);
        setSelectedSlot("");
      }
    }
  }, [quick, serviceId, staffLoading, staff, staffId]);

  useEffect(() => {
    if (!activeSteps.includes(step)) {
      const fallback = activeSteps[Math.max(0, activeSteps.length - 1)] ?? "Client";
      setStep(fallback);
    }
  }, [activeSteps, step]);

  useEffect(() => {
    if (!serviceId) return;
    if (staffId && !(staff as { id: string }[]).some((s) => s.id === staffId)) {
      setStaffId("");
      setSelectedSlot("");
    }
  }, [serviceId, staff, staffId]);

  const stepIndex = activeSteps.indexOf(step);

  function goNext() {
    if (step === "Client" && !customerId) {
      toast({ title: "Choose a client to continue", variant: "destructive" });
      return;
    }
    if (step === "Service" && !serviceId) {
      toast({ title: "Choose a service to continue", variant: "destructive" });
      return;
    }
    if (step === "Time" && !selectedSlot) {
      toast({ title: "Pick an available time", variant: "destructive" });
      return;
    }
    const next = activeSteps[stepIndex + 1];
    if (next) setStep(next);
  }

  function goBack() {
    const prev = activeSteps[stepIndex - 1];
    if (prev) setStep(prev);
  }

  function handleSubmit() {
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
        onSuccess: (booking: { id: string }) => {
          invalidateOperationalState(qc, bid);
          toast({ title: "Booking created" });
          if (onCreated) {
            onCreated(booking.id);
          } else {
            setLocation(`/bookings/${booking.id}`);
          }
        },
        onError: (err: unknown) => {
          const msg =
            (err as { message?: string })?.message ?? "Failed to create booking";
          toast({ title: msg, variant: "destructive" });
        },
      },
    );
  }

  const staffEmptyHint = useMemo(() => {
    if (!serviceId || staffLoading) return null;
    if (staff.length > 0) return null;
    return `No ${vocab.teamNoun.toLowerCase()} assigned to this service yet. Assign them under Team, or pick another service.`;
  }, [serviceId, staff.length, staffLoading, vocab.teamNoun]);

  return (
    <div
      data-testid={mode === "page" ? "booking-new-page" : undefined}
      className={
        mode === "dialog"
          ? "space-y-4"
          : "space-y-4"
      }
    >
      <p className="text-sm text-muted-foreground" data-testid="booking-wizard-step-label">
        Step {stepIndex + 1} of {activeSteps.length} — <span className="text-foreground font-medium">{step}</span>
      </p>

      <div className="flex gap-1">
        {activeSteps.map((s, i) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full ${i <= stepIndex ? "bg-primary" : "bg-muted"}`}
          />
        ))}
      </div>

      {step === "Client" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Who is this for?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Search clients</Label>
              <Input
                placeholder="Name, email, or phone…"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                data-testid="booking-wizard-customer-search"
              />
            </div>
            {customersLoading ? (
              <Skeleton className="h-32" />
            ) : (customers as { id: string; firstName?: string; lastName?: string }[]).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                {customerSearch ? "No clients match — try another search." : "No clients yet."}
              </p>
            ) : (
              <div className="divide-y divide-border rounded-md border max-h-56 overflow-y-auto">
                {(customers as { id: string; firstName?: string; lastName?: string; email?: string }[]).map(
                  (c) => (
                    <button
                      key={c.id}
                      type="button"
                      data-testid={`booking-wizard-client-${c.id}`}
                      onClick={() => setCustomerId(c.id)}
                      className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/40 ${
                        customerId === c.id ? "bg-primary/10" : ""
                      }`}
                    >
                      <span className="font-medium">
                        {c.firstName} {c.lastName}
                      </span>
                      {customerId === c.id && <Check className="h-4 w-4 text-primary" />}
                    </button>
                  ),
                )}
              </div>
            )}
            <Link href="/customers">
              <Button type="button" variant="outline" size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Add new client
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {step === "Service" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Which service?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Select
              value={serviceId}
              onValueChange={(v) => {
                setServiceId(v);
                setStaffId("");
                setSelectedSlot("");
              }}
            >
              <SelectTrigger data-testid="select-service">
                <SelectValue placeholder="Select service…" />
              </SelectTrigger>
              <SelectContent>
                {(services as { id: string; name: string; durationMinutes?: number }[]).map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} ({s.durationMinutes} min)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {step === "Team" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Who will take it?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {staffEmptyHint && (
              <p className="text-sm text-muted-foreground border rounded-md p-3">
                {staffEmptyHint}{" "}
                <Link href="/staff" className="text-primary underline-offset-2 hover:underline">
                  Open team
                </Link>
              </p>
            )}
            <Select
              value={staffId}
              onValueChange={(v) => {
                setStaffId(v === "__any__" ? "" : v);
                setSelectedSlot("");
              }}
            >
              <SelectTrigger data-testid="select-staff">
                <SelectValue
                  placeholder={staffLoading ? "Loading…" : `Choose ${vocab.teamNoun.toLowerCase()} member…`}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__any__">First available</SelectItem>
                {(staff as { id: string; displayName: string }[]).map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {step === "Time" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              When?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={date}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => {
                  setDate(e.target.value);
                  setSelectedSlot("");
                }}
                data-testid="input-date"
              />
            </div>
            {serviceId && date && (
              <div className="space-y-2">
                <Label>Available times</Label>
                {isLoadingSlots ? (
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <Skeleton key={i} className="h-10" />
                    ))}
                  </div>
                ) : availableSlots.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center border rounded-md">
                    No slots on this day — try another date or team member.
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                    {availableSlots.map((slot) => (
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
          </CardContent>
        </Card>
      )}

      {step === "Confirm" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Client</span>
              <span className="font-medium text-right">
                {selectedCustomer
                  ? `${selectedCustomer.firstName ?? ""} ${selectedCustomer.lastName ?? ""}`.trim()
                  : "—"}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Service</span>
              <span className="font-medium">{selectedService?.name ?? "—"}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Team</span>
              <span className="font-medium">{selectedStaff?.displayName ?? "First available"}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Time</span>
              <span className="font-medium text-right">
                {selectedSlot ? formatDateTime(selectedSlot) : "—"}
              </span>
            </div>
            <div className="space-y-2 pt-2">
              <Label>Notes (optional)</Label>
              <Textarea
                placeholder="Colour formula, preferences…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                data-testid="input-notes"
              />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        {stepIndex > 0 ? (
          <Button type="button" variant="outline" onClick={goBack}>
            Back
          </Button>
        ) : mode === "dialog" ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        ) : (
          <Link href="/bookings">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
        )}
        {step !== "Confirm" ? (
          <Button type="button" onClick={goNext} className="ml-auto" data-testid="booking-wizard-next">
            Continue
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button
            type="button"
            className="ml-auto"
            disabled={createBooking.isPending}
            onClick={handleSubmit}
            data-testid="button-submit-booking"
          >
            <CalendarPlus className="h-4 w-4 mr-2" />
            {createBooking.isPending ? "Creating…" : "Create booking"}
          </Button>
        )}
      </div>
    </div>
  );
}
