import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useBusiness } from "@/lib/business-context";
import { apiFetch, ApiFetchError } from "@/lib/api-fetch";
import { OperationalPageShell } from "@/components/layout/operational-page-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ScanLine, ShoppingBag, Tv } from "lucide-react";
import { WELLNESS_ROOM_TURNOVER_MINUTES } from "@workspace/policy";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { parseUserFacingError } from "@/lib/user-facing-errors";

type RedeemLookup = {
  ledgerId: string;
  packageName: string;
  creditsRemaining: number;
  customerId: string;
};

export default function WellnessReceptionPage() {
  const { business } = useBusiness();
  const { toast } = useToast();
  const bid = business?.id ?? "";
  const [code, setCode] = useState("");
  const [lookup, setLookup] = useState<RedeemLookup | null>(null);
  const [busy, setBusy] = useState(false);
  const [walkIn, setWalkIn] = useState<string | null>(null);
  const [runSheet, setRunSheet] = useState<Array<{ guest: string; time: string; room: string }>>([]);
  const [serviceId, setServiceId] = useState("");
  const [services, setServices] = useState<Array<{ id: string; name: string }>>([]);
  const [dutyRoom, setDutyRoom] = useState("Garden");
  const [dutyHour, setDutyHour] = useState("14");
  const [dutyResult, setDutyResult] = useState<string | null>(null);

  useEffect(() => {
    if (!bid) return;
    void apiFetch<{ rows: Array<{ guest: string; time: string; room: string }> }>(
      `/api/businesses/${bid}/wellness/run-sheet`,
    ).then((r) => setRunSheet(r.rows));
    void apiFetch<Array<{ id: string; name: string; isActive?: boolean }>>(
      `/businesses/${bid}/services`,
    )
      .then((rows) =>
        setServices(rows.filter((s) => s.isActive !== false).map((s) => ({ id: s.id, name: s.name }))),
      )
      .catch(() => setServices([]));
  }, [bid]);

  async function proposeWalkIn() {
    if (!bid || !serviceId) return;
    setBusy(true);
    try {
      const r = await apiFetch<{ ok: boolean; message: string; startAt?: string }>(
        `/api/businesses/${bid}/wellness/walk-in`,
        { method: "POST", body: JSON.stringify({ serviceId }) },
      );
      setWalkIn(r.message);
    } catch (err) {
      setWalkIn(parseUserFacingError(err, "No slot available right now — try another treatment or time."));
    } finally {
      setBusy(false);
    }
  }

  function printRunSheet() {
    window.print();
  }

  async function runDutySolver() {
    if (!bid) return;
    setBusy(true);
    try {
      const r = await apiFetch<{ message: string; matches: Array<{ displayName: string }> }>(
        `/api/businesses/${bid}/wellness/duty-solver`,
        {
          method: "POST",
          body: JSON.stringify({
            resourceName: dutyRoom,
            hour: Number(dutyHour),
            therapistGender: "any",
          }),
        },
      );
      const names = r.matches.map((m) => m.displayName).join(", ") || "none";
      setDutyResult(`${r.message} — ${names}`);
    } catch (err: unknown) {
      if (err instanceof ApiFetchError && err.status === 404) {
        setDutyResult("This tool is not available yet — contact support if you need duty scheduling.");
      } else if (err instanceof ApiFetchError) {
        setDutyResult(parseUserFacingError(err, "Could not run duty solver. Try again."));
      } else {
        setDutyResult("Could not run duty solver. Try again.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function scanCode() {
    if (!bid || !code.trim()) return;
    setBusy(true);
    try {
      const row = await apiFetch<RedeemLookup>(`/api/businesses/${bid}/wellness/redeem-code`, {
        method: "POST",
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
      });
      setLookup(row);
    } catch {
      setLookup(null);
      toast({ title: "Code not found", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  async function burnSession() {
    if (!bid || !lookup) return;
    setBusy(true);
    try {
      await apiFetch(`/api/businesses/${bid}/wellness/redeem-code/burn`, {
        method: "POST",
        body: JSON.stringify({ ledgerId: lookup.ledgerId }),
      });
      toast({ title: "One session redeemed" });
      setLookup({
        ...lookup,
        creditsRemaining: Math.max(0, lookup.creditsRemaining - 1),
      });
    } catch {
      toast({ title: "Could not redeem", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <OperationalPageShell
      title="Reception"
      subtitle="Check-in desk — voucher scan, walk-ins, and today's run sheet"
      width="full"
      data-testid="wellness-reception-page"
      actions={
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline" className="h-8 text-xs">
            <Link href="/bookings">Room board</Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="h-8 text-xs">
            <Link href="/wellness-tv">TV mode</Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="h-8 text-xs gap-1">
            <Link href="/store">
              <ShoppingBag className="h-3.5 w-3.5" aria-hidden />
              Retail
            </Link>
          </Button>
        </div>
      }
    >
      <div className="wellness-reception-desk grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="space-y-6">
          <Card className="border-primary/20 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <ScanLine className="h-4 w-4 text-primary" />
                Voucher scan
              </CardTitle>
              <CardDescription>Gift or pack code from My Livia or a printed gift card</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
                <div className="space-y-2 flex-1">
                  <Label htmlFor="voucher-code">Code</Label>
                  <Input
                    id="voucher-code"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="8-character code"
                    className="font-mono uppercase"
                    data-testid="reception-voucher-input"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void scanCode();
                    }}
                  />
                </div>
                <Button
                  className="sm:mb-0 sm:shrink-0"
                  onClick={() => void scanCode()}
                  disabled={busy || !code.trim()}
                >
                  Look up
                </Button>
              </div>
              {lookup ? (
                <div className="rounded-lg border bg-muted/30 p-3 text-sm space-y-2" data-testid="reception-voucher-result">
                  <p className="font-medium">{lookup.packageName}</p>
                  <p className="text-muted-foreground">
                    {lookup.creditsRemaining} session{lookup.creditsRemaining === 1 ? "" : "s"} left
                  </p>
                  <Button size="sm" onClick={() => void burnSession()} disabled={busy}>
                    Redeem one session
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <div className="grid gap-6 sm:grid-cols-2">
            <Card data-testid="reception-walk-in">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Walk-in auction</CardTitle>
                <CardDescription>Next slot respecting {WELLNESS_ROOM_TURNOVER_MINUTES}m turnover</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {services.length > 0 ? (
                  <Select value={serviceId} onValueChange={setServiceId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a treatment" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Add treatments in Services first — then propose a walk-in slot here.
                  </p>
                )}
                <Button
                  onClick={() => void proposeWalkIn()}
                  disabled={!serviceId || busy || services.length === 0}
                  className="w-full sm:w-auto"
                >
                  Propose slot
                </Button>
                {walkIn ? <p className="text-sm text-muted-foreground">{walkIn}</p> : null}
              </CardContent>
            </Card>

            <Card data-testid="reception-duty-solver">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Duty solver</CardTitle>
                <CardDescription>Who is free in a room at a given hour</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Input value={dutyRoom} onChange={(e) => setDutyRoom(e.target.value)} placeholder="Room" />
                  <Input value={dutyHour} onChange={(e) => setDutyHour(e.target.value)} placeholder="Hour" />
                </div>
                <Button onClick={() => void runDutySolver()} disabled={busy} className="w-full sm:w-auto">
                  Find therapists
                </Button>
                {dutyResult ? <p className="text-sm text-muted-foreground">{dutyResult}</p> : null}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="print:block">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Run sheet · today</CardTitle>
              <CardDescription>Arrivals and room assignments</CardDescription>
            </CardHeader>
            <CardContent>
              {runSheet.length === 0 ? (
                <p className="text-sm text-muted-foreground">No arrivals loaded yet.</p>
              ) : (
                <ul className="text-sm divide-y">
                  {runSheet.map((r) => (
                    <li key={r.time + r.guest} className="flex justify-between gap-3 py-2 first:pt-0">
                      <span className="font-medium truncate">{r.guest}</span>
                      <span className="text-muted-foreground shrink-0">{r.room}</span>
                    </li>
                  ))}
                </ul>
              )}
              <Button size="sm" variant="outline" className="mt-3 w-full sm:w-auto" onClick={printRunSheet}>
                Print run sheet
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Tv className="h-4 w-4" />
                Turnover
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-3">
              <p>
                Rooms need {WELLNESS_ROOM_TURNOVER_MINUTES} minutes between sessions. Conflicts show on the room board
                as amber gaps.
              </p>
              <Button asChild size="sm" variant="secondary" className="w-full sm:w-auto">
                <Link href="/bookings">Open room board</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </OperationalPageShell>
  );
}
