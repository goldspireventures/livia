import React, { useEffect, useState } from "react";
import { Link } from "wouter";
import { usePathId } from "@/lib/detail-route-params";
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
  getListStaffQueryKey,
} from "@workspace/api-client-react";
import { TimeOffRequestsPanel } from "@/components/staff/time-off-requests-panel";
import { verticalPackUi } from "@/lib/vertical-pack-ui";
import { useMembership } from "@/lib/membership-context";
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
import { ArrowLeft } from "lucide-react";
import { EntityDetailStates } from "@/components/entity-detail-states";
import { OperationalPageShell } from "@/components/layout/operational-page-shell";
import { invalidateOperationalState } from "@/lib/operational-cache";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function StaffDetailPage() {
  const staffId = usePathId("staff");
  const { business, isLoading: businessLoading } = useBusiness();
  const { toast } = useToast();
  const qc = useQueryClient();

  const bid = business?.id ?? "";
  const sid = staffId ?? "";

  const {
    data: member,
    isLoading,
    isError,
    refetch,
  } = useGetStaff(bid, sid, { query: { enabled: !!bid && !!sid } as never });

  const hasMember = !!member && typeof member === "object" && "id" in (member as object);

  const updateStaff = useUpdateStaff();
  const { effectiveRole } = useMembership();
  const vocab = verticalPackUi(
    (business as { vertical?: string } | null)?.vertical,
    business?.category,
  );
  const canApproveLeave = effectiveRole === "OWNER" || effectiveRole === "ADMIN";

  function toggleActive() {
    if (!bid || !sid || !member) return;
    updateStaff.mutate(
      { businessId: bid, staffId: sid, data: { isActive: !(member as any).isActive } },
      {
        onSuccess: () => {
          invalidateOperationalState(qc, bid);
          qc.invalidateQueries({ queryKey: getGetStaffQueryKey(bid, sid) });
          qc.invalidateQueries({ queryKey: getListStaffQueryKey(bid) });
          toast({ title: (member as any).isActive ? "Staff deactivated" : "Staff activated" });
        },
      }
    );
  }

  return (
    <EntityDetailStates
      isLoading={businessLoading || !bid || isLoading}
      isError={isError}
      hasData={hasMember}
      backHref="/staff"
      entityLabel="team member"
      businessName={business?.name}
      onRetry={() => void refetch()}
    >
      <OperationalPageShell
        title={(member as { displayName?: string })?.displayName ?? "Team member"}
        subtitle={`Profile, ${vocab.serviceNoun.toLowerCase()}s, hours, and leave requests`}
        width="lg"
        actions={
          <Link href="/staff">
            <Button variant="outline" size="sm" data-testid="button-back">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
        }
      >
        <div className="space-y-6">
          {hasMember && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Status</p>
                    <p
                      className={`font-medium ${
                        (member as any).isActive ? "text-[hsl(var(--chart-3))]" : "text-muted-foreground"
                      }`}
                    >
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

          <Tabs defaultValue="profile">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="services">{vocab.serviceNoun}s</TabsTrigger>
          <TabsTrigger value="availability">Hours</TabsTrigger>
          <TabsTrigger value="time-off">Leave</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4">
          <StaffProfileTab businessId={bid} staffId={sid} member={member} />
        </TabsContent>

        <TabsContent value="services" className="mt-4">
          <StaffServicesTab businessId={bid} staffId={sid} />
        </TabsContent>

        <TabsContent value="availability" className="mt-4">
          <StaffAvailabilityTab businessId={bid} staffId={sid} />
        </TabsContent>

        <TabsContent value="time-off" className="mt-4">
          <TimeOffRequestsPanel
            businessId={bid}
            staffId={sid}
            staffDisplayName={(member as { displayName?: string })?.displayName}
            showApprovals={canApproveLeave}
            compact
          />
        </TabsContent>
          </Tabs>
        </div>
      </OperationalPageShell>
    </EntityDetailStates>
  );
}

function StaffProfileTab({
  businessId,
  staffId,
  member,
}: {
  businessId: string;
  staffId: string;
  member: unknown;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const updateStaff = useUpdateStaff();
  const m = member as {
    firstName?: string;
    lastName?: string;
    displayName?: string;
    email?: string;
    phone?: string;
    color?: string;
  } | null;

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [color, setColor] = useState("#22d3ee");

  React.useEffect(() => {
    if (!m) return;
    setFirstName(m.firstName ?? "");
    setLastName(m.lastName ?? "");
    setDisplayName(m.displayName ?? "");
    setEmail(m.email ?? "");
    setColor(m.color ?? "#22d3ee");
  }, [m?.displayName, m?.firstName, m?.lastName, m?.email, m?.color]);

  function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!displayName.trim()) {
      toast({ title: "Display name is required", variant: "destructive" });
      return;
    }
    updateStaff.mutate(
      {
        businessId,
        staffId,
        data: {
          firstName: firstName.trim() || undefined,
          lastName: lastName.trim() || undefined,
          displayName: displayName.trim(),
          email: email.trim() || undefined,
          color: color || undefined,
        },
      },
      {
        onSuccess: () => {
          invalidateOperationalState(qc, businessId);
          qc.invalidateQueries({ queryKey: getGetStaffQueryKey(businessId, staffId) });
          qc.invalidateQueries({ queryKey: getListStaffQueryKey(businessId) });
          toast({ title: "Profile saved" });
        },
        onError: () => toast({ title: "Could not save profile", variant: "destructive" }),
      },
    );
  }

  if (!m) return <Skeleton className="h-48" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Team member</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={saveProfile} className="space-y-4">
          <div className="space-y-2">
            <Label>Display name *</Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              data-testid="input-display-name"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>First name</Label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Last name</Label>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Calendar colour</Label>
            <div className="flex items-center gap-3">
              <Input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 w-16 p-1"
              />
              <span className="text-sm text-muted-foreground">Shown on My Day and bookings</span>
            </div>
          </div>
          <Button type="submit" disabled={updateStaff.isPending} data-testid="button-save-staff-profile">
            {updateStaff.isPending ? "Saving…" : "Save profile"}
          </Button>
        </form>
      </CardContent>
    </Card>
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
          invalidateOperationalState(qc, businessId);
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

  useEffect(() => {
    if (!rules || initialized) return;
    const map = new Map<number, { startTime: string; endTime: string }>();
    (rules as { dayOfWeek: number; startTime: string; endTime: string }[]).forEach((r) =>
      map.set(r.dayOfWeek, { startTime: r.startTime, endTime: r.endTime }),
    );
    setLocalRules(map);
    setInitialized(true);
  }, [rules, initialized]);

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
          invalidateOperationalState(qc, businessId);
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

