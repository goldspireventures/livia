import { Suspense, type LazyExoticComponent, type ComponentType } from "react";
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
  page: LazyExoticComponent<ComponentType<object>>;
}) {
  return (
    <Suspense fallback={<PageLoadFallback />}>
      <Page />
    </Suspense>
  );
}
