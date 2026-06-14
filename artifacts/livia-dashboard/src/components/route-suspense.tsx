import { Suspense, type ComponentType, type LazyExoticComponent } from "react";
import { useLocation } from "wouter";
import { Spinner } from "@/components/ui/spinner";

export function PageLoadFallback() {
  return (
    <div
      className="flex min-h-[40vh] w-full items-center justify-center"
      data-testid="route-loading"
    >
      <Spinner className="h-8 w-8 text-primary" />
    </div>
  );
}

export function LazyRoute({
  page: Page,
}: {
  page: React.LazyExoticComponent<React.ComponentType<object>>;
}) {
  const [location] = useLocation();
  return (
    <Suspense fallback={<PageLoadFallback />}>
      <Page key={location} />
    </Suspense>
  );
}
