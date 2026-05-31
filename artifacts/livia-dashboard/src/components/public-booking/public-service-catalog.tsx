import { Clock, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import {
  groupServicesByCategory,
  isConsultOnlyService,
  consultServiceBadge,
  publicServiceBookCta,
  type PublicServiceRow,
} from "@/lib/public-booking-helpers";

export function PublicServiceCatalog({
  services,
  vertical,
  bookCta,
  onSelect,
}: {
  services: PublicServiceRow[];
  vertical?: string | null;
  bookCta: string;
  onSelect: (service: PublicServiceRow) => void;
}) {
  const groups = groupServicesByCategory(services, vertical);
  const consultBadge = consultServiceBadge(vertical);

  if (services.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-8">No services available right now.</p>
    );
  }

  return (
    <div className="space-y-8" data-testid="public-service-catalog">
      {groups.map(({ category, services: items }) => (
        <section key={category} aria-labelledby={`svc-cat-${category.replace(/\s/g, "-")}`}>
          <h3
            id={`svc-cat-${category.replace(/\s/g, "-")}`}
            className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3"
          >
            {category}
          </h3>
          <div className="space-y-3">
            {items.map((svc) => (
              <Card
                key={svc.id}
                className="overflow-hidden border-border/80 hover:border-primary/40 transition-colors"
              >
                <CardContent className="p-0">
                  <div className="flex gap-0">
                    {svc.imageUrl ? (
                      <div className="w-24 sm:w-28 shrink-0 bg-muted">
                        <img
                          src={svc.imageUrl}
                          alt=""
                          className="h-full w-full object-cover min-h-[5.5rem]"
                        />
                      </div>
                    ) : null}
                    <div className="flex flex-1 flex-col sm:flex-row sm:items-center gap-3 p-4 min-w-0">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium leading-snug">{svc.name}</p>
                          {isConsultOnlyService(svc.name, svc.priceMinor, vertical) &&
                          consultBadge ? (
                            <Badge variant="secondary" className="text-[10px] font-normal">
                              {consultBadge}
                            </Badge>
                          ) : null}
                        </div>
                        {svc.description ? (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {svc.description}
                          </p>
                        ) : null}
                        <div className="flex items-center gap-3 mt-2">
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" aria-hidden />
                            {svc.durationMinutes} min
                          </span>
                          <span className="text-sm font-semibold text-primary">
                            {svc.priceMinor === 0
                              ? "Free"
                              : formatCurrency(svc.priceMinor, svc.currency)}
                          </span>
                        </div>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        className="shrink-0 w-full sm:w-auto min-h-[44px]"
                        data-testid={`button-service-${svc.id}`}
                        onClick={() => onSelect(svc)}
                      >
                        {publicServiceBookCta(svc, vertical, bookCta)}
                        <ChevronRight className="h-4 w-4 ml-0.5" aria-hidden />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
