import { Skeleton } from "@/components/ui/skeleton";

/** Screen card w5.public.proof — artwork skeleton 55vh. */
export function PublicProofLoading() {
  return (
    <div
      className="min-h-screen bg-[#0a0a0b] text-zinc-200"
      data-testid="guest-proof-loading"
      aria-busy
      aria-label="Loading design proof"
    >
      <Skeleton className="h-14 w-full rounded-none bg-zinc-800/80" />
      <Skeleton className="h-[55vh] w-full rounded-none bg-zinc-800/60" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-4 w-40 bg-zinc-800/60" />
        <Skeleton className="h-20 w-full rounded-xl bg-zinc-800/60" />
      </div>
    </div>
  );
}
