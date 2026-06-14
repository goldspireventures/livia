import { useMemo, useState } from "react";
import { Clock, ChevronRight, Search } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { PublicBookCatalogMode } from "@workspace/policy";

function beautyCatalogHint(svc: PublicServiceRow): string | null {
  if (svc.serviceKind === "fill") {
    const days = svc.rebookIntervalDays ?? 14;
    return `Maintenance fill — typical cycle every ${days} days.`;
  }
  if (svc.serviceKind === "full_set") {
    return "New set — allow consultation time if it has been a while.";
  }
  if (svc.requiresPatchTest) {
    return "Patch test required 24–48h before your first lash or tint.";
  }
  if (svc.rebookIntervalDays) {
    return `Typical rebook every ${svc.rebookIntervalDays} days.`;
  }
  return null;
}

function CatalogHeading({
  catalogTitle,
  count,
}: {
  catalogTitle: string;
  count: number;
}) {
  return (
    <div className="flex items-baseline justify-between gap-2 mb-3">
      <h3 className="text-sm font-medium" style={{ fontFamily: "var(--app-font-serif)" }}>
        {catalogTitle}
      </h3>
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground tabular-nums">
        {publicBookCatalogCountLabel(count, catalogTitle)}
      </span>
    </div>
  );
}

