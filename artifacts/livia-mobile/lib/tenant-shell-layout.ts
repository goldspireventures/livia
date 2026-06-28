/** Mobile tenant shell spacing — parity with web app-shell / operational pages. */
export const TENANT_SHELL_LAYOUT = {
  contentPadX: 16,
  contentGap: 12,
  /** Tab bar height + label — use `tabBarScrollPadding()` from `@/lib/mobile-layout`. */
  tabBarClearance: 88,
} as const;

export function tenantScreenBackground(
  isConstellation: boolean,
  background: string,
): string {
  return isConstellation ? "transparent" : background;
}
