import { useEffect, useState } from "react";
import { Switch, Route } from "wouter";
import PublicBookingPage from "@/pages/public-booking";
import PublicVisitPage from "@/pages/public-visit";
import PublicProofPage from "@/pages/public-proof";
import PublicIntakePage from "@/pages/public-intake";
import PublicWaitlistPage from "@/pages/public-waitlist";
import PublicPayPage from "@/pages/public-pay";
import PublicShopPage from "@/pages/public-shop";
import PublicEventVendorSitePage from "@/pages/public-event-vendor-site";
import PublicEventVendorGalleryPage from "@/pages/public-event-vendor-gallery";
import PublicEventVendorServicesPage from "@/pages/public-event-vendor-services";
import PublicEventVendorAboutPage from "@/pages/public-event-vendor-about";
import PublicEventVendorEnquirePage from "@/pages/public-event-vendor-enquire";
import PublicEventVendorQuotePage from "@/pages/public-event-vendor-quote";
import PublicEventVendorMoodPage from "@/pages/public-event-vendor-mood";
import PublicEventVendorPlannerPage from "@/pages/public-event-vendor-planner";
import { PublicSurfaceLoading } from "@/components/public/public-surface-chrome";
import { guestBookSlugFromWindow } from "@/lib/guest-host-routing";

function GuestSubdomainHome() {
  const slug = guestBookSlugFromWindow();
  const [mode, setMode] = useState<"loading" | "event" | "book">("loading");

  useEffect(() => {
    if (!slug) {
      setMode("book");
      return;
    }
    let cancelled = false;
    void fetch(`/api/public/${encodeURIComponent(slug)}/event-site`)
      .then((res) => {
        if (!cancelled) setMode(res.ok ? "event" : "book");
      })
      .catch(() => {
        if (!cancelled) setMode("book");
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (mode === "loading") return <PublicSurfaceLoading />;
  if (mode === "event") return <PublicEventVendorSitePage />;
  return <PublicBookingPage />;
}

/** When hostname is `{slug}.livia-hq.com`, render guest surfaces without `/book` or `/e` prefix. */
export function GuestSubdomainRouter() {
  const slug = guestBookSlugFromWindow();
  if (!slug) return null;

  return (
    <Switch>
      <Route path="/proof/:token" component={PublicProofPage} />
      <Route path="/intake/:token" component={PublicIntakePage} />
      <Route path="/waitlist/:token" component={PublicWaitlistPage} />
      <Route path="/pay/:token" component={PublicPayPage} />
      <Route path="/q/:token" component={PublicEventVendorQuotePage} />
      <Route path="/mood/:token" component={PublicEventVendorMoodPage} />
      <Route path="/planner/:token" component={PublicEventVendorPlannerPage} />
      <Route path="/enquire" component={PublicEventVendorEnquirePage} />
      <Route path="/gallery" component={PublicEventVendorGalleryPage} />
      <Route path="/services" component={PublicEventVendorServicesPage} />
      <Route path="/about" component={PublicEventVendorAboutPage} />
      <Route path="/shop/:token" component={PublicShopPage} />
      <Route path="/visit/:token" component={PublicVisitPage} />
      <Route component={GuestSubdomainHome} />
    </Switch>
  );
}

export function isGuestSubdomainHost(): boolean {
  return guestBookSlugFromWindow() != null;
}
