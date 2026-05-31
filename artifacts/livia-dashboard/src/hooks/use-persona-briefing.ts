import { useQuery } from "@tanstack/react-query";
import { useUser } from "@clerk/clerk-react";
import { useBusiness } from "@/lib/business-context";
import { useMembership, personaQuery } from "@/lib/membership-context";
import { usePersona, type PersonaKind } from "@/lib/persona";
import { PERSONA_RITUALS, greetingLine, ownerHomeSubtitle } from "@/lib/persona-rituals";
import { businessVocabulary } from "@workspace/policy";
import { apiFetch } from "@/lib/api-fetch";
import {
  useGetDashboardSummary,
  useListConversations,
  customFetch,
} from "@workspace/api-client-react";

type ChainRollup = {
  shopCount: number;
  bookingsThisWeek: number;
  orgAdminBriefingLine: string;
  shops: Array<{ name: string; bookingsThisWeek: number }>;
};

type LivPresencePayload = {
  context: string;
  line: string;
  source: "liv" | "stats" | "chain" | "ritual";
  pulse?: "info" | "watch" | "act";
  briefing?: {
    briefingDate: string;
    summary: string;
    highlights: string[];
    source: "liv" | "stats_fallback";
    verticalLabel?: string;
  };
};

type MyDayPeek = {
  todayCount: number;
  next: { startAt: string; customer?: { displayName: string | null } | null } | null;
};

/** Fallback when Liv briefing API unavailable — still uses live stats, not static copy. */
function buildLivLineFallback(
  persona: PersonaKind,
  data: {
    chain?: ChainRollup | null;
    summary?: {
      todayBookings?: number;
      pendingBookings?: number;
      pendingCount?: number;
      handedOffCount?: number;
    } | null;
    openConversations?: number;
    myDay?: MyDayPeek | null;
    businessName?: string;
  },
): string {
  const fallback = PERSONA_RITUALS[persona].livFallback;
  const shop = data.businessName ? `${data.businessName}: ` : "";

  if (persona === "org_admin" && data.chain?.orgAdminBriefingLine) {
    return data.chain.orgAdminBriefingLine;
  }

    if ((persona === "owner" || persona === "manager") && data.summary) {
    const today = data.summary.todayBookings ?? 0;
    const pending = data.summary.pendingCount ?? data.summary.pendingBookings ?? 0;
    const handoffs = data.summary.handedOffCount ?? 0;
    const open = data.openConversations ?? 0;
    if (handoffs > 0 && pending > 0) {
      return `${shop}${today} today · ${pending} to confirm · ${handoffs} inbox handoff${handoffs === 1 ? "" : "s"}.`;
    }
    if (handoffs > 0) {
      return `${shop}${handoffs} inbox handoff${handoffs === 1 ? "" : "s"} need${handoffs === 1 ? "s" : ""} you — ${today} on the books today.`;
    }
    if (persona === "manager" && open > 0) {
      return `${shop}${open} conversation${open === 1 ? "" : "s"} need${open === 1 ? "s" : ""} you — ${today} on the books today.`;
    }
    if (pending > 0) {
      return `${shop}${today} today · ${pending} pending confirmation${pending === 1 ? "" : "s"}.`;
    }
    return today > 0
      ? `${shop}${today} appointment${today === 1 ? "" : "s"} today — you're on track.`
      : fallback;
  }

  if (persona === "staff" && data.myDay) {
    if (data.myDay.next) {
      const name = data.myDay.next.customer?.displayName ?? "your next client";
      const mins = Math.max(
        0,
        Math.round((new Date(data.myDay.next.startAt).getTime() - Date.now()) / 60000),
      );
      return mins <= 15
        ? `${name} is due in ${mins} minutes.`
        : `${data.myDay.todayCount} today — next up ${name} in ${mins}m.`;
    }
    if (data.myDay.todayCount === 0) {
      return "Chair's open. Walk-ins can be added from the floor calendar.";
    }
  }

  if (persona === "receptionist") {
    const today = data.summary?.todayBookings ?? 0;
    const open = data.openConversations ?? 0;
    if (open > 0 && today > 0) {
      return `${shop}${today} on the floor · phone's active (${open} thread${open === 1 ? "" : "s"}).`;
    }
    if (today > 0) return `${shop}${today} bookings today — calendar's the source of truth.`;
  }

  return fallback;
}

