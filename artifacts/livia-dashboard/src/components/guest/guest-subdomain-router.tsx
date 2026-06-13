import { Switch, Route } from "wouter";
import PublicBookingPage from "@/pages/public-booking";
import PublicVisitPage from "@/pages/public-visit";
import PublicProofPage from "@/pages/public-proof";
import PublicIntakePage from "@/pages/public-intake";
import PublicWaitlistPage from "@/pages/public-waitlist";
import PublicPayPage from "@/pages/public-pay";
import PublicEventVendorQuotePage from "@/pages/public-event-vendor-quote";
import { guestBookSlugFromWindow } from "@/lib/guest-host-routing";

/** When hostname is `{slug}.livia-hq.com`, render book surfaces without `/book` prefix. */
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
      <Route path="/shop/:token" component={PublicBookingPage} />
      <Route path="/visit/:token" component={PublicVisitPage} />
      <Route component={PublicBookingPage} />
    </Switch>
  );
}

export function isGuestSubdomainHost(): boolean {
  return guestBookSlugFromWindow() != null;
}
