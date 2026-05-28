import { useEffect, useState } from "react";
import { useRoute, Redirect } from "wouter";
import {
  Sparkles,
  Bot,
  AlertTriangle,
  Bell,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  Coffee,
  Calendar,
  CheckCircle2,
  Circle,
  Smartphone,
  Watch,
  Tv,
  ShieldCheck,
  Headphones,
  Heart,
  MapPin,
  Wallet,
  Zap,
  Send,
  Phone,
  ArrowRight,
  Wand2,
  Sun,
} from "lucide-react";
import {
  ACCENT_CLASSES,
  ORG_ADMIN_SHOPS,
  OWNER_TODAY,
  STAFF_SENIOR_TODAY,
  STAFF_JUNIOR_TODAY,
  getPersona,
  type Persona,
  type PersonaBooking,
  type PersonaShop,
} from "@/lib/demo/personas";
import { ShowcaseFrame } from "./_chrome";
import { useDemo } from "@/lib/demo/demo-context";

// ───────────────────────── shared building blocks ─────────────────────────

function Hero({ persona }: { persona: Persona }) {
  const a = ACCENT_CLASSES[persona.accent];
  return (
    <header className="mb-10">
      <div
        className={`inline-flex items-center gap-2 px-2.5 py-1 mb-5 rounded-full border ${a.border} ${a.bg} text-[10px] uppercase tracking-wider font-mono ${a.text}`}
      >
        <Sparkles className="h-3 w-3" />
        {persona.roleLabel}
      </div>
      <h1
        className="text-4xl md:text-5xl tracking-tight leading-[1.05] mb-2"
        style={{ fontFamily: "var(--app-font-serif)" }}
      >
        {persona.welcomeLine}
      </h1>
      <p
        className="text-2xl md:text-3xl text-white/45 italic leading-snug"
        style={{ fontFamily: "var(--app-font-serif)" }}
      >
        {persona.welcomeSub}
      </p>
      <p className="mt-4 text-sm text-white/50 font-mono">{persona.ritualLine}</p>
    </header>
  );
}

function AlertBanner({ persona }: { persona: Persona }) {
  const a = ACCENT_CLASSES[persona.accent];
  const icon =
    persona.alertKind === "ai" ? <Bot className="h-3.5 w-3.5" /> :
    persona.alertKind === "money" ? <CreditCard className="h-3.5 w-3.5" /> :
    persona.alertKind === "deposit" ? <Wallet className="h-3.5 w-3.5" /> :
    persona.alertKind === "system" ? <AlertTriangle className="h-3.5 w-3.5" /> :
    <Bell className="h-3.5 w-3.5" />;
  const label =
    persona.alertKind === "ai" ? "Liv just acted" :
    persona.alertKind === "money" ? "Money moved" :
    persona.alertKind === "deposit" ? "Deposit collected" :
    persona.alertKind === "system" ? "Heads up" :
    "Incoming";
  return (
    <div
      className={`mb-8 rounded-xl border ${a.border} bg-gradient-to-r ${a.gradFrom} to-transparent p-4 flex items-start gap-3`}
      data-testid="demo-alert"
    >
      <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${a.border} ${a.bg} ${a.text}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className={`text-[10px] uppercase tracking-wider font-mono ${a.text} mb-1`}>{label}</div>
        <p className="text-sm text-white/85 leading-snug">{persona.alertText}</p>
      </div>
      <span className="text-[10px] font-mono text-white/30 shrink-0">just now</span>
    </div>
  );
}

