export type ChainPulseStatus = "ok" | "watch" | "act";

export type ChainShopRollup = {
  businessId: string;
  name: string;
  slug: string;
  planId: string | null;
  tier: string;
  city: string | null;
  bookingsThisWeek: number;
  completedThisWeek: number;
  todayBookings: number;
  pendingBookings: number;
  openConversations: number;
  handedOffConversations: number;
  pendingTimeOff: number;
  pulseStatus: ChainPulseStatus;
  pulseReason: string | null;
  revenue30dMinor?: number;
  fillRatePercent?: number | null;
  noShowRate30dPercent?: number | null;
};

export type ChainAlert = {
  businessId: string;
  shopName: string;
  severity: Exclude<ChainPulseStatus, "ok">;
  code: "handed_off" | "time_off" | "inbox" | "pending_bookings";
  message: string;
};

export function buildChainAlerts(shops: ChainShopRollup[]): ChainAlert[] {
  const alerts: ChainAlert[] = [];
  for (const shop of shops) {
    if (shop.pulseStatus === "ok" || !shop.pulseReason) continue;
    let code: ChainAlert["code"] = "inbox";
    if (shop.handedOffConversations > 0) code = "handed_off";
    else if (shop.pendingTimeOff > 2) code = "time_off";
    else if (shop.pendingBookings > 5) code = "pending_bookings";
    alerts.push({
      businessId: shop.businessId,
      shopName: shop.name,
      severity: shop.pulseStatus,
      code,
      message: shop.pulseReason,
    });
  }
  const rank = (s: ChainAlert["severity"]) => (s === "act" ? 0 : 1);
  return alerts.sort((a, b) => rank(a.severity) - rank(b.severity));
}
