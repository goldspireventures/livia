import { MessageCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicBookingHomeLink } from "@/components/public-booking/public-booking-home-link";
/** W5 storefront shell — default sticky header or beauty centered brand + hero. */
export function PublicBookStorefront({
  businessName,
  logoUrl,
  coverImageUrl,
  heroCta,
  onHeroCta,
  onOpenChat,
  showMessage = true,
  layout = "default",
  tagline,
  heroTagline,
  heroTitle,
  bookingSlug,
  onBookingHome,
}: {
  businessName: string;
  bookingSlug?: string | null;
  onBookingHome?: () => void;
  logoUrl?: string | null;
  coverImageUrl?: string | null;
  heroCta: string;
  onHeroCta: () => void;
  onOpenChat?: () => void;
  showMessage?: boolean;
  layout?: "default" | "beauty";
  tagline?: string | null;
  /** Uppercase eyebrow under brand (preset-specific). */
  heroTagline?: string | null;
  /** Main H1 — defaults to beauty treatment line when layout is beauty. */
  heroTitle?: string | null;
}) {
  if (layout === "beauty") {
    const brandSub =
      tagline?.trim() ||
      businessName
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w.toUpperCase())
        .join(" · ");
    const heroLine = heroTagline?.trim() || "BEAUTY · CONFIDENCE · BLOOM";
    const titleLine = heroTitle?.trim() || "Book a treatment";
    return (
      <div className="public-book-storefront motion-hero-fade-in" data-testid="public-book-storefront">
        <div className="beauty-public-brand">
          {bookingSlug ? (
            <PublicBookingHomeLink
              slug={bookingSlug}
              onNavigate={onBookingHome}
              className="mx-auto block w-fit"
              aria-label={`${businessName} booking home`}
            >
              {logoUrl ? (
                <img src={logoUrl} alt="" className="beauty-public-brand-logo" />
              ) : (
                <div
                  className="beauty-public-brand-logo flex items-center justify-center text-xl font-serif bg-primary/15"
                  style={{ fontFamily: "var(--app-font-serif)" }}
                  aria-hidden
                >
                  {businessName.charAt(0)}
                </div>
              )}
            </PublicBookingHomeLink>
          ) : logoUrl ? (
            <img src={logoUrl} alt="" className="beauty-public-brand-logo" />
          ) : (
            <div
              className="beauty-public-brand-logo flex items-center justify-center text-xl font-serif bg-primary/15"
              style={{ fontFamily: "var(--app-font-serif)" }}
              aria-hidden
            >
              {businessName.charAt(0)}
            </div>
          )}
          <p
            className="beauty-public-brand-name"
            style={{ fontFamily: "var(--app-font-serif)" }}
            data-testid="text-business-name"
          >
            {businessName}
          </p>
          <p className="beauty-public-brand-sub">{brandSub}</p>
        </div>

        <section className="beauty-public-hero-copy" data-testid="public-storefront-hero">
          <h1
            className="beauty-public-hero-title"
            style={{ fontFamily: "var(--app-font-serif)" }}
          >
            {titleLine}
          </h1>
          <Sparkles className="beauty-public-hero-divider mx-auto" aria-hidden />
          <p className="beauty-public-hero-tagline">{heroLine}</p>
        </section>

        {coverImageUrl ? (
          <div className="relative mx-4 mb-2 overflow-hidden rounded-2xl">
            <img
              src={coverImageUrl}
              alt=""
              className="w-full h-36 object-cover public-booking-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="public-book-storefront -mx-4 sm:mx-0" data-testid="public-book-storefront">
      <div
        className="sticky top-0 z-30 flex h-16 items-center gap-3 px-4 border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/70"
        data-testid="public-book-sticky-header"
      >
        {bookingSlug ? (
          <PublicBookingHomeLink slug={bookingSlug} onNavigate={onBookingHome} className="shrink-0">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt=""
                className="h-12 w-12 rounded-full object-cover border border-border/50 bg-card"
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-primary/15 flex items-center justify-center text-base font-serif border border-border/50">
                {businessName.charAt(0)}
              </div>
            )}
          </PublicBookingHomeLink>
        ) : logoUrl ? (
          <img
            src={logoUrl}
            alt=""
            className="h-12 w-12 shrink-0 rounded-full object-cover border border-border/50 bg-card"
          />
        ) : (
          <div className="h-12 w-12 shrink-0 rounded-full bg-primary/15 flex items-center justify-center text-base font-serif border border-border/50">
            {businessName.charAt(0)}
          </div>
        )}
        <p
          className="flex-1 min-w-0 text-lg font-serif tracking-tight truncate leading-tight"
          style={{ fontFamily: "var(--app-font-serif)" }}
          data-testid="text-business-name"
        >
          {businessName}
        </p>
        {showMessage && onOpenChat ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="shrink-0 text-sm font-medium"
            onClick={onOpenChat}
            data-testid="button-message-header"
          >
            <MessageCircle className="h-4 w-4 mr-1.5" aria-hidden />
            Message
          </Button>
        ) : null}
      </div>

      <section
        className="relative overflow-hidden rounded-b-3xl motion-hero-fade-in"
        data-testid="public-storefront-hero"
      >
        <div className="relative h-[min(220px,32vh)] min-h-[160px] bg-muted">
          {coverImageUrl ? (
            <img
              src={coverImageUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover public-booking-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/25 via-background to-violet-500/10" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
        </div>
        <div className="relative flex justify-center -mt-5 px-4 pb-2">
          <Button
            type="button"
            size="lg"
            className="rounded-full px-8 shadow-lg min-h-[44px] motion-logo-enter"
            onClick={onHeroCta}
            data-testid="button-hero-cta"
          >
            {heroCta}
          </Button>
        </div>
      </section>
    </div>
  );
}
