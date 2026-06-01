import { Link } from "wouter";
import { LiviaMark } from "@/components/brand/LiviaMark";
import { cn } from "@/lib/utils";

type Props = {
  businessName: string;
  logoUrl?: string | null;
  /** Tighter lockup for appearance iframe */
  compact?: boolean;
  platformHref?: string;
  studioHref?: string;
  /** `platform` = Livia only in sidebar (studio lives in header). `full` = both (appearance preview). */
  lockup?: "full" | "platform";
};

/** W4 beauty sidebar — Livia platform lockup; studio brand optional (header in live app). */
export function BeautySidebarBrand({
  businessName,
  logoUrl,
  compact,
  platformHref = "/dashboard",
  studioHref = "/settings?tab=shop",
  lockup = "full",
}: Props) {
  const lines = businessName.trim().split(/\s+/);
  const primary = lines.slice(0, 2).join(" ");
  const secondary = lines.slice(2).join(" ");

  const pad =
    lockup === "platform"
      ? compact
        ? "px-2.5 pt-2.5 pb-1.5 mx-1"
        : "px-3 pt-3 pb-2 mx-1.5"
      : compact
        ? "px-2.5 pt-3 pb-2 mx-1"
        : "px-3 pt-4 pb-3 mx-1.5";

  const showStudio = lockup === "full";

  return (
    <div
      className={cn("beauty-sidebar-brand", showStudio ? "space-y-4" : "space-y-0", pad)}
      data-testid="beauty-sidebar-brand"
    >
      <Link
        href={platformHref}
        className={cn(
          "block text-center rounded-lg outline-none",
          "transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary/40",
        )}
        data-testid="beauty-sidebar-livia"
        aria-label="Livia — today"
      >
        <LiviaMark
          className={cn("mx-auto mb-1.5", compact ? "h-9 w-9" : "h-10 w-10")}
          fill="hsl(330 45% 78%)"
        />
        <p
          className={cn(
            "beauty-lockup-livia font-serif leading-none",
            compact ? "text-[13px] tracking-[0.24em]" : "text-[15px] tracking-[0.28em]",
          )}
          style={{ fontFamily: "var(--app-font-serif)" }}
        >
          LIVIA
        </p>
      </Link>

      {showStudio ? (
        <Link
          href={studioHref}
          className={cn(
            "block text-center rounded-lg outline-none pt-0.5",
            "transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary/40",
          )}
          data-testid="beauty-sidebar-studio"
          aria-label={`${businessName} — studio profile`}
        >
          {logoUrl ? (
            <img
              src={logoUrl}
              alt=""
              className={cn(
                "mx-auto mb-1.5 rounded-md object-contain bg-muted/20",
                compact ? "h-9 w-9" : "h-10 w-10",
              )}
            />
          ) : null}
          <p
            className={cn(
              "beauty-lockup-studio font-medium uppercase leading-snug px-1",
              logoUrl ? "mt-1" : "mt-0",
              compact ? "text-[9px] tracking-[0.12em]" : "text-[10px] tracking-[0.14em]",
            )}
            title={businessName}
          >
            {primary}
            {secondary ? (
              <>
                <br />
                {secondary}
              </>
            ) : null}
          </p>
        </Link>
      ) : null}
    </div>
  );
}

/** @deprecated */
export const BeautySidebarRoseMark = LiviaMark;
export const BeautySidebarFlowerMark = LiviaMark;
