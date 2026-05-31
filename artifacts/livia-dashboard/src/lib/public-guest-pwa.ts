import { useEffect } from "react";

/** PUBLIC-B-SURFACE-SPEC §15 — scoped `/b/{slug}` manifest (R2 prep). */
export const publicGuestPwaEnabled =
  import.meta.env.VITE_PUBLIC_PWA_ENABLED === "true";

export function usePublicGuestPwa(slug: string | undefined) {
  useEffect(() => {
    if (!publicGuestPwaEnabled || !slug) return;

    let link = document.querySelector(
      'link[rel="manifest"][data-public-guest="true"]',
    ) as HTMLLinkElement | null;

    if (!link) {
      link = document.createElement("link");
      link.rel = "manifest";
      link.setAttribute("data-public-guest", "true");
      document.head.appendChild(link);
    }

    link.href = `/api/public/b/${encodeURIComponent(slug)}/manifest.webmanifest`;

    return () => {
      link?.remove();
    };
  }, [slug]);
}
