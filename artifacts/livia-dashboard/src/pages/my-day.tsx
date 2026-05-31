// STAFF landing — w4.staff.my-day.mobile (web + responsive)

import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useBusiness } from "@/lib/business-context";
import { useMembership, personaQuery } from "@/lib/membership-context";
import { apiFetch } from "@/lib/api-fetch";
import { useFormat } from "@/lib/use-format";
import { RefreshCw } from "lucide-react";
import { OPERATIONAL_REFETCH_MS } from "@/lib/operational-cache";
import { usePersona } from "@/lib/persona";
import { StaffMyDayLoading } from "@/components/staff/staff-my-day-loading";
import { StaffMyDayHero, type StaffMyDayBooking } from "@/components/staff/staff-my-day-hero";
import { StaffMyDayTimeline } from "@/components/staff/staff-my-day-timeline";
import { StaffMyDayQuickActions } from "@/components/staff/staff-my-day-quick-actions";
import { shouldShowStaffMyDayTimeline } from "@workspace/policy";

interface MyDayResponse {
  staffId: string | null;
  todayCount: number;
  weekCount: number;
  today: StaffMyDayBooking[];
  next: StaffMyDayBooking | null;
  role: string;
  effectiveRole: string;
}

export default function MyDayPage() {
  const { business } = useBusiness();
  const { kind: persona } = usePersona();
  const { effectiveRole, viewingAsStaffId, ownStaffId } = useMembership();
  const { formatTime } = useFormat();
  const bid = business?.id ?? "";
  const vertical = (business as { vertical?: string } | null)?.vertical ?? null;

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["my-day", bid, viewingAsStaffId, ownStaffId],
    queryFn: () =>
      apiFetch<MyDayResponse>(`/businesses/${bid}/my-day${personaQuery(viewingAsStaffId)}`),
    enabled: !!bid,
    staleTime: 30_000,
    refetchInterval: OPERATIONAL_REFETCH_MS,
  });

  const isViewingAs = effectiveRole === "STAFF" && viewingAsStaffId !== null;

  if (isLoading || !data) {
    return (
      <div className="max-w-xl mx-auto w-full px-1" data-testid="staff-my-day-page">
        <StaffMyDayLoading />
      </div>
    );
  }

  const emptyChair = data.todayCount === 0 && (persona === "staff" || effectiveRole === "STAFF");
  const next = data.next;
  const canRunLate = next?.status === "CONFIRMED" || next?.status === "PENDING";
  const showTimeline = shouldShowStaffMyDayTimeline({
    todayBookingCount: data.todayCount,
    hasNextBooking: !!next,
  });

  return (
    <div
      className="max-w-xl mx-auto w-full pb-28 md:pb-6 space-y-4"
      data-testid="staff-my-day-page"
    >
      <div className="flex items-center gap-2">
        <p className="flex-1 text-center text-[13px] text-muted-foreground truncate">
          {business?.name ?? "Your shop"}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0 h-9 w-9"
          aria-label="Refresh my day"
          disabled={isFetching}
          onClick={() => void refetch()}
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {isViewingAs ? (
        <Badge variant="outline" className="text-xs mx-auto block w-fit">
          Viewing as staff (read-only)
        </Badge>
      ) : null}

      {!data.staffId ? (
        <div className="rounded-xl border border-border/70 bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
          Your account isn&apos;t linked to a staff row yet — ask your manager to link it.
        </div>
      ) : (
        <div className="md:grid md:grid-cols-2 md:gap-6 md:items-start">
          <div className="space-y-4">
            {next ? (
              <StaffMyDayHero booking={next} formatTime={formatTime} vertical={vertical} />
            ) : emptyChair ? (
              <section
                className="rounded-[20px] border border-dashed border-border/80 bg-muted/20 px-5 py-8 text-center"
                data-testid="staff-my-day-empty"
              >
                <p className="text-lg font-medium">Your day is open</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
                  Walk-ins welcome — check the floor calendar or ask front desk.
                </p>
              </section>
            ) : (
              <section className="rounded-[20px] border border-border/70 bg-card px-6 py-8 text-center">
                <p className="text-sm text-muted-foreground">No upcoming appointments today.</p>
              </section>
            )}

            <StaffMyDayQuickActions
              bookingId={next?.id}
              customerName={next?.customer?.displayName}
              canRunLate={canRunLate}
            />
          </div>

          {showTimeline ? (
            <StaffMyDayTimeline
              bookings={data.today}
              nextId={next?.id}
              formatTime={formatTime}
            />
          ) : null}
        </div>
      )}

      {data.weekCount > 0 ? (
        <p className="text-xs text-muted-foreground text-center font-mono">
          {data.weekCount} more this week after today
        </p>
      ) : null}
    </div>
  );
}
