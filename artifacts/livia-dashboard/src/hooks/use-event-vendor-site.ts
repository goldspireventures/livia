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

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const r = await fetch(`/api/public/${slug}/event-site`);
        if (!r.ok) throw new Error("not found");
        const d = (await r.json()) as EventVendorSitePayload;
        if (!cancelled) {
          setData(d);
          applyVerticalTheme(d.business.vertical, null);
          applyExperienceTheme({ vertical: d.business.vertical });
        }
      } catch {
        if (!cancelled) setData(null);
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

  return { data, loading };
}
