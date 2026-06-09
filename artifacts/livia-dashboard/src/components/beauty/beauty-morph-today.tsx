import { Link } from "wouter";
import { ArrowRight, Flower2, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PresentationLayoutMorph } from "@workspace/policy";
import { ownerHomeNeedsBriefingAction } from "@workspace/policy";
import type { AtRiskGuestPreview } from "@workspace/policy";
import { MorphOwnerSignalsFooter } from "@/components/dashboard/morph-owner-signals-footer";
import { InboxPreviewPanel } from "@/components/dashboard/inbox-preview-panel";
import {
  BeautyCockpitSchedule,
  BeautyMenuCardSchedule,
  BeautyStationSchedule,
  type BeautyBookingRow,
} from "@/components/beauty/beauty-layout-surfaces";
import type { RoomBoardResource } from "@/components/wellness/wellness-room-board";

export type BeautyMorphTodayProps = {
  morph: PresentationLayoutMorph;
  firstName: string | null | undefined;
  headerDate: string;
  livLine: string;
  oneThingHref: string;
  oneThingLabel: string;
  pendingCount: number;
  handoffCount: number;
  bookings: BeautyBookingRow[];
  businessName?: string;
  todayTotal: number;
  completedToday: number;
  vertical?: string | null;
  previewThreads: Array<{
    id: string;
    customerName: string | null;
    lastMessagePreview?: string | null;
    updatedAt?: string;
    status?: string;
    channel?: string;
  }>;
  convosLoading: boolean;
  bookingResources?: RoomBoardResource[];
  onAssignBookingToResource?: (bookingId: string, resourceId: string | null) => Promise<boolean>;
  assigningBookingId?: string | null;
  atRiskGuests?: AtRiskGuestPreview[];
  recentVisitFeedback?: Array<{
    id: string;
    bookingId: string;
    score: number;
    comment: string | null;
    createdAt: string;
  }>;
  lowFeedbackCount?: number;
  signalsLoading?: boolean;
};

function greeting(firstName: string | null | undefined): string {
  const h = new Date().getHours();
  const prefix = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  return `${prefix}, ${firstName?.trim() || "there"}`;
}

