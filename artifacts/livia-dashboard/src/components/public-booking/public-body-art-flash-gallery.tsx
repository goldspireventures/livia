import { cn } from "@/lib/utils";
import { ImageIcon } from "lucide-react";

export type PublicDesignShowcaseItem = {
  id: string;
  imageUrl: string;
  title: string;
  note?: string | null;
};

export function PublicBodyArtFlashGallery({
  items,
  title = "Flash & custom work",
  className,
}: {
  items: PublicDesignShowcaseItem[];
  title?: string;
  className?: string;
}) {
  if (items.length === 0) return null;

  return (
    <section
      id="public-book-flash"
      className={cn("space-y-3", className)}
      data-testid="public-body-art-flash-gallery"
    >
      <div className="flex items-end justify-between gap-2 px-1">
        <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
        <p className="text-[11px] text-muted-foreground hidden sm:block">
          Swipe to browse — book a consult to claim flash
        </p>
      </div>
      <div
        className={cn(
          "flex gap-3 overflow-x-auto pb-2 -mx-1 px-1",
          "snap-x snap-mandatory scroll-smooth scrollbar-none",
          "touch-pan-x",
        )}
      >
        {items.map((item) => (
          <figure
            key={item.id}
            className={cn(
              "snap-start shrink-0 w-[9.5rem] sm:w-[11rem]",
              "rounded-xl border border-border/70 bg-card overflow-hidden",
              "shadow-sm",
            )}
          >
            <div className="relative aspect-square bg-muted">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  <ImageIcon className="h-8 w-8 opacity-40" aria-hidden />
                </div>
              )}
            </div>
            <figcaption className="px-2.5 py-2">
              <p className="text-xs font-medium line-clamp-2">{item.title}</p>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
