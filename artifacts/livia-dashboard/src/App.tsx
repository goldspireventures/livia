import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { dark } from "@clerk/themes";
import { ThemeProvider, useTheme } from "next-themes";
import { useState, useEffect } from "react";

import { AuthGuard } from "@/components/auth-guard";
import { AppLayout } from "@/components/layout/app-layout";

import NotFound from "@/pages/not-found";
import SignInPage from "@/pages/sign-in";
import SignUpPage from "@/pages/sign-up";
import OnboardingPage from "@/pages/onboarding";
import DashboardPage from "@/pages/dashboard";
import BookingsPage from "@/pages/bookings";
import BookingNewPage from "@/pages/booking-new";
import BookingDetailPage from "@/pages/booking-detail";
import CustomersPage from "@/pages/customers";
import CustomerDetailPage from "@/pages/customer-detail";
import StaffPage from "@/pages/staff";
import StaffDetailPage from "@/pages/staff-detail";
import ServicesPage from "@/pages/services";
import SettingsPage from "@/pages/settings";
import InboxPage from "@/pages/inbox";
import MyDayPage from "@/pages/my-day";
import PublicBookingPage from "@/pages/public-booking";

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

function RootRedirect() {
  const { isSignedIn, isLoaded } = useAuth();
  if (!isLoaded) return null;
  return <Redirect to={isSignedIn ? "/dashboard" : "/sign-in"} />;
}

function AuthenticatedRoutes() {
  return (
    <AuthGuard>
      <AppLayout>
        <Switch>
          <Route path="/dashboard" component={DashboardPage} />
          <Route path="/my-day" component={MyDayPage} />
          <Route path="/bookings/new" component={BookingNewPage} />
          <Route path="/bookings/:bookingId" component={BookingDetailPage} />
          <Route path="/bookings" component={BookingsPage} />
          <Route path="/customers/:customerId" component={CustomerDetailPage} />
          <Route path="/customers" component={CustomersPage} />
          <Route path="/staff/:staffId" component={StaffDetailPage} />
          <Route path="/staff" component={StaffPage} />
          <Route path="/services" component={ServicesPage} />
          <Route path="/inbox" component={InboxPage} />
          <Route path="/settings" component={SettingsPage} />
          <Route component={NotFound} />
        </Switch>
      </AppLayout>
    </AuthGuard>
  );
}

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={RootRedirect} />
      <Route path="/sign-in" component={SignInPage} />
      <Route path="/sign-up" component={SignUpPage} />
      <Route path="/b/:slug" component={PublicBookingPage} />

      <Route path="/onboarding">
        {() => (
          <AuthGuard>
            <OnboardingPage />
          </AuthGuard>
        )}
      </Route>

      <Route path="/:rest*">
        <AuthenticatedRoutes />
      </Route>
    </Switch>
  );
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
      {...(import.meta.env.PROD ? { proxyUrl: window.location.origin + "/api/__clerk" } : {})}
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/onboarding"
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
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <AppRouter />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </ClerkProviderWithTheme>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
