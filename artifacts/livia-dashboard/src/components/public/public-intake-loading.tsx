import { Skeleton } from "@/components/ui/skeleton";

/** Screen card w5.public.intake — consent block skeleton. */
export function PublicIntakeLoading() {
  return (
    <div
      className="min-h-screen bg-[#fafafa]"
      data-testid="guest-intake-loading"
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">Loading intake form</span>
      <Skeleton className="h-14 w-full rounded-none" />
      <div className="max-w-xl mx-auto px-5 py-6 space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-[min(280px,40vh)] w-full rounded-xl" />
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
    </div>
  );
}
