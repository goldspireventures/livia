/** Local dev defaults — override in `.env` for deploy. */
export const dashboardDemoUrl =
  (import.meta.env.VITE_DASHBOARD_DEMO_URL as string | undefined)?.replace(/\/+$/, "") ??
  "http://127.0.0.1:5173/demo";

export const dashboardSignInUrl =
  (import.meta.env.VITE_DASHBOARD_SIGN_IN_URL as string | undefined)?.replace(/\/+$/, "") ??
  "http://127.0.0.1:5173/sign-in";

export const apiBaseUrl =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/+$/, "") ??
  "http://127.0.0.1:3001";

/** Production legal pages — local marketing shows draft notice until Gate 3. */
export const legalBase =
  (import.meta.env.VITE_LEGAL_BASE_URL as string | undefined)?.replace(/\/+$/, "") ??
  "https://livia.io/legal";
