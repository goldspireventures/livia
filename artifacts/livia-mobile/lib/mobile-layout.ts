/**
 * Mobile layout contract — phone proportions, touch targets, gateway + tenant spacing.
 * Authority: docs/design/UI-UX-MASTER-PROGRAM.md · ADR 0008 mobile materiality.
 */
import { useWindowDimensions } from "react-native";
import { TENANT_SHELL_LAYOUT } from "@/lib/tenant-shell-layout";

/** Apple HIG minimum touch target. */
export const MIN_TOUCH = 44;

/** Pre-auth gateway (cold open, sign-in, demo G1). */
export const GATEWAY_LAYOUT = {
  padX: 20,
  cardMaxWidth: 400,
  cardGap: 14,
  sectionGap: 24,
  contentBottomPad: 24,
  authCardPad: 20,
  headerPadY: 12,
} as const;

export function isCompactPhone(width: number): boolean {
  return width < 380;
}

export function isShortPhone(height: number): boolean {
  return height < 700;
}

export function gatewayHeroTitleSize(width: number): number {
  return isCompactPhone(width) ? 26 : 30;
}

export function gatewayDisplayTitleSize(width: number): number {
  return isCompactPhone(width) ? 24 : 28;
}

export function gatewayAuthTitleSize(width: number): number {
  return isCompactPhone(width) ? 22 : 24;
}

export function g1HeroTitleSize(width: number): number {
  return isCompactPhone(width) ? 32 : 38;
}

/** Scroll content padding above absolute tab bar + home indicator. */
export function tabBarScrollPadding(bottomInset: number, extra = 16): number {
  return TENANT_SHELL_LAYOUT.tabBarClearance + bottomInset + extra;
}

export function usePhoneLayout() {
  const { width, height } = useWindowDimensions();
  const compact = isCompactPhone(width);
  const short = isShortPhone(height);
  return {
    width,
    height,
    compact,
    short,
    gatewayHeroTitle: gatewayHeroTitleSize(width),
    gatewayDisplayTitle: gatewayDisplayTitleSize(width),
    gatewayAuthTitle: gatewayAuthTitleSize(width),
    g1HeroTitle: g1HeroTitleSize(width),
    padX: GATEWAY_LAYOUT.padX,
    cardMaxWidth: Math.min(GATEWAY_LAYOUT.cardMaxWidth, width - GATEWAY_LAYOUT.padX * 2),
  };
}
