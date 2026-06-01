import { Link } from "wouter";
import { cn } from "@/lib/utils";

type Props = {
  businessName: string;
  logoUrl?: string | null;
  href?: string;
  className?: string;
  /** Show business name beside logo (desktop header). */
  showName?: boolean;
};

/** Studio brand in the top bar — opens shop profile (frees sidebar space for nav). */
export function StudioHeaderBrand({
  businessName,
  logoUrl,
  href = "/settings?tab=shop",
  className,
  showName = true,
}: Props) {
  const label = businessName.trim() || "Your shop";
  const initial = label.charAt(0).toUpperCase() || "S";

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 min-w-0 max-w-[11rem] sm:max-w-[14rem] rounded-lg px-1.5 py-1 -ml-1.5",
        "outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary/40",
        className,
      )}
      data-testid="studio-header-brand"
      aria-label={`${label} — studio profile`}
    >
      {logoUrl ? (
        <img
          src={logoUrl}
          alt=""
          className="h-8 w-8 shrink-0 rounded-full object-cover border border-border/60 bg-muted/30"
        />
      ) : (
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border/60 bg-primary/15 text-sm font-serif"
          style={{ fontFamily: "var(--app-font-serif)" }}
          aria-hidden
        >
          {initial}
        </div>
      )}
      {showName ? (
        <span className="text-sm font-medium truncate leading-tight hidden sm:inline">{label}</span>
      ) : null}
    </Link>
  );
}
