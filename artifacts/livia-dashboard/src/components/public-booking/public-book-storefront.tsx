import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

/** W5 storefront shell — sticky header, hero, floating CTA (screen card w5.public.book.mobile). */
export function PublicBookStorefront({
  businessName,
  logoUrl,
  coverImageUrl,
  heroCta,
  onHeroCta,
  onOpenChat,
  showMessage = true,
}: {
  businessName: string;
  logoUrl?: string | null;
  coverImageUrl?: string | null;
  heroCta: string;
  onHeroCta: () => void;
  onOpenChat?: () => void;
  showMessage?: boolean;
}) {
  return (
    <div className="public-book-storefront -mx-4 sm:mx-0" data-testid="public-book-storefront">
      <div
        className="sticky top-0 z-30 flex h-16 items-center gap-3 px-4 border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/70"
        data-testid="public-book-sticky-header"
      >
        {logoUrl ? (
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
