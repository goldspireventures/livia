export type ChainPulseStatus = "ok" | "watch" | "act";

export type ChainShopRollup = {
  businessId: string;
  name: string;
  slug: string;
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
  severity: "watch" | "act";
  code: string;
  message: string;
};

export type ChainShopCommerceSlice = {
  businessId: string;
  shopName: string;
  capturedLabel: string;
  captureRatePercent: number | null;
  topSignal: {
    id: string;
    severity: "act" | "watch" | "info";
    title: string;
    href: string;
  } | null;
};

export type ChainRollup = {
  shopCount: number;
  bookingsThisWeek: number;
  completedThisWeek: number;
  shopsNeedingAttention: number;
  orgAdminBriefingLine: string;
  alerts?: ChainAlert[];
  commerceAlerts?: Array<{
    businessId: string;
    shopName: string;
    severity: "act" | "watch";
    code: string;
    message: string;
    href: string;
  }>;
  commerceSummary?: {
    totalCapturedMinor30d: number;
    shopsWithActSignal: number;
    shopsWithWatchSignal: number;
  };
  commerceByShop?: ChainShopCommerceSlice[];
  shops: ChainShopRollup[];
};

export type ChainPeriod = "week" | "today";
