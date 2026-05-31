import { Clock, ChevronRight } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import {
  groupServicesByCategory,
  isConsultOnlyService,
  consultServiceBadge,
  type PublicServiceRow,
} from "@/lib/public-booking-helpers";
import { resolvePublicServiceImageUrl } from "@/lib/public-service-image";
import { Badge } from "@/components/ui/badge";

export function PublicServiceCatalog({
  services,
  vertical,
  onSelect,
}: {
  services: PublicServiceRow[];
  vertical?: string | null;
  bookCta?: string;
  onSelect: (service: PublicServiceRow) => void;
}) {
  const consultBadge = consultServiceBadge(vertical);
  const sorted = [...services].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name),
  );
  const groups =
    services.length > 6
      ? groupServicesByCategory(services, vertical)
      : [{ category: "Services", services: sorted }];

  if (services.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-8">No services available right now.</p>
    );
  }

  return (
    <div className="space-y-6" data-testid="public-service-catalog">
      {groups.map(({ category, services: items }) => (
        <section key={category} aria-labelledby={`svc-cat-${category.replace(/\s/g, "-")}`}>
          <h3
            id={`svc-cat-${category.replace(/\s/g, "-")}`}
            className="text-sm uppercase tracking-widest text-muted-foreground mb-3 font-medium"
          >
            {category}
          </h3>
          <div className="space-y-3">
            {items.map((svc) => {
              const thumb = resolvePublicServiceImageUrl(svc.name, vertical, svc.imageUrl);
              return (
              <button
                key={svc.id}
                type="button"
                className="flex w-full items-center min-h-[72px] rounded-xl border border-border/80 px-3 py-3 text-left transition-[transform,border-color] active:scale-[0.98] hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring gap-3"
                data-testid={`button-service-${svc.id}`}
                onClick={() => onSelect(svc)}
              >
                {thumb ? (
                  <img
                    src={thumb}
                    alt=""
                    className="h-14 w-14 rounded-lg object-cover shrink-0 bg-muted"
                    loading="lazy"
                  />
                ) : (
                  <div className="h-14 w-14 rounded-lg bg-muted shrink-0" aria-hidden />
                )}
                <div className="flex-1 min-w-0 pr-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium leading-snug truncate">{svc.name}</p>
                    {isConsultOnlyService(svc.name, svc.priceMinor, vertical) && consultBadge ? (
                      <Badge variant="secondary" className="text-[10px] font-normal shrink-0">
                        {consultBadge}
                      </Badge>
                    ) : null}
                  </div>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                    <Clock className="h-3 w-3 shrink-0" aria-hidden />
                    {svc.durationMinutes} min
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[17px] font-semibold tabular-nums text-primary">
                    {svc.priceMinor === 0
                      ? "Free"
                      : formatCurrency(svc.priceMinor, svc.currency)}
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden />
                </div>
              </button>
            );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
