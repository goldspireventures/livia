import { useClerk } from "@clerk/clerk-react";
import { cn } from "@/lib/utils";

/** Opens Clerk user profile — use inline wherever copy references Profile & security. */
export function ProfileSecurityLink({ className }: { className?: string }) {
  const { openUserProfile } = useClerk();
  return (
    <button
      type="button"
      onClick={() => openUserProfile()}
      className={cn(
        "font-medium text-foreground underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-sm",
        className,
      )}
      data-testid="link-profile-security"
    >
      Profile &amp; security
    </button>
  );
}
