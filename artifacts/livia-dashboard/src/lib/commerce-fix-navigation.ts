type NavigateFn = (to: string, options?: { replace?: boolean }) => void;

export const SETTINGS_URL_SYNC_EVENT = "livia:settings-url-sync";

function notifySettingsUrlSync(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(SETTINGS_URL_SYNC_EVENT));
}

/** Navigate to a settings href, then scroll once the target tab content mounts. */
export function navigateSettingsHref(href: string, navigate: NavigateFn): void {
  if (typeof window === "undefined") return;
  const hash = parseSettingsHref(href).hash;
  navigate(href);
  notifySettingsUrlSync();
  window.setTimeout(() => scrollToSettingsAnchor(href), hash === "channels-setup" ? 350 : 220);
}

/** Scroll to a settings anchor and open any parent disclosure. */
export function scrollToSettingsAnchor(href: string): void {
  if (typeof window === "undefined") return;
  const url = new URL(href, window.location.origin);
  const hash = url.hash.replace("#", "") || "commerce-fix";
  const el = document.getElementById(hash);
  if (!el) return;

  let node: HTMLElement | null = el;
  while (node) {
    if (node instanceof HTMLDetailsElement && !node.open) {
      node.open = true;
    }
    node = node.parentElement;
  }

  el.scrollIntoView({ behavior: "smooth", block: "start" });
  el.classList.add("ring-2", "ring-amber-500/60", "ring-offset-2", "ring-offset-background");
  window.setTimeout(() => {
    el.classList.remove("ring-2", "ring-amber-500/60", "ring-offset-2", "ring-offset-background");
  }, 2200);
}

export function parseSettingsHref(href: string): { tab: string | null; hash: string | null } {
  try {
    const url = new URL(href, "http://local");
    const tab = url.searchParams.get("tab");
    const hash = url.hash ? url.hash.replace("#", "") : null;
    return { tab, hash };
  } catch {
    return { tab: null, hash: null };
  }
}

/** True when href targets the current settings tab (Fix would be a no-op as a plain Link). */
export function isSameSettingsTabHref(href: string): boolean {
  if (typeof window === "undefined") return false;
  if (!window.location.pathname.endsWith("/settings")) return false;
  const { tab } = parseSettingsHref(href);
  const resolvedCurrent =
    new URLSearchParams(window.location.search).get("tab") ?? "shop";
  return tab === resolvedCurrent || (tab === null && resolvedCurrent === "shop");
}
