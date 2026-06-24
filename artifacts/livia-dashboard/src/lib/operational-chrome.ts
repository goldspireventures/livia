import { useBeautyChrome, useWellnessChrome, isConstellationPresentation } from "@/lib/presentation-layout";
import {
  beautyListScroll,
  beautyOutlineButton,
  beautyPanel,
  beautyPrimaryButton,
  beautyRow,
} from "@/lib/beauty-operational-ui";
import {
  wellnessAvatarRing,
  wellnessBookingStatusClass,
  wellnessListPanel,
  wellnessListScroll,
  wellnessOutlineButton,
  wellnessPrimaryButton,
  wellnessRow,
} from "@/lib/wellness-operational-ui";
import { cn } from "@/lib/utils";
import { bookingsListScrollViewportClass } from "@/lib/bookings-list-layout";

/** Beauty, wellness native, or Platform Default constellation — company-wide presentation. */
export function useOperationalChrome(vertical?: string | null) {
  const beauty = useBeautyChrome(vertical);
  const wellness = useWellnessChrome(vertical);
  const constellation = !beauty && !wellness && isConstellationPresentation();
  return {
    beauty,
    wellness,
    constellation,
    native: beauty || wellness || constellation,
    panel: (extra?: string) =>
      cn(
        beautyPanel(beauty, extra),
        wellnessListPanel(wellness, extra),
        constellation && cn("constellation-list-panel platform-default-liv-glass border-border/80", extra),
      ),
    primaryButton: (extra?: string) =>
      cn(
        beautyPrimaryButton(beauty, extra),
        wellnessPrimaryButton(wellness, extra),
        constellation && cn("constellation-primary-btn", extra),
      ),
    outlineButton: (extra?: string) =>
      cn(
        beautyOutlineButton(beauty, extra),
        wellnessOutlineButton(wellness, extra),
        constellation && cn("border-border/80 bg-background/50 hover:bg-muted/40", extra),
      ),
    listScroll: (extra?: string) =>
      cn(
        beauty ? beautyListScroll(extra) : "",
        wellness ? wellnessListScroll(extra) : "",
        constellation && cn("divide-y divide-border/60", bookingsListScrollViewportClass, extra),
        !beauty && !wellness && !constellation && "divide-y divide-border/70 overscroll-contain",
      ),
    row: (attention?: boolean, extra?: string) =>
      cn(
        beautyRow(beauty, attention, extra),
        wellnessRow(wellness, attention, extra),
        constellation &&
          cn(
            "flex items-center gap-2.5 px-3 py-2 transition-colors cursor-pointer",
            "border-border/60 hover:bg-muted/30",
            attention && "bg-primary/5 border-l-2 border-l-primary",
            extra,
          ),
      ),
    avatarRing: (extra?: string) =>
      cn(
        "flex h-10 w-10 items-center justify-center rounded-full font-semibold text-sm shrink-0",
        wellness ? wellnessAvatarRing(true, extra) : "bg-primary/10 text-primary",
        constellation && "constellation-avatar-ring",
        extra,
      ),
    bookingStatus: (status: string, fallback: string) =>
      wellnessBookingStatusClass(wellness, status, fallback),
    /** Staff my-day hero / card surfaces */
    staffHero: (extra?: string) =>
      cn(
        beauty &&
          "border-primary/25 bg-gradient-to-br from-primary/10 via-card to-primary/5 shadow-sm",
        constellation &&
          "constellation-my-day-hero border-[rgba(217,195,154,0.22)] bg-gradient-to-br from-primary/12 via-card/90 to-background/80",
        extra,
      ),
    staffEmptyChair: (extra?: string) =>
      cn(
        beauty && "border-dashed border-primary/25 bg-muted/20",
        constellation &&
          "constellation-my-day-empty border-dashed border-[rgba(217,195,154,0.28)] bg-card/40",
        extra,
      ),
  };
}
