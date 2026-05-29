import { isDemoLoginEnabled } from "./persona";

/** Customer-facing production build (App Store / app.livia-hq.com) — no QA/demo surfaces. */
export const isProductionCustomerSurface =
  import.meta.env.PROD && !isDemoLoginEnabled;
