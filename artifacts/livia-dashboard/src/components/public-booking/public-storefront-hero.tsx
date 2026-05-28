import { Instagram, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { verticalPackUi } from "@/lib/vertical-pack-ui";

export function PublicStorefrontHero({
  name,
  description,
  city,
  vertical,
  category,
  logoUrl,
  coverImageUrl,
  instagramHandle,
  publicCta,
  publicAddress,
  onPrimaryAction,
}: {
  name: string;
  description?: string | null;
  city?: string | null;
  vertical?: string | null;
  category?: string | null;
  logoUrl?: string | null;
  coverImageUrl?: string | null;
  instagramHandle?: string | null;
  publicCta?: string;
  publicAddress?: string | null;
  onPrimaryAction?: () => void;
}) {
  const vocab = verticalPackUi(vertical, category);
  const addr = publicAddress;
  const igUrl = instagramHandle
    ? `https://instagram.com/${instagramHandle.replace(/^@/, "")}`
    : null;

  return (
    <section
      className="relative -mx-4 sm:-mx-0 mb-8 overflow-hidden rounded-none sm:rounded-2xl border border-border/50 bg-card/30"
      data-testid="public-storefront-hero"
    >
      <div className="relative h-36 sm:h-44 bg-muted">
        {coverImageUrl ? (
          <img src={coverImageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-violet-500/10" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      </div>
      <div className="relative px-4 pb-4 -mt-10">
        <div className="flex items-end gap-3">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt=""
              className="h-16 w-16 rounded-xl border-2 border-background object-cover shadow-md bg-card"
            />
          ) : (
            <div className="h-16 w-16 rounded-xl border-2 border-background bg-primary/15 flex items-center justify-center text-lg font-serif">
              {name.charAt(0)}
            </div>
          )}
          <div className="min-w-0 flex-1 pb-1">
            <p className="text-[10px] uppercase tracking-widest font-mono text-primary truncate">
              {vocab.label}
            </p>
            {city ? (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3 shrink-0" aria-hidden />
                {city}
              </p>
            ) : null}
          </div>
          {igUrl ? (
            <Button variant="outline" size="sm" className="shrink-0 h-9" asChild>
              <a href={igUrl} target="_blank" rel="noreferrer">
                <Instagram className="h-4 w-4 mr-1" aria-hidden />
                IG
              </a>
            </Button>
          ) : null}
        </div>
        {description ? (
          <p className="text-sm text-muted-foreground mt-3 leading-relaxed line-clamp-3">{description}</p>
        ) : null}
        {addr ? (
          <p className="text-xs text-muted-foreground mt-2 flex items-start gap-1.5">
            <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" aria-hidden />
            {addr}
          </p>
        ) : null}
        {onPrimaryAction && publicCta ? (
          <Button className="w-full mt-4 sm:hidden" onClick={onPrimaryAction}>
            {publicCta}
          </Button>
        ) : null}
      </div>
    </section>
  );
}
