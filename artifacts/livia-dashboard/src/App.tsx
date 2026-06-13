import { Switch, Route, Router as WouterRouter, Redirect, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { SIGN_IN_AFTER_SIGN_OUT } from "@/lib/auth-routes";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { dark } from "@clerk/themes";
import { ThemeProvider, useTheme } from "next-themes";
import { useState, useEffect, type ReactNode } from "react";

import { AuthGuard } from "@/components/auth-guard";
import { AppLayout } from "@/components/layout/app-layout";
import { LazyRoute } from "@/components/route-suspense";
import { WedgeRouteGuard } from "@/components/wedge-route-guard";
import { OperatorWorkforceGuard } from "@/components/operator-workforce-guard";
import {
  LazyAuditPage,
  LazyBookingDetailPage,
  LazyBookingNewPage,
  LazyBookingsPage,
  LazyBrandsPage,
  LazyChainPage,
  LazyClassesPage,
  LazyCustomerDetailPage,
  LazyCustomersPage,
  LazyDayPackagesPage,
  LazyWellnessReportsPage,
  LazyWellnessReceptionPage,
  LazyWellnessChainPage,
  LazyWellnessTvPage,
  LazyWellnessAuditDiaryPage,
  LazyWellnessGuestVaultPage,
  LazyWellnessRetailPage,
  LazyBeautyReceptionPage,
  LazyBeautyTvPage,
  LazyBeautyStorePage,
  LazyStudioSetupPage,
  LazyDesignProofsPage,
  LazyEnquiriesRedirect,
  LazyQuotesPage,
  LazyEventSitePage,
  LazyDemoShowcase,
  LazyExperiencePage,
  LazyFranchisePage,
  LazyGuidesPage,
  LazyHostPage,
  LazyInboxPage,
  LazyLaunchStatusPage,
  LazyLifecyclePage,
  LazyMedspaHubPage,
  LazyMyDayPage,
  LazyPremisesPage,
  LazyRotaPage,
  LazyServicesPage,
  LazySettingsPage,
  LazyStaffDetailPage,
  LazyStaffPage,
  LazyToolkitPage,
} from "@/lib/lazy-pages";

import NotFound from "@/pages/not-found";
import SignInPage from "@/pages/sign-in";
import SignUpPage from "@/pages/sign-up";
import OnboardingPage from "@/pages/onboarding";
import OnboardingPreviewPage from "@/pages/dev/onboarding-preview";
import PlatformSurfacesGalleryPage from "@/pages/dev/platform-surfaces-gallery";
import BrandLogoGalleryPage from "@/pages/dev/brand-logo-gallery";
import LiviaEvolutionGalleryPage from "@/pages/dev/livia-evolution-gallery";
import LegalAcceptancePage from "@/pages/legal-acceptance";
import DashboardPage from "@/pages/dashboard";
import AppearancePreviewPage from "@/pages/appearance-preview";
import PublicBookingPage from "@/pages/public-booking";
import PublicVisitPage from "@/pages/public-visit";
import PublicProofPage from "@/pages/public-proof";
import PublicIntakePage from "@/pages/public-intake";
import PublicWaitlistPage from "@/pages/public-waitlist";
import PublicPayPage from "@/pages/public-pay";
import MyLiviaPage from "@/pages/my-livia";
import MyLiviaShopPage from "@/pages/my-livia-shop";
import MyLiviaVisitPage from "@/pages/my-livia-visit";
import { GuestSubdomainRouter, isGuestSubdomainHost } from "@/components/guest/guest-subdomain-router";
import { LegacyGuestBookRedirect } from "@/components/guest/legacy-guest-book-redirect";
import WellnessCorporatePage from "@/pages/wellness-corporate";
import PublicPremisesPage from "@/pages/public-premises";
import PublicEventVendorSitePage from "@/pages/public-event-vendor-site";
import PublicEventVendorGalleryPage from "@/pages/public-event-vendor-gallery";
import PublicEventVendorServicesPage from "@/pages/public-event-vendor-services";
import PublicEventVendorAboutPage from "@/pages/public-event-vendor-about";
import PublicEventVendorEnquirePage from "@/pages/public-event-vendor-enquire";
import PublicEventVendorQuotePage from "@/pages/public-event-vendor-quote";
import {
  FOUNDER_DEMO_LAUNCHER_PATH,
  marketingDemoGateUrl,
  shouldRedirectAppDemoToMarketing,
} from "@/lib/demo-routes";
import DemoLauncher from "@/pages/demo/Launcher";
import DemoOpenPersonaPage from "@/pages/demo/OpenPersona";
import DemoWedgeStoryPage from "@/pages/demo/WedgeStory";
import { DemoProvider } from "@/lib/demo/demo-context";
import { GatewaySkinHandoffProvider } from "@/components/gateway/gateway-skin-handoff-provider";
import { GatewaySurfaceThemeSync } from "@/components/gateway/gateway-surface-theme-sync";
import { MarketingDemoGateSync } from "@/components/marketing-demo-gate-sync";
import { isProductionCustomerSurface } from "@/lib/production-surface";
import { isOnboardingPreviewRouteEnabled } from "@/lib/onboarding-preview-route";
import { isPublicGuestPath } from "@/lib/public-guest-paths";
import { canonicalizeEventVendorQuotePath } from "@/lib/public-guest-route-params";

/** Render public event-vendor pages before AuthGuard — avoids sign-in redirect on client quote links. */
function publicEventVendorPageFromPathname(pathname: string): ReactNode | null {
  const canonical = canonicalizeEventVendorQuotePath(pathname);
  if (canonical) {
    window.history.replaceState(null, "", canonical);
    return <PublicEventVendorQuotePage />;
  }
  const p = pathname.split("?")[0]?.replace(/\/+$/, "") || "/";
  if (p.match(/^\/e\/[^/]+\/q\/[^/]+$/)) return <PublicEventVendorQuotePage />;
  if (p.match(/^\/e\/[^/]+\/enquire$/)) return <PublicEventVendorEnquirePage />;
  if (p.match(/^\/e\/[^/]+\/gallery$/)) return <PublicEventVendorGalleryPage />;
  if (p.match(/^\/e\/[^/]+\/services$/)) return <PublicEventVendorServicesPage />;
  if (p.match(/^\/e\/[^/]+\/about$/)) return <PublicEventVendorAboutPage />;
  if (p.match(/^\/e\/[^/]+$/)) return <PublicEventVendorSitePage />;
  return null;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key");
}

/**
 * Optional Frontend API proxy (/api/__clerk → Railway).
 * Default off: production uses Clerk CNAME `clerk.livia-hq.com` (Domains → DNS).
 * Only set VITE_CLERK_USE_PROXY=true if you are NOT using the CNAME.
 */
const CLERK_PROXY_URL =
  import.meta.env.VITE_CLERK_USE_PROXY === "true" &&
  import.meta.env.PROD &&
  PUBLISHABLE_KEY.startsWith("pk_live_")
    ? `${window.location.origin}/api/__clerk`
    : undefined;

function AuthenticatedRoutes() {
  const [location] = useLocation();

  // Safety net: guest paths must never enter tenant AuthGuard (avoids sign-in redirect loops on /my).
  if (isPublicGuestPath(location)) {
    const guestPath = location.split("?")[0]?.replace(/\/+$/, "") || "/";
    if (guestPath === "/my") {
      return <MyLiviaPage />;
    }
    if (guestPath.startsWith("/my/")) {
      const visitMatch = location.match(/^\/my\/([^/]+)\/visit\/([^/]+)/);
      const shopMatch = location.match(/^\/my\/([^/]+)\/?$/);
      if (visitMatch) return <MyLiviaVisitPage />;
      if (shopMatch) return <MyLiviaShopPage />;
    }
    if (location.startsWith("/b/") || location.startsWith("/book/")) {
      const visitMatch = location.match(/^\/(?:b|book)\/([^/]+)\/visit\/([^/]+)/);
      const proofMatch = location.match(/^\/(?:b|book)\/([^/]+)\/proof\/([^/]+)/);
      const intakeMatch = location.match(/^\/(?:b|book)\/([^/]+)\/intake\/([^/]+)/);
      const payMatch = location.match(/^\/(?:b|book)\/([^/]+)\/pay\/([^/]+)/);
      const waitlistMatch = location.match(/^\/(?:b|book)\/([^/]+)\/waitlist\/([^/]+)/);
      const bookingOnlyMatch = location.match(/^\/(?:b|book)\/([^/]+)\/?$/);
      if (proofMatch) return <PublicProofPage />;
      if (intakeMatch) return <PublicIntakePage />;
      if (payMatch) return <PublicPayPage />;
      if (waitlistMatch) return <PublicWaitlistPage />;
      if (visitMatch) return <PublicVisitPage />;
      if (bookingOnlyMatch) return <PublicBookingPage />;
    }
    if (location.startsWith("/p/")) return <PublicPremisesPage />;
    if (location.startsWith("/e/")) {
      const quoteCanonical = canonicalizeEventVendorQuotePath(location);
      if (quoteCanonical) return <Redirect to={quoteCanonical} />;
      const quoteMatch = location.match(/^\/e\/([^/]+)\/q\/([^/]+)/);
      const enquireMatch = location.match(/^\/e\/([^/]+)\/enquire\/?$/);
      const galleryMatch = location.match(/^\/e\/([^/]+)\/gallery\/?$/);
      const servicesMatch = location.match(/^\/e\/([^/]+)\/services\/?$/);
      const aboutMatch = location.match(/^\/e\/([^/]+)\/about\/?$/);
      const siteMatch = location.match(/^\/e\/([^/]+)\/?$/);
      if (quoteMatch) return <PublicEventVendorQuotePage />;
      if (enquireMatch) return <PublicEventVendorEnquirePage />;
      if (galleryMatch) return <PublicEventVendorGalleryPage />;
      if (servicesMatch) return <PublicEventVendorServicesPage />;
      if (aboutMatch) return <PublicEventVendorAboutPage />;
      if (siteMatch) return <PublicEventVendorSitePage />;
    }
  }

  return (
    <AuthGuard>
      <AppLayout>
        <Switch>
          <Route path="/dashboard" component={DashboardPage} />
          <Route path="/my-day">{() => <LazyRoute page={LazyMyDayPage} />}</Route>
          <Route path="/bookings/new">{() => <LazyRoute page={LazyBookingNewPage} />}</Route>
          <Route path="/bookings/:bookingId">{() => <LazyRoute page={LazyBookingDetailPage} />}</Route>
          <Route path="/bookings">{() => <LazyRoute page={LazyBookingsPage} />}</Route>
          <Route path="/customers/:customerId">{() => <LazyRoute page={LazyCustomerDetailPage} />}</Route>
          <Route path="/customers">{() => <LazyRoute page={LazyCustomersPage} />}</Route>
          <Route path="/staff/:staffId">
            {() => (
              <OperatorWorkforceGuard>
                <LazyRoute page={LazyStaffDetailPage} />
              </OperatorWorkforceGuard>
            )}
          </Route>
          <Route path="/staff">
            {() => (
              <OperatorWorkforceGuard>
                <LazyRoute page={LazyStaffPage} />
              </OperatorWorkforceGuard>
            )}
          </Route>
          <Route path="/services">{() => <LazyRoute page={LazyServicesPage} />}</Route>
          <Route path="/inbox">{() => <LazyRoute page={LazyInboxPage} />}</Route>
          <Route path="/audit">{() => <LazyRoute page={LazyAuditPage} />}</Route>
          <Route path="/chain">{() => <LazyRoute page={LazyChainPage} />}</Route>
          <Route path="/premises">{() => <LazyRoute page={LazyPremisesPage} />}</Route>
          <Route path="/day-packages">
            {() => (
              <WedgeRouteGuard path="/day-packages">
                <LazyRoute page={LazyDayPackagesPage} />
              </WedgeRouteGuard>
            )}
          </Route>
          <Route path="/wellness-reports">
            {() => <LazyRoute page={LazyWellnessReportsPage} />}
          </Route>
          <Route path="/wellness-reception">
            {() => <LazyRoute page={LazyWellnessReceptionPage} />}
          </Route>
          <Route path="/wellness-chain">
            {() => <LazyRoute page={LazyWellnessChainPage} />}
          </Route>
          <Route path="/wellness-tv">
            {() => <LazyRoute page={LazyWellnessTvPage} />}
          </Route>
          <Route path="/wellness-audit-diary">
            {() => <LazyRoute page={LazyWellnessAuditDiaryPage} />}
          </Route>
          <Route path="/wellness-guest-vault">
            {() => <LazyRoute page={LazyWellnessGuestVaultPage} />}
          </Route>
          <Route path="/wellness-retail">
            {() => <LazyRoute page={LazyWellnessRetailPage} />}
          </Route>
          <Route path="/beauty-reception">
            {() => <LazyRoute page={LazyBeautyReceptionPage} />}
          </Route>
          <Route path="/beauty-tv">
            {() => <LazyRoute page={LazyBeautyTvPage} />}
          </Route>
          <Route path="/beauty-store">
            {() => <LazyRoute page={LazyBeautyStorePage} />}
          </Route>
          <Route path="/studio-setup">
            {() => <LazyRoute page={LazyStudioSetupPage} />}
          </Route>
          <Route path="/wellness-corporate">
            {() => <Redirect to="/corporate-wellness" />}
          </Route>
          <Route path="/corporate-wellness" component={WellnessCorporatePage} />
          <Route path="/host">
            {() => (
              <WedgeRouteGuard path="/host">
                <LazyRoute page={LazyHostPage} />
              </WedgeRouteGuard>
            )}
          </Route>
          <Route path="/brands">{() => <LazyRoute page={LazyBrandsPage} />}</Route>
          <Route path="/rota">
            {() => (
              <OperatorWorkforceGuard>
                <LazyRoute page={LazyRotaPage} />
              </OperatorWorkforceGuard>
            )}
          </Route>
          <Route path="/classes">
            {() => (
              <WedgeRouteGuard path="/classes">
                <LazyRoute page={LazyClassesPage} />
              </WedgeRouteGuard>
            )}
          </Route>
          <Route path="/franchise">
            {() => (
              <WedgeRouteGuard path="/franchise">
                <LazyRoute page={LazyFranchisePage} />
              </WedgeRouteGuard>
            )}
          </Route>
          <Route path="/design-proofs">
            {() => (
              <WedgeRouteGuard path="/design-proofs">
                <LazyRoute page={LazyDesignProofsPage} />
              </WedgeRouteGuard>
            )}
          </Route>
          <Route path="/enquiries">
            {() => (
              <WedgeRouteGuard path="/enquiries">
                <LazyRoute page={LazyEnquiriesRedirect} />
              </WedgeRouteGuard>
            )}
          </Route>
          <Route path="/quotes">
            {() => (
              <WedgeRouteGuard path="/quotes">
                <LazyRoute page={LazyQuotesPage} />
              </WedgeRouteGuard>
            )}
          </Route>
          <Route path="/event-site">
            {() => (
              <WedgeRouteGuard path="/event-site">
                <LazyRoute page={LazyEventSitePage} />
              </WedgeRouteGuard>
            )}
          </Route>
          <Route path="/medspa">
            {() => (
              <WedgeRouteGuard path="/medspa">
                <LazyRoute page={LazyMedspaHubPage} />
              </WedgeRouteGuard>
            )}
          </Route>
          <Route path="/toolkit">{() => <LazyRoute page={LazyToolkitPage} />}</Route>
          <Route path="/lifecycle">{() => <LazyRoute page={LazyLifecyclePage} />}</Route>
          <Route path="/guides">{() => <LazyRoute page={LazyGuidesPage} />}</Route>
          <Route path="/experience">{() => <LazyRoute page={LazyExperiencePage} />}</Route>
          <Route path="/portal">
            {() => {
              if (typeof window !== "undefined") {
                window.location.replace(marketingDemoGateUrl());
              }
              return null;
            }}
          </Route>
          <Route path="/launch-status">{() => <LazyRoute page={LazyLaunchStatusPage} />}</Route>
          <Route path="/settings">{() => <LazyRoute page={LazySettingsPage} />}</Route>
          <Route component={NotFound} />
        </Switch>
      </AppLayout>
    </AuthGuard>
  );
}

function AppRouter() {
  if (isGuestSubdomainHost()) {
    return <GuestSubdomainRouter />;
  }

  if (typeof window !== "undefined") {
    const guestPage = publicEventVendorPageFromPathname(window.location.pathname);
    if (guestPage) return guestPage;
  }

  // App bare /demo → marketing W1 gate (matches staging.livia-hq.com/demo). Founder: /demo/founder
  if (typeof window !== "undefined" && shouldRedirectAppDemoToMarketing(window.location.pathname)) {
    window.location.replace(marketingDemoGateUrl());
    return null;
  }

  return (
    <Switch>
      <Route path="/sign-in" component={SignInPage} />
      <Route path="/sign-up" component={SignUpPage} />
      <Route path="/my/:slug/visit/:bookingId" component={MyLiviaVisitPage} />
      <Route path="/my/:slug" component={MyLiviaShopPage} />
      <Route path="/my" component={MyLiviaPage} />
      <Route path="/my/" component={MyLiviaPage} />

      {isOnboardingPreviewRouteEnabled() ? (
        <>
          <Route path="/onboarding-preview" component={OnboardingPreviewPage} />
          <Route path="/dev/onboarding-preview" component={OnboardingPreviewPage} />
        </>
      ) : null}
      {import.meta.env.DEV ? (
        <>
          <Route path="/experience/platform-surfaces" component={PlatformSurfacesGalleryPage} />
          <Route path="/experience/brand-logos" component={BrandLogoGalleryPage} />
          <Route path="/experience/livia-evolution" component={LiviaEvolutionGalleryPage} />
        </>
      ) : null}
      <Route path="/book/:slug/proof/:token" component={PublicProofPage} />
      <Route path="/book/:slug/intake/:token" component={PublicIntakePage} />
      <Route path="/book/:slug/waitlist/:token" component={PublicWaitlistPage} />
      <Route path="/book/:slug/pay/:token" component={PublicPayPage} />
      <Route path="/book/:slug/shop/:token">{() => <LegacyGuestBookRedirect />}</Route>
      <Route path="/book/:slug/visit/:token" component={PublicVisitPage} />
      <Route path="/book/:slug" component={PublicBookingPage} />
      <Route path="/b/:slug/proof/:token">{() => <LegacyGuestBookRedirect />}</Route>
      <Route path="/b/:slug/intake/:token">{() => <LegacyGuestBookRedirect />}</Route>
      <Route path="/b/:slug/waitlist/:token">{() => <LegacyGuestBookRedirect />}</Route>
      <Route path="/b/:slug/pay/:token">{() => <LegacyGuestBookRedirect />}</Route>
      <Route path="/b/:slug/shop/:token">{() => <LegacyGuestBookRedirect />}</Route>
      <Route path="/b/:slug/visit/:token">{() => <LegacyGuestBookRedirect />}</Route>
      <Route path="/b/:slug">{() => <LegacyGuestBookRedirect />}</Route>
      <Route path="/p/:slug" component={PublicPremisesPage} />
      <Route path="/e/:slug/q/:token" component={PublicEventVendorQuotePage} />
      <Route path="/e/:slug/enquire" component={PublicEventVendorEnquirePage} />
      <Route path="/e/:slug/gallery" component={PublicEventVendorGalleryPage} />
      <Route path="/e/:slug/services" component={PublicEventVendorServicesPage} />
      <Route path="/e/:slug/about" component={PublicEventVendorAboutPage} />
      <Route path="/e/:slug" component={PublicEventVendorSitePage} />

      {/* QA / sales only — stripped from production customer builds */}
      {!isProductionCustomerSurface ? (
        <>
          <Route path="/demo/open" component={DemoOpenPersonaPage} />
          <Route path={FOUNDER_DEMO_LAUNCHER_PATH} component={DemoLauncher} />
          <Route path="/demo/wedge/:vertical" component={DemoWedgeStoryPage} />
          <Route path="/demo/:persona">{() => <LazyRoute page={LazyDemoShowcase} />}</Route>
        </>
      ) : (
        <>
          <Route path="/demo">{() => <Redirect to="/sign-in" />}</Route>
          <Route path="/demo/:persona">{() => <Redirect to="/sign-in" />}</Route>
        </>
      )}

      <Route path="/legal-acceptance">
        {() => (
          <AuthGuard>
            <LegalAcceptancePage />
          </AuthGuard>
        )}
      </Route>

      <Route path="/onboarding">
        {() => (
          <AuthGuard>
            <OnboardingPage />
          </AuthGuard>
        )}
      </Route>

      <Route path="/appearance-preview">
        {() => (
          <AuthGuard>
            <AppearancePreviewPage />
          </AuthGuard>
        )}
      </Route>

      {/* Default route — do not use /:rest*; it breaks useParams on nested detail paths */}
      <Route>
        <AuthenticatedRoutes />
      </Route>
    </Switch>
  );
}

/** Attach Clerk session JWT to API client (required for Vite-proxied dev). */
function ClerkAuthBridge() {
  const { getToken } = useAuth();
  // Register synchronously so the first authenticated query (e.g. accept-invitations)
  // does not race ahead of useEffect and hit the API without a Bearer token.
  setAuthTokenGetter(() => getToken());
  return null;
}

function ClerkProviderWithTheme({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  const [currentTheme, setCurrentTheme] = useState<"light" | "dark" | undefined>();

  useEffect(() => {
    setCurrentTheme(theme === "dark" ? "dark" : "light");
  }, [theme]);

  return (
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      routerPush={(to) => window.history.pushState(null, "", to)}
      routerReplace={(to) => window.history.replaceState(null, "", to)}
      {...(CLERK_PROXY_URL ? { proxyUrl: CLERK_PROXY_URL } : {})}
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/legal-acceptance"
      afterSignOutUrl={SIGN_IN_AFTER_SIGN_OUT}
      appearance={{
        baseTheme: currentTheme === "dark" ? dark : undefined,
        variables: {
          colorPrimary: "#06b6d4",
          colorBackground: currentTheme === "dark" ? "#0c0c0f" : "#ffffff",
          fontFamily: '"Geist", "Inter", system-ui, sans-serif',
          borderRadius: "0.75rem",
        },
      }}
      localization={{
        signIn: {
          start: {
            title: "Sign in to Livia",
            subtitle: "Welcome back to your command center",
          },
        },
        signUp: {
          start: {
            title: "Create your Livia account",
            subtitle: "Start booking smarter in minutes",
          },
        },
      }}
    >
      <ClerkAuthBridge />
      {children}
    </ClerkProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
        <ClerkProviderWithTheme>
          <TooltipProvider>
            <DemoProvider>
              <GatewaySkinHandoffProvider>
                <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                  <GatewaySurfaceThemeSync />
                  <MarketingDemoGateSync />
                  <AppRouter />
                </WouterRouter>
                <Toaster />
              </GatewaySkinHandoffProvider>
            </DemoProvider>
          </TooltipProvider>
        </ClerkProviderWithTheme>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
