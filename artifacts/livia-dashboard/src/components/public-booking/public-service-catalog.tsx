import { Clock, ChevronRight } from "lucide-react";

import { formatCurrency } from "@/lib/format";

import {

  groupServicesByCategory,

  isConsultOnlyService,

  consultServiceBadge,

  type PublicServiceRow,

} from "@/lib/public-booking-helpers";

import {

  featuredServicesHint,

  pickFeaturedPublicServices,

  publicBookCatalogCountLabel,

} from "@/lib/public-featured-services";

import { PublicServiceThumb } from "@/components/public-booking/public-service-thumb";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";



export function PublicServiceCatalog({

  services,

  vertical,

  featuredServiceIds,

  catalogTitle = "Services",

  onSelect,

  layout = "list",

  selectedServiceId,

}: {

  services: PublicServiceRow[];

  vertical?: string | null;

  featuredServiceIds?: string[] | null;

  catalogTitle?: string;

  bookCta?: string;

  layout?: "list" | "beauty-grid";

  selectedServiceId?: string | null;

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



  if (layout === "beauty-grid") {
    const { featured, rest } = pickFeaturedPublicServices(services, featuredServiceIds);
    const hint = featuredServicesHint(featured.length, rest.length, services.length, catalogTitle);

    return (
      <div data-testid="public-service-catalog">
        <div className="flex items-baseline justify-between gap-2 mb-3">
          <h3 className="text-sm font-medium" style={{ fontFamily: "var(--app-font-serif)" }}>
            {catalogTitle}
          </h3>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground tabular-nums">
            {publicBookCatalogCountLabel(services.length, catalogTitle)}
          </span>
        </div>
        <div className="beauty-service-grid">
          {featured.map((svc) => (

            <button

              key={svc.id}

              type="button"

              className={cn(
                "beauty-service-card",
                selectedServiceId === svc.id && "beauty-service-card--selected",
              )}

              data-testid={`button-service-${svc.id}`}

              onClick={() => onSelect(svc)}

            >

              <PublicServiceThumb

                serviceName={svc.name}

                vertical={vertical}

                imageUrl={svc.imageUrl}

                className="beauty-service-card-thumb"

              />

              <div className="beauty-service-card-body">

                <p

                  className="beauty-service-card-title"

                  style={{ fontFamily: "var(--app-font-serif)" }}

                >

                  {svc.name}

                </p>

                <p className="beauty-service-card-from">From</p>

                <p className="beauty-service-card-price">

                  {svc.priceMinor === 0

                    ? "Free"

                    : formatCurrency(svc.priceMinor, svc.currency)}

                </p>

              </div>

            </button>

          ))}

        </div>

        {hint ? (

          <p className="text-xs text-center text-muted-foreground mt-4">{hint}</p>

        ) : null}

        {rest.length > 0 ? (
          <div className="mt-5 space-y-3" data-testid="public-service-overflow-section">
            <div className="flex items-baseline justify-between gap-2">
              <h4 className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
                More {catalogTitle.toLowerCase()}
              </h4>
              <span className="text-[10px] text-muted-foreground tabular-nums">{rest.length}</span>
            </div>
            <div
              className="beauty-service-overflow-menu space-y-3"
              data-testid="public-service-overflow-menu"
            >
            {rest.map((svc) => (

              <button

                key={svc.id}

                type="button"

                className={cn(
                  "flex w-full items-center min-h-[80px] rounded-xl border border-border/80 px-3 py-3.5 text-left gap-3 hover:border-primary/40",
                  selectedServiceId === svc.id && "border-primary/60 ring-1 ring-primary/35",
                )}

                data-testid={`button-service-${svc.id}`}

                onClick={() => onSelect(svc)}

              >

                <PublicServiceThumb

                  serviceName={svc.name}

                  vertical={vertical}

                  imageUrl={svc.imageUrl}

                  className="h-16 w-16 rounded-lg object-cover shrink-0"

                />

                <div className="flex-1 min-w-0">

                  <p className="font-medium text-[15px]">{svc.name}</p>

                  <p className="text-sm text-primary">

                    {formatCurrency(svc.priceMinor, svc.currency)}

                  </p>

                </div>

              </button>

            ))}
            </div>
          </div>
        ) : null}

      </div>

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

            {items.map((svc) => (

              <button

                key={svc.id}

                type="button"

                className="flex w-full items-center min-h-[80px] rounded-xl border border-border/80 px-3 py-3.5 text-left transition-[transform,border-color] active:scale-[0.98] hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring gap-3"

                data-testid={`button-service-${svc.id}`}

                onClick={() => onSelect(svc)}

              >

                <PublicServiceThumb

                  serviceName={svc.name}

                  vertical={vertical}

                  imageUrl={svc.imageUrl}

                  className="h-16 w-16 rounded-lg object-cover shrink-0"

                />

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

            ))}

          </div>

        </section>

      ))}

    </div>

  );

}

