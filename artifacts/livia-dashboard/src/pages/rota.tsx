import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useBusiness } from "@/lib/business-context";
import { useMembership } from "@/lib/membership-context";
import { useToast } from "@/hooks/use-toast";
import { customFetch } from "@workspace/api-client-react";
import { useListStaff } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { OperationalPageShell } from "@/components/layout/operational-page-shell";
import { useBeautyChrome } from "@/lib/presentation-layout";
import { ROTA_OPERATOR_COPY } from "@workspace/policy";
import { beautyOutlineButton, beautyPanel, beautyPrimaryButton } from "@/lib/beauty-operational-ui";
import { cn } from "@/lib/utils";
import { TimeOffRequestsPanel, type TimeOffRequestRow } from "@/components/staff/time-off-requests-panel";
import { SettingsDisclosure } from "@/components/ui/settings-disclosure";
import { Clock, Trash2, CalendarRange } from "lucide-react";

type Shift = {
  id: string;
  staffId: string;
  startsAt: string;
  endsAt: string;
  label?: string | null;
};

type ShiftTemplate = {
  id: string;
  name: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  label?: string | null;
  minStaff?: number;
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function RotaPage() {
  const { business } = useBusiness();
  const { toast } = useToast();
  const { effectiveRole } = useMembership();
  const bid = business?.id ?? "";
  const canApproveLeave = effectiveRole === "OWNER" || effectiveRole === "ADMIN";
  const canManageShifts = canApproveLeave;
  const beautyChrome = useBeautyChrome((business as { vertical?: string } | null)?.vertical);
  const rotaCopy = ROTA_OPERATOR_COPY;

  const [shifts, setShifts] = useState<Shift[]>([]);
  const [templates, setTemplates] = useState<ShiftTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [staffId, setStaffId] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [tplName, setTplName] = useState("");
  const [tplDay, setTplDay] = useState("1");
  const [tplStart, setTplStart] = useState("09:00");
  const [tplEnd, setTplEnd] = useState("17:00");
  const [materializing, setMaterializing] = useState(false);
  const [leaveRequests, setLeaveRequests] = useState<TimeOffRequestRow[]>([]);
  const pendingLeaveCount = leaveRequests.filter((r) => r.status === "PENDING").length;

  const { data: staff } = useListStaff(bid, {}, { query: { enabled: !!bid } as never });

  async function load() {
    if (!bid) return;
    setLoading(true);
    try {
      const [rows, tplRes] = await Promise.all([
        customFetch<Shift[]>(`/api/businesses/${bid}/staff-shifts`),
        customFetch<{ templates: ShiftTemplate[] }>(
          `/api/businesses/${bid}/shift-templates`,
        ).catch(() => ({ templates: [] })),
      ]);
      setShifts(rows);
      setTemplates(tplRes.templates ?? []);
    } catch {
      setShifts([]);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [bid]);

  async function addShift() {
    if (!bid || !staffId || !startsAt || !endsAt) {
      toast({ title: "Staff and times required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await customFetch(`/api/businesses/${bid}/staff-shifts`, {
        method: "POST",
        body: JSON.stringify({ staffId, startsAt, endsAt, label: label || undefined }),
      });
      toast({ title: "Shift added" });
      setStartsAt("");
      setEndsAt("");
      setLabel("");
      void load();
    } catch {
      toast({ title: "Could not add shift", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function addTemplate() {
    if (!bid || !tplName.trim()) {
      toast({ title: "Template name required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await customFetch(`/api/businesses/${bid}/shift-templates`, {
        method: "POST",
        body: JSON.stringify({
          name: tplName.trim(),
          dayOfWeek: Number(tplDay),
          startTime: tplStart,
          endTime: tplEnd,
        }),
      });
      toast({ title: "Template saved" });
      setTplName("");
      void load();
    } catch {
      toast({ title: "Could not save template", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function publishWeekFromTemplates() {
    if (!bid) return;
    setMaterializing(true);
    try {
      const res = await customFetch<{ created: number }>(
        `/api/businesses/${bid}/shift-templates/materialize`,
        { method: "POST", body: JSON.stringify({ weekStart: new Date().toISOString() }) },
      );
      toast({ title: rotaCopy.publishWeekToast(res.created) });
      void load();
    } catch {
      toast({ title: rotaCopy.publishWeekError, variant: "destructive" });
    } finally {
      setMaterializing(false);
    }
  }

  async function removeShift(shiftId: string) {
    if (!bid) return;
    try {
      await customFetch(`/api/businesses/${bid}/staff-shifts/${shiftId}`, { method: "DELETE" });
      void load();
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  }

  const staffById = new Map(
    (staff ?? []).map((s: { id: string; displayName: string }) => [s.id, s.displayName]),
  );

  return (
    <OperationalPageShell title="Team rota" subtitle={rotaCopy.pageSubtitle} width="md">
      {canApproveLeave && pendingLeaveCount > 0 ? (
        <Card className={beautyPanel(beautyChrome)}>
          <CardHeader>
            <CardTitle className="text-base">Leave approvals ({pendingLeaveCount} pending)</CardTitle>
          </CardHeader>
          <CardContent>
            <TimeOffRequestsPanel
              businessId={bid}
              showApprovals
              compact
              onLoaded={setLeaveRequests}
            />
            <p className="text-xs text-muted-foreground mt-3">
              Team members submit leave from{" "}
              <Link href="/my-day" className="text-primary underline-offset-2 hover:underline">
                My chair
              </Link>{" "}
              or their staff profile → Leave tab.
            </p>
          </CardContent>
        </Card>
      ) : canApproveLeave ? (
        <TimeOffRequestsPanel businessId={bid} showApprovals compact onLoaded={setLeaveRequests} />
      ) : (
        <p className="text-sm text-muted-foreground rounded-lg border border-border p-3">
          Request your own leave from{" "}
          <Link href="/my-day" className="text-primary underline-offset-2 hover:underline">
            My chair
          </Link>{" "}
          — managers approve here when you have admin access.
        </p>
      )}

      {canManageShifts ? (
        <>
          <SettingsDisclosure
            title="Shift templates"
            description={rotaCopy.templatesSectionDescription}
            defaultOpen={pendingLeaveCount === 0}
          >
          <Card className={cn("border-0 shadow-none", beautyPanel(beautyChrome))}>
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-base flex items-center gap-2 sr-only">
                <CalendarRange className="h-4 w-4" />
                Shift templates
              </CardTitle>
              <CardDescription className="sr-only">
                {rotaCopy.templatesSectionDescription}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-2 sm:col-span-2">
                  <Label>Template name</Label>
                  <Input
                    placeholder="Weekday floor"
                    value={tplName}
                    onChange={(e) => setTplName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Day</Label>
                  <Select value={tplDay} onValueChange={setTplDay}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS.map((d, i) => (
                        <SelectItem key={d} value={String(i)}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Start / end (HH:mm)</Label>
                  <div className="flex gap-2">
                    <Input type="time" value={tplStart} onChange={(e) => setTplStart(e.target.value)} />
                    <Input type="time" value={tplEnd} onChange={(e) => setTplEnd(e.target.value)} />
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => void addTemplate()}
                  disabled={saving}
                  className={beautyPrimaryButton(beautyChrome)}
                >
                  Save template
                </Button>
                <Button
                  variant="secondary"
                  className={beautyOutlineButton(beautyChrome)}
                  onClick={() => void publishWeekFromTemplates()}
                  disabled={materializing || templates.length === 0}
                >
                  {materializing ? rotaCopy.publishingWeekCta : rotaCopy.publishWeekCta}
                </Button>
              </div>
              {templates.length > 0 ? (
                <ul className="text-sm divide-y rounded-md border">
                  {templates.map((t) => (
                    <li key={t.id} className="px-3 py-2 flex justify-between gap-2">
                      <span className="font-medium">{t.name}</span>
                      <span className="text-muted-foreground text-xs">
                        {DAYS[t.dayOfWeek]} {t.startTime}–{t.endTime}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">No templates yet — add one for your usual week.</p>
              )}
            </CardContent>
          </Card>
          </SettingsDisclosure>

          <SettingsDisclosure
            title="Published shifts"
            description="One-off shifts and this week's schedule."
            defaultOpen
          >
          <div className="space-y-4">
          <Card className={cn("border-0 shadow-none", beautyPanel(beautyChrome))}>
            <CardHeader className="px-0 pt-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Add shift
              </CardTitle>
            </CardHeader>
            <CardContent className="livia-form-stack space-y-4">
              <div className="space-y-2">
                <Label>Team member</Label>
                <Select value={staffId} onValueChange={setStaffId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                  <SelectContent>
                    {(staff ?? []).map((s: { id: string; displayName: string }) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Starts</Label>
                  <Input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Ends</Label>
                  <Input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Label (optional)</Label>
                <Input placeholder="Late shift" value={label} onChange={(e) => setLabel(e.target.value)} />
              </div>
              <Button
                onClick={() => void addShift()}
                disabled={saving}
                className={beautyPrimaryButton(beautyChrome)}
              >
                {saving ? "Saving…" : "Add shift"}
              </Button>
            </CardContent>
          </Card>

          <SettingsDisclosure
            title="Scheduled shifts"
            description="Shift history — expand when you need to review or remove entries."
            defaultOpen={false}
          >
            <Card className="border-0 shadow-none">
              <CardContent className="p-0">
                {loading ? (
                  <Skeleton className="h-32 m-4" />
                ) : shifts.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-6 text-center">
                    {rotaCopy.noShiftsEmpty}
                  </p>
                ) : (
                  <div className="divide-y max-h-[min(50vh,420px)] overflow-y-auto overscroll-contain">
                    {shifts.map((sh) => (
                      <div key={sh.id} className="flex items-center justify-between px-4 py-3 gap-3">
                        <div>
                          <p className="font-medium text-sm">{staffById.get(sh.staffId) ?? sh.staffId}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(sh.startsAt).toLocaleString()} → {new Date(sh.endsAt).toLocaleString()}
                            {sh.label ? ` · ${sh.label}` : ""}
                          </p>
                        </div>
                        <Button variant="ghost" size="icon" aria-label="Remove shift" onClick={() => void removeShift(sh.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </SettingsDisclosure>
          </div>
          </SettingsDisclosure>
        </>
      ) : null}
    </OperationalPageShell>
  );
}
