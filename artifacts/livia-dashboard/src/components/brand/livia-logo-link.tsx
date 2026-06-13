import { Link } from "wouter";
import { LiviaWordmark } from "@/components/brand/LiviaMark";
import { getMarketingOrigin } from "@/lib/surface-urls";
import { cn } from "@/lib/utils";

type LogoHome = "marketing" | "dashboard" | "demo";

type Props = {
  /** Override destination (internal path or absolute marketing URL). */
  href?: string;
  /** Default home when `href` is omitted. */
  home?: LogoHome;
  size?: "sm" | "md" | "lg";
  className?: string;
};

function resolveHref(home: LogoHome, href?: string): string {
  if (href) return href;
  if (home === "dashboard") return "/dashboard";
  if (home === "demo") return "/demo/founder";
  return getMarketingOrigin();
}

/** Top-of-page Livia wordmark — always links home (marketing site or tenant dashboard). */
export function LiviaLogoLink({ href, home = "marketing", size = "md", className }: Props) {
  const dest = resolveHref(home, href);
  const external = /^https?:\/\//i.test(dest);
  const wrap = cn(
    "inline-flex shrink-0 opacity-90 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-sm",
    className,
  );
  const mark = <LiviaWordmark size={size} />;

  if (external) {
    return (
      <a href={dest} className={wrap} aria-label="Livia home">
        {mark}
      </a>
    );
  }

  return (
    <Link href={dest} className={wrap} aria-label="Livia home">
      {mark}
    </Link>
  );
}
