import type { ReactNode } from "react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

/** Logo / brand mark → public booking home (`/b/:slug`, services step). */
export function PublicBookingHomeLink({
  slug,
  className,
  children,
  onNavigate,
  "aria-label": ariaLabel,
}: {
  slug: string;
  className?: string;
  children: ReactNode;
  onNavigate?: () => void;
  "aria-label"?: string;
}) {
  const href = `/b/${slug}`;
  return (
    <Link
      href={href}
      className={cn(
        "rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
      aria-label={ariaLabel ?? "Back to booking home"}
      onClick={() => onNavigate?.()}
      data-testid="public-booking-home-link"
    >
      {children}
    </Link>
  );
}