export function usePersonaBriefing() {
  const { user } = useUser();
  const { kind: persona, isLoading: personaLoading } = usePersona();
  const { business, businesses } = useBusiness();
  const { viewingAsStaffId } = useMembership();
  const bid = business?.id ?? "";
  const firstName = user?.firstName ?? user?.fullName?.split(" ")[0] ?? null;

  const { data: chain } = useQuery({
    queryKey: ["chain-rollup-briefing"],
    queryFn: () => customFetch<ChainRollup>("/api/me/chain-rollup"),
    enabled: persona === "org_admin" && businesses.length >= 2,
    staleTime: 60_000,
  });

  const { data: summary } = useGetDashboardSummary(bid, {
    query: { enabled: !!bid && ["owner", "manager", "receptionist"].includes(persona) } as never,
  });

  const { data: convos } = useListConversations(
    bid,
    { status: "OPEN" },
    { query: { enabled: !!bid && ["owner", "manager", "receptionist"].includes(persona) } as never },
  );

  const { data: myDay } = useQuery({
    queryKey: ["my-day-briefing", bid, viewingAsStaffId],
    queryFn: () =>
      apiFetch<MyDayPeek>(`/businesses/${bid}/my-day${personaQuery(viewingAsStaffId)}`),
    enabled: !!bid && persona === "staff",
    staleTime: 30_000,
  });

  const presenceContext =
    persona === "org_admin"
      ? null
      : persona === "staff"
        ? "staff_today"
        : persona === "receptionist"
          ? "reception_today"
          : persona === "manager"
            ? "manager_today"
            : "owner_today";

  const { data: orgAdminPresence, isLoading: orgAdminPresenceLoading } = useQuery({
    queryKey: ["liv-presence-org-admin"],
    queryFn: () => apiFetch<LivPresencePayload>("/me/liv-presence"),
    enabled: persona === "org_admin",
    staleTime: 90_000,
  });

  const { data: tenantPresence, isLoading: tenantPresenceLoading } = useQuery({
    queryKey: ["liv-presence", bid, presenceContext, viewingAsStaffId],
    queryFn: () =>
      apiFetch<LivPresencePayload>(
        `/businesses/${bid}/liv-presence?context=${presenceContext}${persona === "staff" && viewingAsStaffId ? `&staffId=${viewingAsStaffId}` : ""}`,
      ),
    enabled: !!bid && !!presenceContext,
    staleTime: 90_000,
  });

  const openCount = Array.isArray(convos) ? convos.length : 0;

  const livLine =
    (persona === "org_admin" ? orgAdminPresence?.line : tenantPresence?.line) ??
    buildLivLineFallback(persona, {
      chain: chain ?? null,
      summary: summary as {
        todayBookings?: number;
        pendingBookings?: number;
        pendingCount?: number;
        handedOffCount?: number;
      } | undefined,
      openConversations: openCount,
      myDay: myDay ?? null,
      businessName: business?.name,
    });

  const ritual = PERSONA_RITUALS[persona];
  const biz = business as { vertical?: string; category?: string } | null;
  const vocab = businessVocabulary(biz?.vertical, biz?.category);

  const briefingSummary =
    persona === "org_admin"
      ? orgAdminPresence?.briefing?.summary
      : tenantPresence?.briefing?.summary;
  const homeSubtitle = (() => {
    const summary = briefingSummary?.trim();
    if (summary && summary !== livLine.trim()) return summary;
    if (persona === "owner") return ownerHomeSubtitle(biz?.vertical, biz?.category);
    return ritual.homeSubtitle;
  })();

  return {
    persona,
    ritual,
    firstName,
    greeting: greetingLine(firstName, persona, { locationNoun: vocab.locationNoun }),
    homeSubtitle,
    livLine,
    livSource:
      persona === "org_admin"
        ? (orgAdminPresence?.source === "chain" ? "liv" : orgAdminPresence?.source ?? null)
        : tenantPresence?.briefing?.source ?? tenantPresence?.source ?? null,
    livPulse:
      persona === "org_admin" ? orgAdminPresence?.pulse : tenantPresence?.pulse,
    verticalLabel: vocab.label,
    isLoading:
      personaLoading ||
      (persona === "org_admin" ? orgAdminPresenceLoading : tenantPresenceLoading),
  };
}