/** Full Today replacement per beauty preset morph — not generic KPI stack + tint. */
export function BeautyMorphTodayHome({
  morph,
  firstName,
  headerDate,
  livLine,
  oneThingHref,
  oneThingLabel,
  pendingCount,
  handoffCount,
  bookings,
  businessName,
  todayTotal,
  completedToday,
  vertical,
  previewThreads,
  convosLoading,
  bookingResources,
  onAssignBookingToResource,
  assigningBookingId,
  atRiskGuests,
  recentVisitFeedback,
  lowFeedbackCount,
  signalsLoading,
}: BeautyMorphTodayProps) {
  const needsAction = ownerHomeNeedsBriefingAction({
    pendingCount,
    handedOffCount: handoffCount,
    atRiskCount: atRiskGuests?.length,
    lowFeedbackCount,
  });
  const signalsFooter = (
    <MorphOwnerSignalsFooter
      atRiskGuests={atRiskGuests}
      recentVisitFeedback={recentVisitFeedback}
      loading={signalsLoading}
    />
  );
  if (morph === "split-inbox") {
    return (
      <div
        className="beauty-morph-today beauty-morph-today--split-inbox w-full min-w-0 max-w-6xl"
        data-testid="beauty-morph-today-split-inbox"
      >
        <header className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between mb-4">
          <div>
            <h1
              className="text-2xl md:text-[28px] font-serif tracking-tight"
              data-testid="owner-dashboard-greeting"
            >
              {greeting(firstName)}
            </h1>
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
              <Inbox className="h-3.5 w-3.5" aria-hidden />
              {businessName ?? "Your studio"} · Inbox-first · DMs before the floor
            </p>
          </div>
          <p className="text-xs text-muted-foreground font-mono tabular-nums shrink-0">{headerDate}</p>
        </header>
        <div
          className="beauty-split-inbox-briefing rounded-xl border border-primary/20 bg-card px-4 py-3 mb-4 flex flex-col sm:flex-row sm:items-center gap-3"
          data-testid="owner-dashboard-briefing"
        >
          <div className="flex gap-2 min-w-0 flex-1">
            <Flower2 className="h-4 w-4 text-primary shrink-0 mt-0.5" aria-hidden />
            <p className="text-sm text-foreground/90 line-clamp-2">{livLine}</p>
          </div>
          {(needsAction) && (
            <Link href={oneThingHref} className="shrink-0">
              <Button size="sm" className="rounded-full gap-1.5 beauty-briefing-cta">
                {oneThingLabel}
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          )}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-4">
          <InboxPreviewPanel
            threads={previewThreads}
            loading={convosLoading}
            attentionCount={handoffCount}
          />
          <section className="beauty-split-inbox-queue rounded-xl border border-border/80 bg-card/80 p-3">
            <h2 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              On the floor today
            </h2>
            <ul className="space-y-2">
              {bookings.slice(0, 5).map((b) => (
                <li key={b.id}>
                  <Link href={`/bookings/${b.id}`} className="block rounded-lg border px-3 py-2 hover:bg-muted/40">
                    <p className="text-xs font-mono text-muted-foreground">
                      {b.startTime ?? b.startAt
                        ? new Date(b.startTime ?? b.startAt!).toLocaleTimeString(undefined, {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </p>
                    <p className="text-sm font-medium truncate">{b.service?.name ?? "Treatment"}</p>
                  </Link>
                </li>
              ))}
              {bookings.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">No appointments yet today.</p>
              ) : null}
            </ul>
            <Link href="/bookings" className="inline-block mt-3 text-xs text-primary hover:underline">
              Full calendar
            </Link>
          </section>
        </div>
        {signalsFooter}
      </div>
    );
  }

  if (morph === "atrium") {
    return (
      <div
        className="beauty-morph-today beauty-morph-today--atrium w-full min-w-0"
        data-testid="beauty-morph-today-atrium"
      >
        <div className="beauty-atrium-hero rounded-2xl border border-primary/15 bg-gradient-to-b from-primary/10 via-card to-background px-5 py-5 md:px-7 md:py-6">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1
                className="text-2xl md:text-3xl font-serif tracking-tight"
                data-testid="owner-dashboard-greeting"
              >
                {greeting(firstName)}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {businessName ?? "Soft studio"} · Stations · {headerDate.split("·").pop()?.trim() ?? "today"}
              </p>
            </div>
            <p className="text-xs font-mono text-muted-foreground shrink-0">{headerDate}</p>
          </div>
          <div
            className="mt-4 rounded-xl border border-primary/20 bg-card px-4 py-3 text-sm"
            data-testid="owner-dashboard-briefing"
          >
            {livLine}
          </div>
        </div>
        <div className="mt-5">
          <BeautyStationSchedule
            bookings={bookings}
            resources={bookingResources}
            onAssignBookingToResource={onAssignBookingToResource}
            assigningBookingId={assigningBookingId}
            hero
          />
        </div>
        <p className="mt-4 text-xs text-muted-foreground flex flex-wrap gap-x-2 gap-y-1">
          <Link href="/bookings" className="text-primary hover:underline">
            Schedule
          </Link>
          <span aria-hidden>·</span>
          <Link href="/services" className="text-primary hover:underline">
            Treatments
          </Link>
          {handoffCount > 0 ? (
            <>
              <span aria-hidden>·</span>
              <Link href="/inbox?lens=taken_over" className="text-primary hover:underline">
                {handoffCount} inbox handoff{handoffCount === 1 ? "" : "s"}
              </Link>
            </>
          ) : null}
        </p>
        {signalsFooter}
      </div>
    );
  }

  if (morph === "menu-card") {
    return (
      <div
        className="beauty-morph-today beauty-morph-today--menu-card max-w-4xl w-full"
        data-testid="beauty-morph-today-menu-card"
      >
        <header className="mb-5 border-b border-border/60 pb-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
            Editorial · menu home
          </p>
          <h1
            className="text-3xl font-serif tracking-tight mt-2"
            data-testid="owner-dashboard-greeting"
          >
            {greeting(firstName)}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{headerDate}</p>
        </header>
        <div
          className="rounded-lg border bg-card px-4 py-3 mb-5 text-sm leading-relaxed"
          data-testid="owner-dashboard-briefing"
        >
          <span className="text-[10px] uppercase tracking-wider text-primary font-semibold">Liv</span>
          <p className="mt-1 text-foreground/90">{livLine}</p>
          {needsAction ? (
            <Link href={oneThingHref} className="inline-block mt-3">
              <Button variant="outline" size="sm" className="rounded-full">
                {oneThingLabel}
              </Button>
            </Link>
          ) : null}
        </div>
        <BeautyMenuCardSchedule bookings={bookings} vertical={vertical} />
        {handoffCount > 0 ? (
          <Link
            href="/inbox?lens=taken_over"
            className="inline-flex items-center gap-1 mt-4 text-sm text-primary hover:underline"
          >
            {handoffCount} conversation{handoffCount === 1 ? "" : "s"} need you
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        ) : null}
        {signalsFooter}
      </div>
    );
  }

  if (morph === "cockpit") {
    return (
      <div
        className="beauty-morph-today beauty-morph-today--cockpit w-full min-w-0"
        data-testid="beauty-morph-today-cockpit"
      >
        <header className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between mb-4">
          <div>
            <h1
              className="text-2xl font-serif tracking-tight"
              data-testid="owner-dashboard-greeting"
            >
              {greeting(firstName)}
            </h1>
            <p className="text-sm text-muted-foreground">Premium cockpit · floor + confirmations</p>
          </div>
          <p className="text-xs font-mono text-muted-foreground">{headerDate}</p>
        </header>
        <div
          className="beauty-cockpit-briefing rounded-lg border border-primary/35 bg-gradient-to-r from-primary/15 to-card px-4 py-3 mb-4 text-sm"
          data-testid="owner-dashboard-briefing"
        >
          <span className="text-[10px] uppercase tracking-wider text-primary font-semibold">Liv · floor</span>
          <p className="mt-1 text-foreground/90">{livLine}</p>
        </div>
        <BeautyCockpitSchedule
          bookings={bookings}
          pendingCount={pendingCount}
          handoffCount={handoffCount}
          todayTotal={todayTotal}
          completedToday={completedToday}
        />
        {needsAction ? (
          <Link href={oneThingHref} className="inline-block mt-4">
            <Button size="sm" className="gap-1.5 rounded-full">
              {oneThingLabel}
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        ) : null}
        {signalsFooter}
      </div>
    );
  }

  return null;
}
