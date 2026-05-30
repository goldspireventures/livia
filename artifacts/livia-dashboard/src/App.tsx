import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { dark } from "@clerk/themes";
import { ThemeProvider, useTheme } from "next-themes";
import { useState, useEffect } from "react";

import { AuthGuard } from "@/components/auth-guard";
import { AppLayout } from "@/components/layout/app-layout";
import { LazyRoute } from "@/components/route-suspense";
import { WedgeRouteGuard } from "@/components/wedge-route-guard";
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
  LazyDesignProofsPage,
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
  LazyPortalPage,
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
import PublicBookingPage from "@/pages/public-booking";
import PublicVisitPage from "@/pages/public-visit";
import PublicProofPage from "@/pages/public-proof";
import MyLiviaPage from "@/pages/my-livia";
import PublicPremisesPage from "@/pages/public-premises";
import DemoLauncher from "@/pages/demo/Launcher";
import DemoWedgeStoryPage from "@/pages/demo/WedgeStory";
import { DemoProvider } from "@/lib/demo/demo-context";
import { isProductionCustomerSurface } from "@/lib/production-surface";
import { isOnboardingPreviewRouteEnabled } from "@/lib/onboarding-preview-route";

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
          <Route path="/staff/:staffId">{() => <LazyRoute page={LazyStaffDetailPage} />}</Route>
          <Route path="/staff">{() => <LazyRoute page={LazyStaffPage} />}</Route>
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
          <Route path="/host">
            {() => (
              <WedgeRouteGuard path="/host">
                <LazyRoute page={LazyHostPage} />
              </WedgeRouteGuard>
            )}
          </Route>
          <Route path="/brands">{() => <LazyRoute page={LazyBrandsPage} />}</Route>
          <Route path="/rota">{() => <LazyRoute page={LazyRotaPage} />}</Route>
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
          <Route path="/medspa">
            {() => (
              <WedgeRouteGuard path="/medspa">
                <LazyRoute page={LazyMedspaHubPage} />
              </WedgeRouteGuard>
            )}
          </Route>
          <Route path="/toolkit">{() => <LazyRoute page={LazyToolkitPage} />}</Route>
          <Route path="/lifecycle">{() => <LazyRoute page={LazyLifecyclePage} />}</Route>
          <Route path="/experience">{() => <LazyRoute page={LazyExperiencePage} />}</Route>
          <Route path="/portal">{() => <LazyRoute page={LazyPortalPage} />}</Route>
          <Route path="/launch-status">{() => <LazyRoute page={LazyLaunchStatusPage} />}</Route>
          <Route path="/settings">{() => <LazyRoute page={LazySettingsPage} />}</Route>
          <Route component={NotFound} />
        </Switch>
      </AppLayout>
    </AuthGuard>
  );
}

function AppRouter() {
  return (
    <Switch>
      <Route path="/sign-in" component={SignInPage} />
      <Route path="/sign-up" component={SignUpPage} />

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
      <Route path="/my" component={MyLiviaPage} />
      <Route path="/b/:slug/proof/:token" component={PublicProofPage} />
      <Route path="/b/:slug/visit/:token" component={PublicVisitPage} />
      <Route path="/b/:slug" component={PublicBookingPage} />
      <Route path="/p/:slug" component={PublicPremisesPage} />

      {/* QA / sales only — stripped from production customer builds */}
      {!isProductionCustomerSurface ? (
        <>
          <Route path="/guides">{() => <LazyRoute page={LazyGuidesPage} />}</Route>
          <Route path="/demo" component={DemoLauncher} />
          <Route path="/demo/wedge/:vertical" component={DemoWedgeStoryPage} />
          <Route path="/demo/:persona">{() => <LazyRoute page={LazyDemoShowcase} />}</Route>
        </>
      ) : (
        <>
          <Route path="/guides">{() => <Redirect to="/sign-in" />}</Route>
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
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <ClerkProviderWithTheme>
          <TooltipProvider>
            <DemoProvider>
              <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                <AppRouter />
              </WouterRouter>
              <Toaster />
            </DemoProvider>
          </TooltipProvider>
        </ClerkProviderWithTheme>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
