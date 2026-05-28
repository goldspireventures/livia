/** Optional Plausible / PostHog — no-op when unset. */

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Record<string, string> }) => void;
  }
}

export function initMarketingAnalytics() {
  const domain = import.meta.env.VITE_PLAUSIBLE_DOMAIN as string | undefined;
  if (!domain || typeof document === "undefined") return;

  if (document.querySelector('script[data-plausible]')) return;

  const s = document.createElement("script");
  s.defer = true;
  s.dataset.domain = domain;
  s.dataset.plausible = "true";
  s.src = "https://plausible.io/js/script.js";
  document.head.appendChild(s);
}

export function trackEvent(name: string, props?: Record<string, string>) {
  try {
    window.plausible?.(name, props ? { props } : undefined);
  } catch {
    /* ignore */
  }
}
