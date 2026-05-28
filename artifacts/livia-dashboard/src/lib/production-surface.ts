import { isDemoLoginEnabled } from "./persona";

/** Customer-facing production build (App Store / app.livia.io) — no QA/demo surfaces. */
export const isProductionCustomerSurface =
  import.meta.env.PROD && !isDemoLoginEnabled;
