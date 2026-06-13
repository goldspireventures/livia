import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useBusiness } from "@/lib/business-context";
import { apiFetch, ApiFetchError } from "@/lib/api-fetch";
import { OperationalPageShell } from "@/components/layout/operational-page-shell";
import { SettingsDisclosure } from "@/components/ui/settings-disclosure";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { WELLNESS_REPORT_LABELS, listReportsForAudience } from "@workspace/policy";
import { WellnessEodCard } from "@/components/wellness/wellness-eod-card";
import { ChevronRight } from "lucide-react";

type ReportsBundle = {
  roomHeatmap: Array<{
    roomId: string;
    roomName: string;
    hours: Array<{ hour: number; state: string; count: number }>;
  }>;
  salesByService: Array<{ serviceName: string; bookings: number; totalMinutes: number }>;
  packageWaterfall: {
    sold: number;
    redeemed: number;
    remaining: number;
    expiring30d: number;
  };
  tomorrowStress: { score: number; pendingBookings: number; roomConflicts: number; expiringVouchers: number };
  livInterventions: { confirmed: number; pending: number; cancelled: number; note: string };
  retention?: { uniqueGuests90d: number; active30d: number; active60d: number };
  noShowLate?: { noShows: number; latePending: number };
  marketingBySource?: Array<{ source: string; count: number }>;
  guestJourney?: { booked: number; confirmed: number; completed: number; cancelled: number; pending: number };
  depositEscrow?: { heldMinor: number; capturedMinor: number };
  breakageTasks?: Array<{ ledgerId: string; packageName: string; creditsRemaining: number; expiresAt: string }>;
};

function Metric({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-lg border bg-card/60 px-3 py-2.5 min-w-0">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground truncate">{label}</p>
      <p className="text-xl font-serif tabular-nums mt-0.5">{value}</p>
      {hint ? <p className="text-[10px] text-muted-foreground mt-1 leading-snug">{hint}</p> : null}
    </div>
  );
}

