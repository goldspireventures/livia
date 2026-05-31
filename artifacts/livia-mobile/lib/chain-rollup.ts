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
};

export type ChainAlert = {
  businessId: string;
  shopName: string;
  severity: "watch" | "act";
  code: string;
  message: string;
};

export type ChainRollup = {
  shopCount: number;
  bookingsThisWeek: number;
  completedThisWeek: number;
  shopsNeedingAttention: number;
  orgAdminBriefingLine: string;
  alerts?: ChainAlert[];
  shops: ChainShopRollup[];
};
