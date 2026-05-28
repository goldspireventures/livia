import type { LucideIcon } from "lucide-react";
import {
  AlarmClockOff,
  Briefcase,
  Calendar,
  CalendarCheck,
  CalendarPlus,
  CalendarX,
  CheckCircle2,
  UserCog,
  UserPlus,
  Users,
  Wrench,
} from "lucide-react";
import { verticalPackUi } from "@/lib/vertical-pack-ui";

export type EventMeta = {
  label: string;
  Icon: LucideIcon;
  color: string;
};

const BASE: Record<string, Omit<EventMeta, "label"> & { label: string | ((loc: string) => string) }> = {
  BOOKING_CREATED: { label: "New booking created", Icon: CalendarPlus, color: "text-primary" },
  BOOKING_CONFIRMED: {
    label: "Booking confirmed",
    Icon: CalendarCheck,
    color: "text-[hsl(var(--chart-2))]",
  },
  BOOKING_CANCELLED: { label: "Booking cancelled", Icon: CalendarX, color: "text-destructive" },
  BOOKING_COMPLETED: {
    label: "Booking completed",
    Icon: CheckCircle2,
    color: "text-[hsl(var(--chart-3))]",
  },
  BOOKING_NO_SHOW: { label: "Customer no-show", Icon: CalendarX, color: "text-muted-foreground" },
  CUSTOMER_CREATED: { label: "New client added", Icon: UserPlus, color: "text-[hsl(var(--chart-1))]" },
  CUSTOMER_UPDATED: { label: "Client profile updated", Icon: UserCog, color: "text-muted-foreground" },
  STAFF_CREATED: { label: "Team member added", Icon: UserPlus, color: "text-primary" },
  STAFF_UPDATED: { label: "Team member updated", Icon: UserCog, color: "text-muted-foreground" },
  STAFF_DEACTIVATED: { label: "Team member deactivated", Icon: UserCog, color: "text-destructive" },
  SERVICE_CREATED: { label: "New service created", Icon: Briefcase, color: "text-primary" },
  SERVICE_UPDATED: { label: "Service updated", Icon: Briefcase, color: "text-muted-foreground" },
  SERVICE_DEACTIVATED: { label: "Service deactivated", Icon: Briefcase, color: "text-destructive" },
  AVAILABILITY_UPDATED: {
    label: "Availability schedule updated",
    Icon: Wrench,
    color: "text-muted-foreground",
  },
  TIME_OFF_CREATED: {
    label: "Time off scheduled",
    Icon: AlarmClockOff,
    color: "text-[hsl(var(--chart-4))]",
  },
  TIME_OFF_REMOVED: { label: "Time off removed", Icon: AlarmClockOff, color: "text-muted-foreground" },
  BUSINESS_UPDATED: {
    label: (loc) => `${loc} settings updated`,
    Icon: Wrench,
    color: "text-muted-foreground",
  },
  VISIT_FEEDBACK_SUBMITTED: {
    label: "Client feedback received",
    Icon: Users,
    color: "text-primary",
  },
};

export function getActivityEventMeta(
  type: string,
  vertical?: string | null,
  category?: string | null,
): EventMeta {
  const loc = verticalPackUi(vertical, category).locationNoun;
  const row = BASE[type];
  if (!row) {
    return {
      label: type.replace(/_/g, " ").toLowerCase(),
      Icon: Calendar,
      color: "text-muted-foreground",
    };
  }
  const label = typeof row.label === "function" ? row.label(loc) : row.label;
  return { label, Icon: row.Icon, color: row.color };
}