function NativeMomentCard({ persona }: { persona: Persona }) {
  const a = ACCENT_CLASSES[persona.accent];
  const surface =
    persona.nativeMomentKind === "live-activity" ? "Lock Screen · Live Activity" :
    persona.nativeMomentKind === "widget" ? "Home Screen · Widget" :
    persona.nativeMomentKind === "push" ? "Lock Screen · Push" :
    persona.nativeMomentKind === "biometric" ? "Face ID prompt" :
    persona.nativeMomentKind === "haptic" ? "Apple Watch · Tap" :
    "Apple Wallet · Pass";
  const Icon =
    persona.nativeMomentKind === "live-activity" ? Smartphone :
    persona.nativeMomentKind === "widget" ? Smartphone :
    persona.nativeMomentKind === "push" ? Bell :
    persona.nativeMomentKind === "haptic" ? Watch :
    persona.nativeMomentKind === "share" ? Wallet :
    Tv;
  return (
    <section className="mt-10">
      <div className="text-[10px] uppercase tracking-wider font-mono text-white/40 mb-3 flex items-center gap-1.5">
        <Wand2 className="h-3 w-3" />
        Native moment
      </div>
      <div className={`relative rounded-2xl border ${a.border} bg-black/40 backdrop-blur-md p-5 overflow-hidden`}>
        <div className={`absolute -top-12 -right-12 h-32 w-32 rounded-full ${a.bg} blur-2xl`} />
        <div className="relative flex items-start gap-4">
          <div className={`h-10 w-10 rounded-xl border ${a.border} ${a.bg} flex items-center justify-center shrink-0`}>
            <Icon className={`h-5 w-5 ${a.text}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-white/40">{surface}</span>
              <span className={`h-1 w-1 rounded-full ${a.text.replace("text-", "bg-")}`} />
              <span className="text-[10px] font-mono text-white/40">{persona.nativeMomentTitle}</span>
            </div>
            <p className="text-sm text-white/85 leading-snug">{persona.nativeMomentBody}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatusDot({ status }: { status: PersonaBooking["status"] }) {
  const cls =
    status === "COMPLETED" ? "bg-[#10b981]" :
    status === "CONFIRMED" ? "bg-[#06b6d4]" :
    status === "PENDING" ? "bg-[#f59e0b]" :
    "bg-white/20";
  return <span className={`h-1.5 w-1.5 rounded-full ${cls}`} />;
}

// ────────────────────────── per-persona surfaces ──────────────────────────

function OrgAdminSurface({ persona }: { persona: Persona }) {
  const totalToday = ORG_ADMIN_SHOPS.reduce((s, x) => s + x.todayBookings, 0);
  const totalRev = ORG_ADMIN_SHOPS.reduce((s, x) => s + x.todayRevenueEur, 0);
  const totalPending = ORG_ADMIN_SHOPS.reduce((s, x) => s + x.pendingCount, 0);
  return (
    <ShowcaseFrame persona={persona}>
      <Hero persona={persona} />
      <AlertBanner persona={persona} />

      {/* Roll-up KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <KpiTile label="Bookings today" value={totalToday} sub="across 3 shops" />
        <KpiTile label="Revenue" value={`€${totalRev.toLocaleString()}`} sub="today's run-rate" tone="good" />
        <KpiTile label="Awaiting you" value={totalPending} sub="approvals" tone={totalPending > 0 ? "warn" : undefined} />
        <KpiTile label="Avg utilisation" value="72%" sub="healthy band" />
      </div>

      {/* Three-shop glance */}
      <div className="text-[10px] uppercase tracking-wider font-mono text-white/40 mb-3">
        Three rooms · one quiet read
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ORG_ADMIN_SHOPS.map((s) => (
          <ShopGlanceCard key={s.id} shop={s} />
        ))}
      </div>

      <NativeMomentCard persona={persona} />
    </ShowcaseFrame>
  );
}

function ShopGlanceCard({ shop }: { shop: PersonaShop }) {
  const trendIcon =
    shop.trend === "up" ? <TrendingUp className="h-3.5 w-3.5 text-[#34d399]" /> :
    shop.trend === "down" ? <TrendingDown className="h-3.5 w-3.5 text-[#fbbf24]" /> :
    <Minus className="h-3.5 w-3.5 text-white/40" />;
  return (
    <div className="rounded-xl border border-white/10 bg-black/40 p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-sm font-medium">{shop.name.replace("Aoife & Co. — ", "")}</div>
          <div className="text-[10px] font-mono text-white/40">{shop.city}</div>
        </div>
        {trendIcon}
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <div className="text-white/40 text-[10px] font-mono uppercase tracking-wider">Bookings</div>
          <div className="text-base font-medium">{shop.todayBookings}</div>
        </div>
        <div>
          <div className="text-white/40 text-[10px] font-mono uppercase tracking-wider">Revenue</div>
          <div className="text-base font-medium">€{shop.todayRevenueEur}</div>
        </div>
        <div>
          <div className="text-white/40 text-[10px] font-mono uppercase tracking-wider">Util.</div>
          <div className="text-base font-medium">{shop.utilisationPct}%</div>
        </div>
        <div>
          <div className="text-white/40 text-[10px] font-mono uppercase tracking-wider">Pending</div>
          <div className={`text-base font-medium ${shop.pendingCount > 0 ? "text-[#fbbf24]" : "text-white/60"}`}>
            {shop.pendingCount}
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiTile({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string | number;
  sub?: string;
  tone?: "good" | "warn";
}) {
  const valueColor =
    tone === "good" ? "text-[#34d399]" : tone === "warn" ? "text-[#fbbf24]" : "text-white";
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-4">
      <div className="text-[10px] uppercase tracking-wider font-mono text-white/40">{label}</div>
      <div className={`mt-2 text-2xl font-medium tracking-tight ${valueColor}`}>{value}</div>
      {sub ? <div className="mt-1 text-[10px] font-mono text-white/40">{sub}</div> : null}
    </div>
  );
}

function OwnerSurface({ persona }: { persona: Persona }) {
  const completed = OWNER_TODAY.filter((b) => b.status === "COMPLETED").length;
  const pending = OWNER_TODAY.filter((b) => b.status === "PENDING").length;
  return (
    <ShowcaseFrame persona={persona}>
      <Hero persona={persona} />
      <AlertBanner persona={persona} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <KpiTile label="Today" value={OWNER_TODAY.length} sub={`${completed} done`} />
        <KpiTile label="Pending" value={pending} sub="needs action" tone={pending > 0 ? "warn" : undefined} />
        <KpiTile label="Liv replied overnight" value={4} sub="2:14 AM avg" tone="good" />
        <KpiTile label="No-shows saved" value="€340" sub="this week" tone="good" />
      </div>
      <div className="text-[10px] uppercase tracking-wider font-mono text-white/40 mb-3">
        Today's flight plan
      </div>
      <div className="rounded-xl border border-white/10 bg-black/30 divide-y divide-white/5 overflow-hidden">
        {OWNER_TODAY.map((b) => (
          <div key={b.id} className="flex items-center gap-3 px-4 py-2.5">
            <span className="text-[11px] font-mono text-white/50 w-12 shrink-0">{b.time}</span>
            <StatusDot status={b.status} />
            <span className="flex-1 text-sm truncate">{b.customer}</span>
            <span className="text-[11px] text-white/50 truncate hidden sm:inline">{b.service}</span>
            <span className="text-[10px] font-mono text-white/30 ml-3">{b.staff}</span>
          </div>
        ))}
      </div>
      <NativeMomentCard persona={persona} />
    </ShowcaseFrame>
  );
}

function ManagerSurface({ persona }: { persona: Persona }) {
  const approvals = [
    { id: "a1", title: "Tomás wants Tuesday + Friday off next week", kind: "Time-off", urgency: "today" },
    { id: "a2", title: "Maeve raised a customer complaint — needs your read", kind: "Escalation", urgency: "now" },
    { id: "a3", title: "Same-shift exception — Ciarán + Lara both tomorrow 14:00", kind: "Schedule", urgency: "tomorrow" },
  ];
  return (
    <ShowcaseFrame persona={persona}>
      <Hero persona={persona} />
      <AlertBanner persona={persona} />
      <div className="text-[10px] uppercase tracking-wider font-mono text-white/40 mb-3 flex items-center gap-1.5">
        <ShieldCheck className="h-3 w-3" />
        Approvals queue · 3 things
      </div>
      <div className="space-y-3">
        {approvals.map((a, i) => (
          <div key={a.id} className="rounded-xl border border-white/10 bg-black/30 p-4 flex items-start gap-4">
            <div className="h-8 w-8 rounded-full border border-[#8b5cf6]/40 bg-[#8b5cf6]/15 text-[#a78bfa] flex items-center justify-center text-[11px] font-mono shrink-0">
              {i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] uppercase tracking-wider font-mono text-[#a78bfa]">{a.kind}</span>
                <span className="text-[10px] font-mono text-white/30">· due {a.urgency}</span>
              </div>
              <p className="text-sm text-white/85 leading-snug">{a.title}</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button className="px-3 py-1.5 rounded-md text-[11px] font-medium border border-white/10 hover-elevate">
                Defer
              </button>
              <button className="px-3 py-1.5 rounded-md text-[11px] font-medium bg-[#8b5cf6]/30 border border-[#8b5cf6]/50 text-white hover-elevate">
                Approve
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 text-[11px] font-mono text-white/40 italic">
        No money decisions. No customer-facing copy. Just judgement calls Sarah trusts you with.
      </div>
      <NativeMomentCard persona={persona} />
    </ShowcaseFrame>
  );
}

function StaffSeniorSurface({ persona }: { persona: Persona }) {
  const next = STAFF_SENIOR_TODAY.find((b) => b.status === "CONFIRMED") ?? STAFF_SENIOR_TODAY[0];
  const totalTip = STAFF_SENIOR_TODAY.reduce((s, b) => s + (b.tipEur ?? 0), 0);
  return (
    <ShowcaseFrame persona={persona}>
      <Hero persona={persona} />

      {/* Countdown card — the centrepiece */}
      <div className="rounded-2xl border border-[#10b981]/40 bg-gradient-to-br from-[#10b981]/20 to-[#06b6d4]/5 p-6 mb-8 relative overflow-hidden">
        <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-[#10b981]/20 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-mono text-[#34d399] mb-3">
            <Clock className="h-3 w-3" />
            Next chair · in 24 minutes
          </div>
          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-5xl font-medium tracking-tight" style={{ fontFamily: "var(--app-font-serif)" }}>
              {next?.time}
            </span>
            <span className="text-2xl text-white/40 italic" style={{ fontFamily: "var(--app-font-serif)" }}>
              · {next?.customer}
            </span>
          </div>
          <p className="text-sm text-white/70">{next?.service} · {next?.durationMin} min</p>
          <div className="mt-3 inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 border border-white/10 text-[11px] font-mono text-white/60">
            <Heart className="h-3 w-3 text-[#fb7185]" />
            Note: wedding Saturday — be gentle on the ends
          </div>
        </div>
      </div>

      {/* Today's chairs */}
      <div className="text-[10px] uppercase tracking-wider font-mono text-white/40 mb-3">
        Your day · {STAFF_SENIOR_TODAY.length} chairs
      </div>
      <div className="space-y-2 mb-8">
        {STAFF_SENIOR_TODAY.map((b) => (
          <div key={b.id} className="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-white/10 bg-black/30">
            <span className="text-[11px] font-mono text-white/50 w-12">{b.time}</span>
            <StatusDot status={b.status} />
            <div className="flex-1 min-w-0">
              <div className="text-sm">{b.customer}</div>
              <div className="text-[10px] font-mono text-white/40 truncate">{b.service}</div>
            </div>
            {b.tipEur ? (
              <span className="text-[11px] font-mono text-[#34d399]">+€{b.tipEur} tip</span>
            ) : null}
          </div>
        ))}
      </div>

      {/* Tip jar */}
      <div className="rounded-xl border border-[#34d399]/30 bg-[#10b981]/10 p-4 flex items-center gap-3">
        <Coffee className="h-5 w-5 text-[#34d399]" />
        <div className="flex-1">
          <div className="text-sm font-medium">Tip jar today</div>
          <div className="text-[11px] text-white/50">Quiet morning, gentle accumulation.</div>
        </div>
        <span className="text-2xl font-medium text-[#34d399]">€{totalTip}</span>
      </div>

      <NativeMomentCard persona={persona} />
    </ShowcaseFrame>
  );
}

function StaffJuniorSurface({ persona }: { persona: Persona }) {
  return (
    <ShowcaseFrame persona={persona}>
      <Hero persona={persona} />
      <AlertBanner persona={persona} />

      {/* Empty-state hero */}
      <div className="rounded-2xl border border-[#f59e0b]/30 bg-gradient-to-br from-[#f59e0b]/10 to-[#d9c39a]/5 p-8 mb-8 relative overflow-hidden">
        <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-[#f59e0b]/15 blur-3xl" />
        <div className="relative max-w-xl">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-mono text-[#fbbf24] mb-4">
            <Sun className="h-3 w-3" />
            Quiet morning · we have you
          </div>
          <h2 className="text-2xl mb-3" style={{ fontFamily: "var(--app-font-serif)" }}>
            Two booked. Liv is gently surfacing you to anyone within 5 minutes who wants a Tuesday cut.
          </h2>
          <p className="text-sm text-white/65 leading-relaxed mb-5">
            Week three is meant to feel like this. The shop knows you're new — your booking page is set
            to <span className="text-[#fbbf24]">"open to walk-ins"</span>, and Sarah's directing
            messages your way without you having to ask.
          </p>
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#fbbf24]/30 bg-[#f59e0b]/10 text-[11px] font-mono text-[#fbbf24]">
              <MapPin className="h-3 w-3" />
              Walk-in window · open
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-black/30 text-[11px] font-mono text-white/50">
              <Phone className="h-3 w-3" />
              Sarah forwarding 1 enquiry to you
            </div>
          </div>
        </div>
      </div>

      <div className="text-[10px] uppercase tracking-wider font-mono text-white/40 mb-3">
        Your two chairs today
      </div>
      <div className="space-y-2">
        {STAFF_JUNIOR_TODAY.map((b) => (
          <div key={b.id} className="flex items-center gap-3 px-4 py-3 rounded-lg border border-white/10 bg-black/30">
            <span className="text-[11px] font-mono text-white/50 w-12">{b.time}</span>
            <StatusDot status={b.status} />
            <div className="flex-1 min-w-0">
              <div className="text-sm">{b.customer}</div>
              <div className="text-[10px] font-mono text-white/40">{b.service}</div>
            </div>
            {b.tipEur ? <span className="text-[11px] font-mono text-[#34d399]">+€{b.tipEur}</span> : null}
          </div>
        ))}
      </div>

      <NativeMomentCard persona={persona} />
    </ShowcaseFrame>
  );
}

function ReceptionistSurface({ persona }: { persona: Persona }) {
  const staff = ["Lara", "Ciarán", "Maeve", "Tomás"];
  const hours = ["09", "10", "11", "12", "13", "14", "15", "16", "17"];
  // bookings keyed by staff
  const byStaff = new Map<string, PersonaBooking[]>();
  for (const b of OWNER_TODAY) {
    if (!b.staff) continue;
    const arr = byStaff.get(b.staff) ?? [];
    arr.push(b);
    byStaff.set(b.staff, arr);
  }
  return (
    <ShowcaseFrame persona={persona}>
      <Hero persona={persona} />
      <AlertBanner persona={persona} />

      {/* The wall */}
      <div className="text-[10px] uppercase tracking-wider font-mono text-white/40 mb-3 flex items-center gap-1.5">
        <Headphones className="h-3 w-3" />
        The wall · 4 staff · {OWNER_TODAY.length} appointments
      </div>
      <div className="rounded-xl border border-white/10 bg-black/30 overflow-x-auto">
        <table className="w-full min-w-[640px] text-xs">
          <thead>
            <tr className="text-[10px] font-mono text-white/40 border-b border-white/10">
              <th className="text-left px-3 py-2 font-normal w-20">Staff</th>
              {hours.map((h) => (
                <th key={h} className="px-2 py-2 font-normal text-center">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {staff.map((s) => {
              const list = byStaff.get(s) ?? [];
              return (
                <tr key={s} className="border-b border-white/5 last:border-b-0">
                  <td className="px-3 py-3 text-white/80 font-medium">{s}</td>
                  {hours.map((h) => {
                    const hour = parseInt(h, 10);
                    const cell = list.find((b) => parseInt(b.time.slice(0, 2), 10) === hour);
                    if (!cell) {
                      return <td key={h} className="px-1 py-1"><div className="h-7 rounded bg-white/[0.02]" /></td>;
                    }
                    const cls =
                      cell.status === "COMPLETED" ? "bg-[#10b981]/25 border-[#10b981]/40 text-[#34d399]" :
                      cell.status === "CONFIRMED" ? "bg-[#06b6d4]/25 border-[#06b6d4]/40 text-[#22d3ee]" :
                      cell.status === "PENDING" ? "bg-[#f59e0b]/25 border-[#f59e0b]/40 text-[#fbbf24]" :
                      "bg-white/5 border-white/10";
                    return (
                      <td key={h} className="px-1 py-1">
                        <div className={`h-7 rounded border ${cls} px-1.5 flex items-center text-[10px] truncate font-mono`}>
                          {cell.customer.split(" ")[0]}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-xl border border-white/10 bg-black/30 p-4">
          <div className="text-[10px] uppercase tracking-wider font-mono text-white/40 mb-2 flex items-center gap-1.5">
            <Phone className="h-3 w-3" /> Live · 1 caller
          </div>
          <div className="text-sm">Aoibhinn — running 10 min late for 12:00</div>
          <div className="mt-2 flex gap-1.5">
            <button className="px-2.5 py-1 rounded text-[11px] bg-white/5 border border-white/10 hover-elevate">
              Hold
            </button>
            <button className="px-2.5 py-1 rounded text-[11px] bg-[#6366f1]/20 border border-[#6366f1]/40 text-[#818cf8] hover-elevate">
              Push to 12:15
            </button>
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/30 p-4">
          <div className="text-[10px] uppercase tracking-wider font-mono text-white/40 mb-2 flex items-center gap-1.5">
            <CheckCircle2 className="h-3 w-3" /> The desk's quiet trick
          </div>
          <p className="text-sm text-white/70 leading-snug">
            Tablet mode · landscape. Drag a chair to a new staff member. The colour-coded
            grid never lies, and Liv handles the customer-facing message for you.
          </p>
        </div>
      </div>

      <NativeMomentCard persona={persona} />
    </ShowcaseFrame>
  );
}

function CustomerSurface({ persona }: { persona: Persona }) {
  return (
    <ShowcaseFrame persona={persona}>
      <Hero persona={persona} />

      {/* Phone-shaped booking card */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-8 items-start">
        <div>
          <AlertBanner persona={persona} />

          <div className="rounded-2xl border border-[#f43f5e]/30 bg-gradient-to-br from-[#f43f5e]/10 to-[#8b5cf6]/5 p-6 mb-6 relative overflow-hidden">
            <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-[#f43f5e]/15 blur-3xl" />
            <div className="relative">
              <div className="text-[10px] uppercase tracking-wider font-mono text-[#fb7185] mb-3">
                Your appointment · Tomorrow
              </div>
              <div className="flex items-baseline gap-3 mb-1">
                <span className="text-5xl font-medium tracking-tight" style={{ fontFamily: "var(--app-font-serif)" }}>
                  10:30
                </span>
                <span className="text-xl text-white/45 italic" style={{ fontFamily: "var(--app-font-serif)" }}>
                  · 11 May
                </span>
              </div>
              <p className="text-sm text-white/75 mb-4">
                Balayage with Lara · Sarah's Hair Studio · Dublin 6
              </p>
              <div className="flex flex-wrap gap-2">
                <button className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#f43f5e]/30 border border-[#f43f5e]/50 text-white text-xs font-medium hover-elevate">
                  <Wallet className="h-3.5 w-3.5" /> Add to Apple Wallet
                </button>
                <button className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/80 text-xs hover-elevate">
                  <Calendar className="h-3.5 w-3.5" /> Add to Calendar
                </button>
                <button className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/80 text-xs hover-elevate">
                  Reschedule
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/30 p-4 mb-3">
            <div className="text-[10px] uppercase tracking-wider font-mono text-white/40 mb-2">
              The kettle's on at 10:25
            </div>
            <p className="text-sm text-white/75">
              We'll send one reminder the night before, and one on the morning of —
              never more. No pestering, no upsells.
            </p>
          </div>
        </div>

        {/* Mini phone preview */}
        <div className="hidden md:block">
          <div className="text-[10px] uppercase tracking-wider font-mono text-white/40 mb-3">
            On your phone
          </div>
          <div className="rounded-[2rem] border border-white/15 bg-black p-3 shadow-2xl shadow-[#f43f5e]/10">
            <div className="rounded-[1.5rem] bg-gradient-to-b from-[#1a1a22] to-[#09090b] p-4 min-h-[420px] relative overflow-hidden">
              <div className="text-center text-[10px] font-mono text-white/40 mb-3">9:41</div>
              <div className="rounded-xl border border-[#f43f5e]/30 bg-black/60 backdrop-blur p-3 mb-3">
                <div className="flex items-center gap-2 text-[9px] uppercase font-mono text-[#fb7185] mb-1.5">
                  <Heart className="h-2.5 w-2.5" /> Sarah's Hair Studio
                </div>
                <div className="text-[15px] font-medium leading-tight">Tomorrow at 10:30</div>
                <div className="text-[10px] text-white/50 mt-0.5">Lara's chair · Balayage</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3 mb-3">
                <div className="text-[9px] uppercase font-mono text-white/40 mb-1">Wallet pass</div>
                <div className="text-[12px] font-medium">Sarah's Hair Studio</div>
                <div className="text-[10px] text-white/50">Sat 11 May · 10:30</div>
              </div>
              <div className="text-center text-[10px] font-mono text-white/30">
                Two reminders. Then quiet.
              </div>
            </div>
          </div>
        </div>
      </div>

      <NativeMomentCard persona={persona} />
    </ShowcaseFrame>
  );
}

// ──────────────────────────── route component ────────────────────────────

export default function Showcase() {
  const [, params] = useRoute("/demo/:persona");
  const personaId = params?.persona;
  const persona = personaId ? getPersona(personaId) : null;
  const { setPersona } = useDemo();

  useEffect(() => {
    if (persona) setPersona(persona.id);
  }, [persona, setPersona]);

  if (!persona) {
    return <Redirect to="/demo" />;
  }

  switch (persona.id) {
    case "org_admin":    return <OrgAdminSurface persona={persona} />;
    case "owner":        return <OwnerSurface persona={persona} />;
    case "manager":      return <ManagerSurface persona={persona} />;
    case "staff-senior": return <StaffSeniorSurface persona={persona} />;
    case "staff-junior": return <StaffJuniorSurface persona={persona} />;
    case "receptionist": return <ReceptionistSurface persona={persona} />;
    case "customer":     return <CustomerSurface persona={persona} />;
  }
}
