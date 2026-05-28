import { useEffect, useMemo, useState } from "react";
import { useBusiness } from "@/lib/business-context";
import { useToast } from "@/hooks/use-toast";
import { customFetch } from "@workspace/api-client-react";
import { useListStaff, useListCustomers } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { PersonaRitualHeader } from "@/components/ritual/persona-ritual-header";
import { Dumbbell, UserCheck } from "lucide-react";

type ClassSession = {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
  status: string;
};

type Enrollment = {
  id: string;
  customerId: string;
  status: string;
  waitlistPosition?: number | null;
  checkedInAt?: string | null;
};

type Roster = {
  session: ClassSession;
  enrollments: Enrollment[];
};

export default function ClassesPage() {
  const { business } = useBusiness();
  const { toast } = useToast();
  const bid = business?.id ?? "";
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [roster, setRoster] = useState<Roster | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [capacity, setCapacity] = useState("10");
  const [enrollCustomerId, setEnrollCustomerId] = useState("");
  const [staffId, setStaffId] = useState("");

  const { data: staff } = useListStaff(bid, {}, { query: { enabled: !!bid } as never });
  const { data: customersRaw } = useListCustomers(bid, {}, { query: { enabled: !!bid } as never });

  const customers = useMemo(() => {
    const raw = customersRaw as { data?: { id: string; firstName: string; lastName?: string }[] } | { id: string; firstName: string; lastName?: string }[] | undefined;
    if (Array.isArray(raw)) return raw;
    return raw?.data ?? [];
  }, [customersRaw]);

  async function loadSessions() {
    if (!bid) return;
    setLoading(true);
    try {
      const rows = await customFetch<ClassSession[]>(`/api/businesses/${bid}/class-sessions`);
      setSessions(rows);
      if (rows[0] && !selectedId) setSelectedId(rows[0].id);
    } catch {
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadRoster(sessionId: string) {
    try {
      setRoster(await customFetch<Roster>(`/api/businesses/${bid}/class-sessions/${sessionId}/roster`));
    } catch {
      setRoster(null);
    }
  }

  useEffect(() => {
    void loadSessions();
  }, [bid]);

  useEffect(() => {
    if (selectedId && bid) void loadRoster(selectedId);
  }, [selectedId, bid]);

  async function createSession() {
    if (!bid || !title.trim() || !startsAt || !endsAt) return;
    try {
      await customFetch(`/api/businesses/${bid}/class-sessions`, {
        method: "POST",
        body: JSON.stringify({
          title,
          startsAt: new Date(startsAt).toISOString(),
          endsAt: new Date(endsAt).toISOString(),
          capacity: parseInt(capacity, 10) || 10,
          staffId: staffId || undefined,
        }),
      });
      toast({ title: "Class scheduled" });
      setTitle("");
      await loadSessions();
    } catch {
      toast({ title: "Could not create class", variant: "destructive" });
    }
  }

  async function enroll() {
    if (!bid || !selectedId || !enrollCustomerId) return;
    try {
      await customFetch(`/api/businesses/${bid}/class-sessions/${selectedId}/enroll`, {
        method: "POST",
        body: JSON.stringify({ customerId: enrollCustomerId }),
      });
      toast({ title: "Enrolled" });
      void loadRoster(selectedId);
    } catch {
      toast({ title: "Class full or failed", variant: "destructive" });
    }
  }

  const customerName = new Map(
    customers.map((c) => [c.id, `${c.firstName} ${c.lastName ?? ""}`.trim()]),
  );

  const enrolled = roster?.enrollments.filter((e) => e.status === "enrolled").length ?? 0;
  const cap = roster?.session.capacity ?? 0;

  return (
    <div className="space-y-6 max-w-4xl" data-testid="classes-page">
      <PersonaRitualHeader
        variant="page"
        title="Classes"
        subtitle="Capacity, waitlist, and roster check-in — one calendar with your 1:1 appointments."
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Dumbbell className="h-4 w-4" />
            Schedule a class
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Morning flow" />
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
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Capacity</Label>
              <Input type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Coach (optional)</Label>
              <Select value={staffId} onValueChange={setStaffId}>
                <SelectTrigger>
                  <SelectValue placeholder="Any" />
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
          </div>
          <Button onClick={() => void createSession()}>Add class</Button>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upcoming</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <Skeleton className="h-32 m-4" />
            ) : sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground p-6">No classes yet.</p>
            ) : (
              <div className="divide-y">
                {sessions.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedId(s.id)}
                    className={`w-full text-left px-4 py-3 hover:bg-muted/50 ${
                      selectedId === s.id ? "bg-primary/5" : ""
                    }`}
                  >
                    <p className="font-medium text-sm">{s.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(s.startsAt).toLocaleString()} · cap {s.capacity}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Roster {roster ? `(${enrolled}/${cap})` : ""}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!selectedId ? (
              <p className="text-sm text-muted-foreground">Select a class.</p>
            ) : !roster ? (
              <Skeleton className="h-24" />
            ) : (
              <>
                <ul className="text-sm space-y-2 divide-y">
                  {roster.enrollments.map((e) => (
                    <li key={e.id} className="py-2 flex justify-between">
                      <span>{customerName.get(e.customerId) ?? e.customerId}</span>
                      <span className="text-muted-foreground text-xs">
                        {e.status}
                        {e.waitlistPosition ? ` #${e.waitlistPosition}` : ""}
                      </span>
                    </li>
                  ))}
                  {roster.enrollments.length === 0 ? (
                    <li className="text-muted-foreground py-2">No enrollments yet.</li>
                  ) : null}
                </ul>
                <div className="space-y-2 pt-2 border-t">
                  <Label>Enroll client</Label>
                  <Select value={enrollCustomerId} onValueChange={setEnrollCustomerId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.firstName} {c.lastName ?? ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={() => void enroll()}>
                    Add to class
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
