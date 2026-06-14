import { useMemo, useState } from "react";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Minus, Plus } from "lucide-react";
import { PublicRetailProductThumb } from "@/components/public-booking/public-retail-product-thumb";

export type PublicRetailProduct = {
  id: string;
  name: string;
  description?: string | null;
  priceMinor: number;
  currency: string;
  category?: string | null;
  imageUrl?: string | null;
  stockQuantity?: number | null;
  inStock?: boolean;
};

type ShopCardLayout = "tile" | "rail";

function stockHint(p: PublicRetailProduct): string | null {
  if (p.inStock === false) return "Sold out";
  if (p.stockQuantity != null && p.stockQuantity <= 3) return `${p.stockQuantity} left`;
  return null;
}

function ProductCard({
  product: p,
  cartQty,
  onAddToBag,
  onChangeQty,
  layout,
}: {
  product: PublicRetailProduct;
  cartQty: number;
  onAddToBag: (product: PublicRetailProduct) => void;
  onChangeQty: (productId: string, quantity: number) => void;
  layout: ShopCardLayout;
}) {
  const hint = stockHint(p);
  const inBag = cartQty > 0;
  const soldOut = p.inStock === false;

  const bagControls = (
    <div className="flex items-center gap-1 shrink-0">
      {inBag ? (
        <>
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="h-8 w-8"
            aria-label={`Remove one ${p.name}`}
            onClick={() => onChangeQty(p.id, cartQty - 1)}
            data-testid={`cart-dec-${p.id}`}
          >
            <Minus className="h-3.5 w-3.5" />
          </Button>
          <span className="text-xs font-medium tabular-nums w-5 text-center" data-testid={`cart-qty-${p.id}`}>
            {cartQty}
          </span>
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="h-8 w-8"
            aria-label={`Add one ${p.name}`}
            disabled={
              soldOut ||
              (p.stockQuantity != null && cartQty >= p.stockQuantity)
            }
            onClick={() => onChangeQty(p.id, cartQty + 1)}
            data-testid={`cart-inc-${p.id}`}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </>
      ) : (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="text-xs h-8"
          disabled={soldOut}
          onClick={() => onAddToBag(p)}
          data-testid={`add-retail-${p.id}`}
        >
          {soldOut ? "Sold out" : "Add to bag"}
        </Button>
      )}
    </div>
  );

  if (layout === "rail") {
    return (
      <li className="public-shop-card public-shop-card--rail" data-testid={`public-shop-item-${p.id}`}>
        <PublicRetailProductThumb
          name={p.name}
          imageUrl={p.imageUrl}
          className="public-shop-card-thumb--rail shrink-0"
        />
        <div className="public-shop-card-rail-body min-w-0 flex-1">
          <p
            className="public-shop-card-title text-sm font-medium leading-snug line-clamp-2"
            style={{ fontFamily: "var(--app-font-serif)" }}
          >
            {p.name}
          </p>
          <p className="text-xs text-primary tabular-nums mt-0.5">
            {formatCurrency(p.priceMinor, p.currency)}
          </p>
          {hint ? <p className="text-[10px] text-muted-foreground mt-0.5">{hint}</p> : null}
        </div>
        {bagControls}
      </li>
    );
  }

  return (
    <li
      className={cn(
        "public-shop-card public-shop-card--tile beauty-service-card beauty-treatment-card",
      )}
      data-testid={`public-shop-item-${p.id}`}
    >
      <div className="public-shop-card-media relative">
        <PublicRetailProductThumb name={p.name} imageUrl={p.imageUrl} />
        {hint ? (
          <span className="public-shop-card-badge absolute top-2 right-2 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-medium text-muted-foreground border border-border/70">
            {hint}
          </span>
        ) : null}
      </div>
      <div className="public-shop-card-body">
        {p.category ? <p className="public-shop-card-category">{p.category}</p> : null}
        <p className="public-shop-card-title" style={{ fontFamily: "var(--app-font-serif)" }}>
          {p.name}
        </p>
        {p.description ? <p className="public-shop-card-desc">{p.description}</p> : null}
        <div className="public-shop-card-footer">
          <p className="public-shop-card-price tabular-nums">
            {formatCurrency(p.priceMinor, p.currency)}
          </p>
          {bagControls}
        </div>
      </div>
    </li>
  );
}

export function PublicBeautyShop({
  title,
  products,
  cartQtyForProduct,
  onAddToBag,
  onChangeQty,
  variant = "inline",
  initialVisible,
}: {
  title: string;
  products: PublicRetailProduct[];
  cartQtyForProduct: (productId: string) => number;
  onAddToBag: (product: PublicRetailProduct) => void;
  onChangeQty: (productId: string, quantity: number) => void;
  variant?: "inline" | "storefront";
  initialVisible?: number;
}) {
  const [showAll, setShowAll] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    for (const p of products) {
      cats.add(p.category?.trim() || "Products");
    }
    return [...cats].sort((a, b) => a.localeCompare(b));
  }, [products]);

  const filtered = useMemo(() => {
    if (!activeCategory) return products;
    return products.filter((p) => (p.category?.trim() || "Products") === activeCategory);
  }, [products, activeCategory]);

  const isStorefront = variant === "storefront";
  const cardLayout: ShopCardLayout = "tile";
  const previewLimit = initialVisible ?? (isStorefront ? 8 : products.length);
  const visible =
    showAll || filtered.length <= previewLimit ? filtered : filtered.slice(0, previewLimit);
  const hiddenCount = Math.max(0, filtered.length - visible.length);

  if (products.length === 0) return null;

  return (
    <section
      className={cn(isStorefront ? "public-book-shop-section" : "public-book-shop-rail")}
      data-testid="public-beauty-shop"
    >
      <div className="flex flex-wrap items-end justify-between gap-2 mb-3">
        <h3
          className={cn(
            "font-medium text-muted-foreground",
            isStorefront ? "text-sm uppercase tracking-widest" : "text-xs uppercase tracking-widest",
          )}
          style={isStorefront ? { fontFamily: "var(--app-font-serif)" } : undefined}
        >
          {title}
        </h3>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground tabular-nums">
          {products.length} {products.length === 1 ? "item" : "items"}
        </span>
      </div>

      {categories.length > 1 ? (
        <div className="flex flex-wrap gap-1.5 mb-3" data-testid="public-shop-categories">
          <button
            type="button"
            onClick={() => setActiveCategory(null)}
            className={cn(
              "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
              activeCategory == null
                ? "border-primary/50 bg-primary/10"
                : "border-border/80 text-muted-foreground hover:border-primary/30",
            )}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                activeCategory === cat
                  ? "border-primary/50 bg-primary/10"
                  : "border-border/80 text-muted-foreground hover:border-primary/30",
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      ) : null}

      <ul
        className={cn(
          "public-shop-grid beauty-service-grid public-service-catalog-grid",
          isStorefront && "public-shop-grid--tiles",
        )}
      >
        {visible.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            cartQty={cartQtyForProduct(p.id)}
            onAddToBag={onAddToBag}
            onChangeQty={onChangeQty}
            layout={cardLayout}
          />
        ))}
      </ul>

      {hiddenCount > 0 ? (
        <div className="mt-3 text-center">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => setShowAll(true)}
            data-testid="public-shop-show-all"
          >
            Show all {filtered.length} products
          </Button>
        </div>
      ) : null}
    </section>
  );
}
