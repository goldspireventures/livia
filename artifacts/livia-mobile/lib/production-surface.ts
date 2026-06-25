/** Customer-facing production build — no demo/staging chrome in guest surfaces. */
export function isProductionCustomerSurface(): boolean {
  if (__DEV__) return false;
  return process.env.EXPO_PUBLIC_DEMO_LOGIN !== "true";
}
