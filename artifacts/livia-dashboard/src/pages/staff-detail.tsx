import { useState } from "react";
import { useParams, Link } from "wouter";
import { useBusiness } from "@/lib/business-context";
import {
  useGetStaff,
  getGetStaffQueryKey,
  useUpdateStaff,
  useListServices,
  useGetStaffServices,
  getGetStaffServicesQueryKey,
  useSetStaffServices,
  useListAvailabilityRules,
  getListAvailabilityRulesQueryKey,
  useSetAvailabilityRules,
  useListTimeOff,
  getListTimeOffQueryKey,
  useCreateTimeOff,
  useDeleteTimeOff,
  getListStaffQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Trash2 } from "lucide-react";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function StaffDetailPage() {
  const { staffId } = useParams<{ staffId: string }>();
  const { business } = useBusiness();
  const { toast } = useToast();
  const qc = useQueryClient();

  const bid = business?.id ?? "";
  const sid = staffId ?? "";

  const { data: member, isLoading } = useGetStaff(
    bid,
    sid,
    { query: { enabled: !!bid && !!sid } as any }
  );

  const updateStaff = useUpdateStaff();

  function toggleActive() {
    if (!bid || !sid || !member) return;
    updateStaff.mutate(
      { businessId: bid, staffId: sid, data: { isActive: !(member as any).isActive } },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getGetStaffQueryKey(bid, sid) });
          qc.invalidateQueries({ queryKey: getListStaffQueryKey(bid) });
          toast({ title: (member as any).isActive ? "Staff deactivated" : "Staff activated" });
        },
      }
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/staff">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isLoading ? <Skeleton className="h-8 w-48 inline-block" /> : (member as any)?.displayName ?? "Staff Member"}
          </h1>
          <p className="text-muted-foreground">Manage staff details and schedule</p>
        </div>
      </div>

      {!isLoading && member && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Status</p>
                <p className={`font-medium ${(member as any).isActive ? "text-[hsl(var(--chart-3))]" : "text-muted-foreground"}`}>
                  {(member as any).isActive ? "Active" : "Inactive"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {(member as any).isActive ? "Active" : "Inactive"}
                </span>
                <Switch
                  checked={(member as any).isActive}
                  onCheckedChange={toggleActive}
                  data-testid="switch-active"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="services">
        <TabsList className="w-full">
          <TabsTrigger value="services" className="flex-1">Services</TabsTrigger>
          <TabsTrigger value="availability" className="flex-1">Availability</TabsTrigger>
          <TabsTrigger value="time-off" className="flex-1">Time Off</TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="mt-4">
          <StaffServicesTab businessId={bid} staffId={sid} />
        </TabsContent>

        <TabsContent value="availability" className="mt-4">
          <StaffAvailabilityTab businessId={bid} staffId={sid} />
        </TabsContent>

        <TabsContent value="time-off" className="mt-4">
          <StaffTimeOffTab businessId={bid} staffId={sid} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StaffServicesTab({ businessId, staffId }: { businessId: string; staffId: string }) {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: allServices } = useListServices(
    businessId,
    { isActive: true },
    { query: { enabled: !!businessId } as any }
  );

  const { data: assignedServices, isLoading } = useGetStaffServices(
    businessId,
    staffId,
    { query: { enabled: !!businessId && !!staffId } as any }
  );

  const setStaffServices = useSetStaffServices();
  const assigned = (assignedServices as any[]) ?? [];
  const assignedIds = new Set(assigned.map((s: any) => s.id));

  function toggleService(serviceId: string) {
    const next = assignedIds.has(serviceId)
      ? [...assignedIds].filter((id) => id !== serviceId)
      : [...assignedIds, serviceId];

    setStaffServices.mutate(
      { businessId, staffId, data: { serviceIds: next } },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getGetStaffServicesQueryKey(businessId, staffId) });
          toast({ title: "Services updated" });
        },
        onError: () => toast({ title: "Failed to update services", variant: "destructive" }),
      }
    );
  }

  if (isLoading) {
    return <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-14" />)}</div>;
  }

  const services = (allServices as any[]) ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Assigned Services</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {services.length === 0 ? (
          <p className="text-sm text-muted-foreground">No services available. Create services first.</p>
        ) : (
          services.map((svc: any) => (
            <div key={svc.id} className="flex items-center gap-3">
              <Checkbox
                id={svc.id}
                checked={assignedIds.has(svc.id)}
                onCheckedChange={() => toggleService(svc.id)}
                data-testid={`checkbox-service-${svc.id}`}
              />
              <label htmlFor={svc.id} className="flex-1 cursor-pointer">
                <p className="font-medium">{svc.name}</p>
                <p className="text-xs text-muted-foreground">{svc.durationMinutes} min</p>
              </label>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function StaffAvailabilityTab({ businessId, staffId }: { businessId: string; staffId: string }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [initialized, setInitialized] = useState(false);
  const [localRules, setLocalRules] = useState<Map<number, { startTime: string; endTime: string }>>(new Map());

  const { data: rules, isLoading } = useListAvailabilityRules(
    businessId,
    { staffId },
    { query: { enabled: !!businessId && !!staffId } as any }
  );

  if (!initialized && rules) {
    const map = new Map<number, { startTime: string; endTime: string }>();
    (rules as any[]).forEach((r: any) => map.set(r.dayOfWeek, { startTime: r.startTime, endTime: r.endTime }));
    setLocalRules(map);
    setInitialized(true);
  }

  const setRules = useSetAvailabilityRules();

  function toggleDay(day: number) {
    const next = new Map(localRules);
    if (next.has(day)) {
      next.delete(day);
    } else {
      next.set(day, { startTime: "09:00", endTime: "17:00" });
    }
    setLocalRules(next);
  }

  function updateTime(day: number, field: "startTime" | "endTime", val: string) {
    const next = new Map(localRules);
    const cur = next.get(day) ?? { startTime: "09:00", endTime: "17:00" };
    next.set(day, { ...cur, [field]: val });
    setLocalRules(next);
  }

  function save() {
    const rulesArray = Array.from(localRules.entries()).map(([dayOfWeek, { startTime, endTime }]) => ({
      dayOfWeek,
      startTime,
      endTime,
    }));

    setRules.mutate(
      { businessId, data: { rules: rulesArray, staffId } },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListAvailabilityRulesQueryKey(businessId, { staffId }) });
          toast({ title: "Availability saved" });
        },
        onError: () => toast({ title: "Failed to save", variant: "destructive" }),
      }
    );
  }

  if (isLoading) return <Skeleton className="h-64" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Weekly Schedule</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {DAYS.map((day, idx) => {
          const hasDay = localRules.has(idx);
          const rule = localRules.get(idx);
          return (
            <div
              key={idx}
              className={`flex items-center gap-3 p-3 rounded-md border transition-colors ${
                hasDay ? "border-primary/20 bg-primary/5" : "border-border"
              }`}
            >
              <Switch
                checked={hasDay}
                onCheckedChange={() => toggleDay(idx)}
                data-testid={`switch-day-${idx}`}
              />
              <span className="w-8 font-medium text-sm">{day}</span>
              {hasDay && rule && (
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    type="time"
                    value={rule.startTime}
                    onChange={(e) => updateTime(idx, "startTime", e.target.value)}
                    className="h-8 w-28"
                    data-testid={`input-start-${idx}`}
                  />
                  <span className="text-muted-foreground text-sm">to</span>
                  <Input
                    type="time"
                    value={rule.endTime}
                    onChange={(e) => updateTime(idx, "endTime", e.target.value)}
                    className="h-8 w-28"
                    data-testid={`input-end-${idx}`}
                  />
                </div>
              )}
            </div>
          );
        })}
        <Button
          onClick={save}
          disabled={setRules.isPending}
          className="w-full mt-4"
          data-testid="button-save-availability"
        >
          {setRules.isPending ? "Saving..." : "Save Schedule"}
        </Button>
      </CardContent>
    </Card>
  );
}

