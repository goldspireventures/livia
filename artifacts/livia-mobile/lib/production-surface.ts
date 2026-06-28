/**
 * Production mobile app — live customer surface.
 * Demo/dev chrome only when `EXPO_PUBLIC_DEMO_LOGIN=true` (see `.env.example`).
 */
export function isProductionMobileApp(): boolean {
  return process.env.EXPO_PUBLIC_DEMO_LOGIN !== "true";
}

export function isDemoMobileSurface(): boolean {
  return process.env.EXPO_PUBLIC_DEMO_LOGIN === "true";
}

/** Guest hub + public flows — hide demo OTP shortcuts in production. */
export function isProductionCustomerSurface(): boolean {
  return isProductionMobileApp();
}