function CatalogFilterToolbar({
  query,
  onQueryChange,
  categories,
  activeCategory,
  onCategoryChange,
  catalogTitle,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  categories: string[];
  activeCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  catalogTitle: string;
}) {
  const searchLabel = `Search ${catalogTitle.toLowerCase()}…`;
  return (
    <div className="mb-4 space-y-3" data-testid="public-catalog-filter">
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={searchLabel}
          className="h-9 pl-9 text-sm"
          aria-label={searchLabel}
        />
      </div>
      {categories.length > 1 ? (
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => onCategoryChange(null)}
            className={cn(
              "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
              activeCategory == null
                ? "border-primary/50 bg-primary/10 text-foreground"
                : "border-border/80 text-muted-foreground hover:border-primary/30",
            )}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => onCategoryChange(category)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                activeCategory === category
                  ? "border-primary/50 bg-primary/10 text-foreground"
                  : "border-border/80 text-muted-foreground hover:border-primary/30",
              )}
            >
              {category}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function BeautyGridCard({
  svc,
  vertical,
  selected,
  onSelect,
  compact,
}: {
  svc: PublicServiceRow;
  vertical?: string | null;
  selected: boolean;
  onSelect: (service: PublicServiceRow) => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      className={cn(
        "beauty-service-card beauty-treatment-card",
        selected && "beauty-service-card--selected",
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
        <p className="beauty-service-card-title" style={{ fontFamily: "var(--app-font-serif)" }}>
          {svc.name}
        </p>
        {!compact ? <p className="beauty-service-card-from">From</p> : null}
        <p className="beauty-service-card-price">
          {svc.priceMinor === 0 ? "Free" : formatCurrency(svc.priceMinor, svc.currency)}
        </p>
        {!compact && vertical === "beauty" && beautyCatalogHint(svc) ? (
          <p className="text-[11px] text-muted-foreground mt-1 leading-snug line-clamp-2">
            {beautyCatalogHint(svc)}
          </p>
        ) : null}
      </div>
    </button>
  );
}

function WellnessGridCard({
  svc,
  vertical,
  selected,
  onSelect,
}: {
  svc: PublicServiceRow;
  vertical?: string | null;
  selected: boolean;
  onSelect: (service: PublicServiceRow) => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        "wellness-service-card wellness-treatment-card",
        selected && "wellness-service-card--selected",
      )}
      data-testid={`button-service-${svc.id}`}
      onClick={() => onSelect(svc)}
    >
      <PublicServiceThumb
        serviceName={svc.name}
        vertical={vertical}
        imageUrl={svc.imageUrl}
        className="wellness-service-card-thumb"
      />
      <div className="wellness-service-card-body">
        <p className="wellness-service-card-title" style={{ fontFamily: "var(--app-font-serif)" }}>
          {svc.name}
        </p>
        <p className="wellness-service-card-meta">
          {svc.durationMinutes} min
          {svc.priceMinor > 0 ? ` · ${formatCurrency(svc.priceMinor, svc.currency)}` : " · Enquire"}
        </p>
      </div>
    </button>
  );
}

function ListCatalogCard({
  svc,
  vertical,
  consultBadge,
  onSelect,
}: {
  svc: PublicServiceRow;
  vertical?: string | null;
  consultBadge: string | null;
  onSelect: (service: PublicServiceRow) => void;
}) {
  return (
    <button
      type="button"
      className="public-treatment-list-card flex w-full items-center min-h-[52px] rounded-lg border border-border/80 px-2.5 py-2 text-left transition-[transform,border-color] active:scale-[0.98] hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring gap-2.5"
      data-testid={`button-service-${svc.id}`}
      onClick={() => onSelect(svc)}
    >
      <PublicServiceThumb
        serviceName={svc.name}
        vertical={vertical}
        imageUrl={svc.imageUrl}
        className="h-10 w-10 rounded-md object-cover shrink-0"
      />
      <div className="flex-1 min-w-0 pr-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="text-sm font-medium leading-snug truncate">{svc.name}</p>
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
        <span className="text-sm font-semibold tabular-nums text-primary">
          {svc.priceMinor === 0 ? "Free" : formatCurrency(svc.priceMinor, svc.currency)}
        </span>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
      </div>
    </button>
  );
}

export function PublicServiceCatalog({
  services,
  vertical,
  featuredServiceIds,
  catalogTitle = "Services",
  onSelect,
  layout = "list",
  selectedServiceId,
  catalogMode = "featured",
}: {
  services: PublicServiceRow[];
  vertical?: string | null;
  featuredServiceIds?: string[] | null;
  catalogTitle?: string;
  bookCta?: string;
  layout?: "list" | "beauty-grid" | "wellness-grid";
  selectedServiceId?: string | null;
  catalogMode?: PublicBookCatalogMode;
  onSelect: (service: PublicServiceRow) => void;
}) {
  const consultBadge = consultServiceBadge(vertical);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const sorted = useMemo(
    () =>
      [...services].sort(
        (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name),
      ),
    [services],
  );

  const filteredServices = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sorted.filter((svc) => {
      if (activeCategory && (svc.category?.trim() || "Services") !== activeCategory) {
        return false;
      }
      if (!q) return true;
      const hay = `${svc.name} ${svc.description ?? ""} ${svc.category ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [sorted, query, activeCategory]);

  const categoryList = useMemo(() => {
    const cats = new Set<string>();
    for (const svc of services) {
      cats.add(svc.category?.trim() || "Services");
    }
    return [...cats].sort((a, b) => a.localeCompare(b));
  }, [services]);

  const groups = useMemo(() => {
    const rows = catalogMode === "featured" ? services : filteredServices;
    return rows.length > 6 || catalogMode !== "featured"
      ? groupServicesByCategory(rows, vertical)
      : [{ category: catalogTitle, services: rows }];
  }, [services, filteredServices, catalogMode, vertical, catalogTitle]);

  if (services.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-8">No services available right now.</p>
    );
  }

  const scaled = catalogMode === "expanded" || catalogMode === "filtered";
  const denseGrid = services.length >= 12;

  if (scaled) {
    return (
      <div data-testid="public-service-catalog">
        <CatalogHeading catalogTitle={catalogTitle} count={services.length} />
        {catalogMode === "filtered" ? (
          <CatalogFilterToolbar
            query={query}
            onQueryChange={setQuery}
            categories={categoryList}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            catalogTitle={catalogTitle}
          />
        ) : null}
        {filteredServices.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No treatments match your search.</p>
        ) : (
          <div className="space-y-8">
            {groups.map(({ category, services: items }) => (
              <section key={category} aria-labelledby={`svc-cat-${category.replace(/\s/g, "-")}`}>
                {groups.length > 1 ? (
                  <h3
                    id={`svc-cat-${category.replace(/\s/g, "-")}`}
                    className="text-xs uppercase tracking-widest text-muted-foreground mb-3 font-medium"
                  >
                    {category}
                  </h3>
                ) : null}
                {layout === "beauty-grid" ? (
                  <div
                    className={cn(
                      "public-service-catalog-grid",
                      denseGrid && "public-service-catalog-grid--dense",
                    )}
                  >
                    {items.map((svc) => (
                      <BeautyGridCard
                        key={svc.id}
                        svc={svc}
                        vertical={vertical}
                        selected={selectedServiceId === svc.id}
                        onSelect={onSelect}
                        compact={denseGrid}
                      />
                    ))}
                  </div>
                ) : layout === "wellness-grid" ? (
                  <div
                    className={cn(
                      "wellness-service-grid wellness-service-grid--expanded",
                      denseGrid && "wellness-service-grid--dense",
                    )}
                  >
                    {items.map((svc) => (
                      <WellnessGridCard
                        key={svc.id}
                        svc={svc}
                        vertical={vertical}
                        selected={selectedServiceId === svc.id}
                        onSelect={onSelect}
                      />
                    ))}
                  </div>
                ) : (
                  <div
                    className={cn(
                      "public-service-catalog-grid",
                      denseGrid && "public-service-catalog-grid--dense",
                    )}
                  >
                    {items.map((svc) => (
                      <ListCatalogCard
                        key={svc.id}
                        svc={svc}
                        vertical={vertical}
                        consultBadge={consultBadge}
                        onSelect={onSelect}
                      />
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (layout === "wellness-grid") {
    const { featured, rest } = pickFeaturedPublicServices(services, featuredServiceIds);
    const hint = featuredServicesHint(featured.length, rest.length, services.length, catalogTitle);
    return (
      <div data-testid="public-service-catalog">
        <CatalogHeading catalogTitle={catalogTitle} count={services.length} />
        <div className="wellness-service-grid">
          {featured.map((svc) => (
            <WellnessGridCard
              key={svc.id}
              svc={svc}
              vertical={vertical}
              selected={selectedServiceId === svc.id}
              onSelect={onSelect}
            />
          ))}
        </div>
        {hint ? <p className="text-xs text-center text-muted-foreground mt-4">{hint}</p> : null}
        {rest.length > 0 ? (
          <div className="mt-5 space-y-2" data-testid="public-service-overflow-section">
            {rest.map((svc) => (
              <button
                key={svc.id}
                type="button"
                className="w-full text-left rounded-lg border px-3 py-2 hover:border-primary/40"
                onClick={() => onSelect(svc)}
              >
                <span className="font-medium text-sm">{svc.name}</span>
                <span className="text-xs text-muted-foreground ml-2">{svc.durationMinutes} min</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  if (layout === "beauty-grid") {
    const { featured, rest } = pickFeaturedPublicServices(services, featuredServiceIds);
    const hint = featuredServicesHint(featured.length, rest.length, services.length, catalogTitle);

    return (
      <div data-testid="public-service-catalog">
        <CatalogHeading catalogTitle={catalogTitle} count={services.length} />
        <div className="beauty-service-grid">
          {featured.map((svc) => (
            <BeautyGridCard
              key={svc.id}
              svc={svc}
              vertical={vertical}
              selected={selectedServiceId === svc.id}
              onSelect={onSelect}
            />
          ))}
        </div>
        {hint ? <p className="text-xs text-center text-muted-foreground mt-4">{hint}</p> : null}
        {rest.length > 0 ? (
          <div className="mt-5 space-y-3" data-testid="public-service-overflow-section">
            <div className="flex items-baseline justify-between gap-2">
              <h4 className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
                More {catalogTitle.toLowerCase()}
              </h4>
              <span className="text-[10px] text-muted-foreground tabular-nums">{rest.length}</span>
            </div>
            <div className="beauty-service-overflow-menu space-y-3" data-testid="public-service-overflow-menu">
              {rest.map((svc) => (
                <button
                  key={svc.id}
                  type="button"
                  className={cn(
                    "public-treatment-list-card flex w-full items-center min-h-[52px] rounded-lg border border-border/80 px-2.5 py-2 text-left gap-2.5 hover:border-primary/40",
                    selectedServiceId === svc.id && "border-primary/60 ring-1 ring-primary/35",
                  )}
                  data-testid={`button-service-${svc.id}`}
                  onClick={() => onSelect(svc)}
                >
                  <PublicServiceThumb
                    serviceName={svc.name}
                    vertical={vertical}
                    imageUrl={svc.imageUrl}
                    className="h-10 w-10 rounded-md object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{svc.name}</p>
                    <p className="text-xs text-primary">
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
              <ListCatalogCard
                key={svc.id}
                svc={svc}
                vertical={vertical}
                consultBadge={consultBadge}
                onSelect={onSelect}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