function StaffTimeOffTab({ businessId, staffId }: { businessId: string; staffId: string }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [reason, setReason] = useState("");

  const { data: timeOffs, isLoading } = useListTimeOff(
    businessId,
    { staffId },
    { query: { enabled: !!businessId && !!staffId } as any }
  );

  const createTimeOff = useCreateTimeOff();
  const deleteTimeOff = useDeleteTimeOff();

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!startsAt || !endsAt) return;
    createTimeOff.mutate(
      {
        businessId,
        data: { staffId, startsAt, endsAt, reason: reason || undefined },
      },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListTimeOffQueryKey(businessId, { staffId }) });
          toast({ title: "Time off added" });
          setStartsAt("");
          setEndsAt("");
          setReason("");
        },
        onError: () => toast({ title: "Failed to add time off", variant: "destructive" }),
      }
    );
  }

  function handleDelete(timeOffId: string) {
    deleteTimeOff.mutate(
      { businessId, timeOffId },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListTimeOffQueryKey(businessId, { staffId }) });
          toast({ title: "Time off removed" });
        },
      }
    );
  }

  const timeOffList = (timeOffs as any[]) ?? [];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add Time Off</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Start</Label>
                <Input
                  type="datetime-local"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                  data-testid="input-starts-at"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">End</Label>
                <Input
                  type="datetime-local"
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                  data-testid="input-ends-at"
                />
              </div>
            </div>
            <Input
              placeholder="Reason (optional)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              data-testid="input-reason"
            />
            <Button
              type="submit"
              disabled={!startsAt || !endsAt || createTimeOff.isPending}
              className="w-full"
              data-testid="button-add-time-off"
            >
              {createTimeOff.isPending ? "Adding..." : "Add Time Off"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Scheduled Time Off</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-2">{[1, 2].map((i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : timeOffList.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No time off scheduled</p>
          ) : (
            <div className="divide-y divide-border">
              {timeOffList.map((t: any) => (
                <div key={t.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">
                      {new Date(t.startsAt).toLocaleDateString()} —{" "}
                      {new Date(t.endsAt).toLocaleDateString()}
                    </p>
                    {t.reason && <p className="text-xs text-muted-foreground">{t.reason}</p>}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(t.id)}
                    data-testid={`button-delete-time-off-${t.id}`}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