export default function WellnessReportsPage() {
  const { business } = useBusiness();
  const bid = business?.id ?? "";
  const [data, setData] = useState<ReportsBundle | null>(null);
  const [digest, setDigest] = useState<{ title: string; lines: string[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!bid) return;
    setLoading(true);
    setLoadError(null);
    void apiFetch<ReportsBundle>(`/api/businesses/${bid}/wellness/reports`)
      .then((reports) => {
        setData(reports);
        return apiFetch<{ title: string; lines: string[] }>(
          `/api/businesses/${bid}/wellness/digest/owner_morning`,
        ).then(setDigest);
      })
      .catch((err: unknown) => {
        setData(null);
        setDigest(null);
        if (err instanceof ApiFetchError && err.status === 404) {
          setLoadError("Restart API on port 3000, then refresh.");
          return;
        }
        setLoadError(err instanceof ApiFetchError ? err.message : "Could not load reports.");
      })
      .finally(() => setLoading(false));
  }, [bid]);

  const digests = listReportsForAudience("OWN");

  return (
    <OperationalPageShell
      title="Reports"
      subtitle="Weekly pulse and detailed reports"
      width="full"
      data-testid="wellness-reports-page"
      actions={
        <Link href="/wellness-chain" className="text-xs text-primary">
          Multi-site HQ →
        </Link>
      }
    >
      {loading ? (
        <Skeleton className="h-24 w-full" />
      ) : !data ? (
        <p className="text-sm text-muted-foreground" data-testid="wellness-reports-error">
          {loadError ?? "Could not load reports."}
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3" data-testid="wellness-reports-pulse">
            <Metric
              label={WELLNESS_REPORT_LABELS.tomorrow_stress.title}
              value={`${data.tomorrowStress.score}/100`}
              hint={`${data.tomorrowStress.pendingBookings} pending · ${data.tomorrowStress.roomConflicts} overlaps`}
            />
            <Metric label="Pack remaining" value={data.packageWaterfall.remaining} hint="Unredeemed credits" />
            <Metric label="Expiring 30d" value={data.packageWaterfall.expiring30d} hint="Breakage risk" />
            <Metric
              label="Liv rhythm"
              value={`${data.livInterventions.confirmed}✓`}
              hint={`${data.livInterventions.pending} pending`}
            />
          </div>

          {digest ? (
            <Card className="bg-muted/20" data-testid="wellness-morning-digest">
              <CardContent className="py-3 px-4">
                <p className="text-xs font-medium text-foreground">{digest.title}</p>
                <ul className="text-xs text-muted-foreground mt-1 space-y-0.5 line-clamp-3">
                  {digest.lines.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}

          <WellnessEodCard />

          {data.breakageTasks && data.breakageTasks.length > 0 ? (
            <Card data-testid="wellness-breakage-tasks" className="border-amber-500/30">
              <CardHeader className="py-3 pb-1">
                <CardTitle className="text-sm">Action · expiring packages</CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                <ul className="text-xs space-y-1.5">
                  {data.breakageTasks.slice(0, 5).map((t) => (
                    <li key={t.ledgerId} className="flex justify-between gap-2">
                      <span className="truncate">{t.packageName}</span>
                      <span className="text-muted-foreground shrink-0 tabular-nums">
                        {t.creditsRemaining} left · {new Date(t.expiresAt).toLocaleDateString()}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link href="/day-packages" className="text-xs text-primary inline-block mt-2">
                  Package ledger →
                </Link>
              </CardContent>
            </Card>
          ) : null}

          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground border-y py-2">
            <span className="text-foreground/80 font-medium">Also:</span>
            <Link href="/wellness-guest-vault" className="text-primary">
              Vault
            </Link>
            <Link href="/wellness-audit-diary" className="text-primary">
              Diary
            </Link>
            <Link href="/corporate-wellness" className="text-primary">
              Corporate
            </Link>
            <Link href="/wellness-chain" className="text-primary">
              Multi-site
            </Link>
          </div>

          <SettingsDisclosure
            title={WELLNESS_REPORT_LABELS.package_waterfall.title}
            description="Sold · redeemed · remaining liability"
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-sm pt-2">
              {(
                [
                  ["Sold", data.packageWaterfall.sold],
                  ["Redeemed", data.packageWaterfall.redeemed],
                  ["Remaining", data.packageWaterfall.remaining],
                  ["Expiring", data.packageWaterfall.expiring30d],
                ] as const
              ).map(([label, val]) => (
                <div key={label}>
                  <p className="text-lg font-semibold tabular-nums">{val}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          </SettingsDisclosure>

          <SettingsDisclosure title={WELLNESS_REPORT_LABELS.room_heatmap.title} description="This week by hour">
            <div className="space-y-3 pt-2 overflow-x-auto">
              {data.roomHeatmap.map((room) => (
                <div key={room.roomId}>
                  <p className="text-xs font-medium mb-1">{room.roomName}</p>
                  <div className="flex gap-0.5 min-w-max">
                    {room.hours.map((h) => (
                      <div
                        key={h.hour}
                        title={`${h.hour}:00 — ${h.state}`}
                        className={`h-6 w-4 rounded-sm ${h.state === "booked" ? "bg-primary/70" : "bg-muted"}`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </SettingsDisclosure>

          <SettingsDisclosure title={WELLNESS_REPORT_LABELS.sales_by_service.title}>
            <ul className="text-sm space-y-1.5 pt-2">
              {data.salesByService.map((s) => (
                <li key={s.serviceName} className="flex justify-between gap-4">
                  <span>{s.serviceName}</span>
                  <span className="text-muted-foreground tabular-nums text-xs">
                    {s.bookings} · {s.totalMinutes}m
                  </span>
                </li>
              ))}
            </ul>
          </SettingsDisclosure>

          {(data.retention || data.guestJourney) && (
            <SettingsDisclosure title="Guests & retention" description="Journey funnel and return rates">
              <div className="pt-2 space-y-3 text-sm">
                {data.retention ? (
                  <div className="flex flex-wrap gap-4 text-xs">
                    <span>90d guests: {data.retention.uniqueGuests90d}</span>
                    <span>Active 30d: {data.retention.active30d}</span>
                    <span>Active 60d: {data.retention.active60d}</span>
                  </div>
                ) : null}
                {data.guestJourney ? (
                  <div className="flex flex-wrap gap-2 text-xs">
                    {(
                      [
                        ["Booked", data.guestJourney.booked],
                        ["Confirmed", data.guestJourney.confirmed],
                        ["Completed", data.guestJourney.completed],
                        ["Pending", data.guestJourney.pending],
                        ["Cancelled", data.guestJourney.cancelled],
                      ] as const
                    ).map(([label, val]) => (
                      <span key={label} className="rounded border px-2 py-0.5 tabular-nums">
                        {label} {val}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </SettingsDisclosure>
          )}

          <SettingsDisclosure title="Ops detail" description="Liv, sources, deposits, no-shows">
            <div className="pt-2 space-y-3 text-xs text-muted-foreground">
              <p>
                Liv: {data.livInterventions.confirmed} confirmed · {data.livInterventions.pending} pending ·{" "}
                {data.livInterventions.note}
              </p>
              {data.marketingBySource?.length ? (
                <ul className="space-y-1">
                  {data.marketingBySource.map((s) => (
                    <li key={s.source} className="flex justify-between max-w-xs">
                      <span>{s.source}</span>
                      <span>{s.count}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
              {data.noShowLate ? (
                <p>
                  {data.noShowLate.noShows} no-shows · {data.noShowLate.latePending} late pending
                </p>
              ) : null}
              {data.depositEscrow ? (
                <p>
                  Escrow held €{(data.depositEscrow.heldMinor / 100).toFixed(2)} · captured €
                  {(data.depositEscrow.capturedMinor / 100).toFixed(2)}
                </p>
              ) : null}
            </div>
          </SettingsDisclosure>

          <SettingsDisclosure title="Persona digests" description="Scheduled email digests">
            <ul className="text-xs space-y-1.5 pt-2 text-muted-foreground">
              {digests.map((d) => (
                <li key={d.slug} className="flex justify-between gap-4">
                  <span>{d.title}</span>
                  <span>{d.scheduleHint}</span>
                </li>
              ))}
            </ul>
          </SettingsDisclosure>
        </>
      )}

      <Link href="/dashboard" className="text-sm text-primary inline-flex items-center gap-1">
        Back to Today <ChevronRight className="h-3 w-3" />
      </Link>
    </OperationalPageShell>
  );
}
