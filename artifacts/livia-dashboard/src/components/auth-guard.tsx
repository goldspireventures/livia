import { useAuth } from "@clerk/clerk-react";
import { Redirect, useLocation } from "wouter";
import { useGetMyBusinesses } from "@workspace/api-client-react";
import { BusinessProvider } from "@/lib/business-context";
import { Spinner } from "@/components/ui/spinner";
import { ReactNode } from "react";

export function AuthGuard({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const [location] = useLocation();

  if (!isLoaded) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    );
  }

  if (!isSignedIn) {
    return <Redirect to={`/sign-in?redirect_url=${encodeURIComponent(location)}`} />;
  }

  return <BusinessDataLoader>{children}</BusinessDataLoader>;
}

function BusinessDataLoader({ children }: { children: ReactNode }) {
  const { data: businesses, isLoading } = useGetMyBusinesses();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    );
  }

  const business = businesses && businesses.length > 0 ? businesses[0] : null;

  if (!business && location !== "/onboarding") {
    return <Redirect to="/onboarding" />;
  }

  return (
    <BusinessProvider initialBusiness={business} isLoading={isLoading}>
      {children}
    </BusinessProvider>
  );
}
