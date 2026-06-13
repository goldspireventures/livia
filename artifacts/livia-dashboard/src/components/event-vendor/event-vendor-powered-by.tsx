import { LiviaLogoLink } from "@/components/brand/livia-logo-link";
import { getMarketingOrigin } from "@/lib/surface-urls";

type Props = {
  className?: string;
  /** Compact row for quote / narrow panels */
  compact?: boolean;
};

/** Subtle Livia branding on event-vendor guest surfaces — vendor-first, platform second. */
export function EventVendorPoweredBy({ className, compact }: Props) {
  const marketing = getMarketingOrigin();
  return (
    <div
      className={`ev-powered-by ${compact ? "ev-powered-by--compact" : ""} ${className ?? ""}`}
      data-testid="event-vendor-powered-by"
    >
      <LiviaLogoLink size="sm" home="marketing" className="ev-powered-by__logo" />
      <p className="ev-powered-by__text">
        Quotes &amp; enquiries powered by{" "}
        <a href={marketing} className="ev-powered-by__link">
          Livia
        </a>
      </p>
    </div>
  );
}
