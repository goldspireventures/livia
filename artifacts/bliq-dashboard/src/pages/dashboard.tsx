import { useBusiness } from "@/lib/business-context";
import { useGetDashboardSummary, useGetActivityFeed } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTime } from "@/lib/format";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Users,
  CalendarPlus,
  CalendarCheck,
  CalendarX,
  UserPlus,
  UserCog,
  Briefcase,
  Wrench,
  AlarmClockOff,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { type LucideIcon } from "lucide-react";

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

interface EventMeta {
  label: string;
  Icon: LucideIcon;
  color: string;
}

const EVENT_META: Record<string, EventMeta> = {
  BOOKING_CREATED:   { label: "New booking created",     Icon: CalendarPlus,  color: "text-primary" },
  BOOKING_CONFIRMED: { label: "Booking confirmed",       Icon: CalendarCheck, color: "text-green-500" },
  BOOKING_CANCELLED: { label: "Booking cancelled",       Icon: CalendarX,     color: "text-destructive" },
  BOOKING_COMPLETED: { label: "Booking completed",       Icon: CheckCircle2,  color: "text-green-500" },
  BOOKING_NO_SHOW:   { label: "Customer no-show",        Icon: CalendarX,     color: "text-muted-foreground" },
  CUSTOMER_CREATED:  { label: "New customer added",      Icon: UserPlus,      color: "text-primary" },
  CUSTOMER_UPDATED:  { label: "Customer profile updated",Icon: UserCog,       color: "text-muted-foreground" },
  STAFF_CREATED:     { label: "Staff member added",      Icon: UserPlus,      color: "text-primary" },
  STAFF_UPDATED:     { label: "Staff member updated",    Icon: UserCog,       color: "text-muted-foreground" },
  STAFF_DEACTIVATED: { label: "Staff member deactivated",Icon: UserCog,       color: "text-destructive" },
  SERVICE_CREATED:   { label: "New service created",     Icon: Briefcase,     color: "text-primary" },
  SERVICE_UPDATED:   { label: "Service updated",         Icon: Briefcase,     color: "text-muted-foreground" },
  SERVICE_DEACTIVATED:{ label: "Service deactivated",   Icon: Briefcase,     color: "text-destructive" },
  AVAILABILITY_UPDATED:{ label: "Availability schedule updated", Icon: Wrench, color: "text-muted-foreground" },
  TIME_OFF_CREATED:  { label: "Time off scheduled",      Icon: AlarmClockOff, color: "text-yellow-500" },
  TIME_OFF_REMOVED:  { label: "Time off removed",        Icon: AlarmClockOff, color: "text-muted-foreground" },
};

function getEventMeta(type: string): EventMeta {
  return EVENT_META[type] ?? {
    label: type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()),
    Icon: Clock,
    color: "text-muted-foreground",
  };
}

export default function DashboardPage() {
  const { business } = useBusiness();

  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary(
    business?.id ?? "",
    { query: { enabled: !!business?.id } as any }
  );

  const { data: activityFeed, isLoading: isLoadingActivity } = useGetActivityFeed(
    business?.id ?? "",
    { limit: 10 },
    { query: { enabled: !!business?.id } as any }
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <p className="text-muted-foreground">
          Welcome to your command center{business?.name ? `, ${business.name}` : ""}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{summary?.todayBookings ?? 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{summary?.pendingCount ?? 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{summary?.completedTodayCount ?? 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{summary?.totalCustomers ?? 0}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : summary?.upcomingBookings && summary.upcomingBookings.length > 0 ? (
              <div className="space-y-4">
                {summary.upcomingBookings.map((booking) => (
                  <Link key={booking.id} href={`/bookings/${booking.id}`}>
                    <div className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0 cursor-pointer hover:opacity-80 transition-opacity">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">
                          {booking.customer.firstName} {booking.customer.lastName}
                        </span>
                        <span className="text-xs text-muted-foreground">{booking.service.name}</span>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="font-semibold text-primary">{formatTime(booking.startAt)}</span>
                        <Badge variant="outline" className="text-[10px] uppercase">
                          {booking.status}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Calendar className="h-8 w-8 text-muted-foreground mb-4 opacity-50" />
                <p className="text-sm text-muted-foreground">No upcoming appointments</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingActivity ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : activityFeed && activityFeed.length > 0 ? (
              <div className="space-y-3">
                {activityFeed.map((activity) => {
                  const meta = getEventMeta(activity.type);
                  return (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className={`mt-0.5 shrink-0 ${meta.color}`}>
                        <meta.Icon className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-sm leading-snug">{meta.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeTime(activity.createdAt)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Clock className="h-8 w-8 text-muted-foreground mb-4 opacity-50" />
                <p className="text-sm text-muted-foreground">No recent activity</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
