import { useEffect, useState } from "react";
import { applyVerticalTheme } from "@/lib/vertical-theme";
import { applyExperienceTheme, clearExperienceTheme } from "@/lib/experience-theme";

export type EventVendorSitePayload = {
  business: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    coverImageUrl: string | null;
    vertical: string;
    currency: string;
    description?: string | null;
    instagramHandle?: string | null;
    city?: string | null;
    email?: string | null;
    phone?: string | null;
  };
  site: {
    heroTitle?: string | null;
    heroSubtitle?: string | null;
    aboutText?: string | null;
    gallery: Array<{ url: string; caption?: string; eventType?: string }>;
    blockedDates?: string[];
  };
  services: Array<{
    id: string;
    name: string;
    description?: string | null;
    category?: string | null;
    priceMinor: number;
    quoteUnit?: string | null;
    imageUrl?: string | null;
  }>;
};

export function useEventVendorSite(slug: string | undefined) {
  const [data, setData] = useState<EventVendorSitePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorKind, setErrorKind] = useState<"not_found" | "unavailable" | null>(null);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErrorKind(null);
      try {
        const r = await fetch(`/api/public/${slug}/event-site`);
        if (r.status === 404) {
          if (!cancelled) {
            setData(null);
            setErrorKind("not_found");
          }
          return;
        }
        if (!r.ok) {
          if (!cancelled) {
            setData(null);
            setErrorKind("unavailable");
          }
          return;
        }
        const d = (await r.json()) as EventVendorSitePayload;
        if (!cancelled) {
          setData(d);
          setErrorKind(null);
          applyVerticalTheme(d.business.vertical, null);
          applyExperienceTheme({ vertical: d.business.vertical });
        }
      } catch {
        if (!cancelled) {
          setData(null);
          setErrorKind("unavailable");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      document.documentElement.removeAttribute("data-vertical");
      clearExperienceTheme();
    };
  }, [slug]);

  return { data, loading, errorKind };
}
