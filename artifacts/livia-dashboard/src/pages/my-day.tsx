// STAFF landing page — "My Day".
// Read-only by design: today's slate, the next appointment, and the
// roster of customers I've served before.

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useBusiness } from "@/lib/business-context";
import { useMembership, personaQuery } from "@/lib/membership-context";
import { apiFetch } from "@/lib/api-fetch";
import { Link } from "wouter";
import { Calendar, Users, Clock, ArrowRight } from "lucide-react";
import { PersonaRitualHeader } from "@/components/ritual/persona-ritual-header";
import { PageFrame } from "@/components/ui/page-frame";
import { RunningLateSheet } from "@/components/ops/running-late-sheet";
import { OPERATIONAL_REFETCH_MS } from "@/lib/operational-cache";
import { usePersona } from "@/lib/persona";

interface MyDayResponse {
  staffId: string | null;
  todayCount: number;
  weekCount: number;
  today: Array<{
    id: string;
    startAt: string;
    endAt: string;
    status: string;
    customer?: { id: string; displayName: string | null } | null;
    service?: { id: string; name: string } | null;
  }>;
  next: MyDayResponse["today"][number] | null;
  myCustomers: Array<{ id: string; displayName: string | null; email: string | null }>;
  role: string;
  effectiveRole: string;
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function timeUntil(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms < 0) return "now";
  const m = Math.round(ms / 60000);
  if (m < 60) return `in ${m}m`;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return mm ? `in ${h}h ${mm}m` : `in ${h}h`;
}

export default function MyDayPage() {
  const { business } = useBusiness();
  const { kind: persona } = usePersona();
  const { effectiveRole, viewingAsStaffId, ownStaffId } = useMembership();
  const bid = business?.id ?? "";

  const { data, isLoading } = useQuery({
    queryKey: ["my-day", bid, viewingAsStaffId, ownStaffId],
    queryFn: () =>
      apiFetch<MyDayResponse>(`/businesses/${bid}/my-day${personaQuery(viewingAsStaffId)}`),
    enabled: !!bid,
    staleTime: 30_000,
    refetchInterval: OPERATIONAL_REFETCH_MS,
  });

  if (isLoading || !data) {
    return (
      <PageFrame width="full">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </PageFrame>
    );
  }

  const isViewingAs = effectiveRole === "STAFF" && viewingAsStaffId !== null;

  const emptyChair =
    data.todayCount === 0 &&
    (persona === "staff" || effectiveRole === "STAFF");

  return (
    <PageFrame width="full">
      <PersonaRitualHeader
        variant="page"
        subtitle={
          data.todayCount === 0
            ? emptyChair
              ? "Your chair is open — here's how walk-ins work: check the floor calendar or ask front desk."
              : "Nothing on the books today."
            : `${data.todayCount} appointment${data.todayCount === 1 ? "" : "s"} today · ${data.weekCount} more this week`
        }
      />
      {isViewingAs ? (
        <Badge variant="outline" className="text-xs -mt-4">
          Viewing as staff (read-only)
        </Badge>
      ) : null}

      {data.next ? (
        <Card className="border-primary/40 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Clock className="h-4 w-4" />
              Up next
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between gap-3 flex-wrap">
              <div>
                <div className="text-2xl font-semibold">
                  {data.next.customer?.displayName ?? "Unnamed customer"}
                </div>
                <div className="text-sm text-muted-foreground">
                  {data.next.service?.name ?? "Appointment"}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-semibold">{fmtTime(data.next.startAt)}</div>
                <div className="text-xs text-muted-foreground">{timeUntil(data.next.startAt)}</div>
              </div>
            </div>
            {data.next.status === "CONFIRMED" ? (
              <div className="mt-4">
                <RunningLateSheet
                  bookingId={data.next.id}
                  customerName={data.next.customer?.displayName ?? undefined}
                />
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Today's appointments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.today.length === 0 ? (
            <div className="text-sm text-muted-foreground py-6 text-center">
              {data.staffId
                ? "No appointments today."
                : "Your account isn't linked to a staff row yet — ask your manager to link it."}
            </div>
          ) : (
            <ul className="divide-y">
              {data.today.map((b) => (
                <li key={b.id} className="py-3 flex items-center gap-4">
                  <div className="w-20 shrink-0">
                    <div className="font-medium">{fmtTime(b.startAt)}</div>
                    <div className="text-xs text-muted-foreground">{fmtTime(b.endAt)}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {b.customer?.displayName ?? "Unnamed customer"}
                    </div>
                    <div className="text-sm text-muted-foreground truncate">
                      {b.service?.name ?? "Appointment"}
                    </div>
                  </div>
                  <Badge variant={b.status === "CONFIRMED" ? "default" : "secondary"}>
                    {b.status.toLowerCase()}
                  </Badge>
                  <Link href={`/bookings/${b.id}`}>
                    <Button variant="ghost" size="sm">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            My customers
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.myCustomers.length === 0 ? (
            <div className="text-sm text-muted-foreground py-6 text-center">
              No customers yet — they'll show up here as you work through bookings.
            </div>
          ) : (
            <ul className="divide-y">
              {data.myCustomers.slice(0, 20).map((c) => (
                <li key={c.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{c.displayName ?? "Unnamed"}</div>
                    {c.email ? (
                      <div className="text-xs text-muted-foreground truncate">{c.email}</div>
                    ) : null}
                  </div>
                  <Link href={`/customers/${c.id}`}>
                    <Button variant="ghost" size="sm">View</Button>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </PageFrame>
  );
}
