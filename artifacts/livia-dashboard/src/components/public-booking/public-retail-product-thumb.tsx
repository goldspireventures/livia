import { useState } from "react";
import { cn } from "@/lib/utils";

function productInitial(name: string): string {
  const t = name.trim();
  return t ? t.charAt(0).toUpperCase() : "?";
}

/** Fixed-size thumbs for flex rows (cart, rail) — Tailwind only; never use grid tile CSS here. */
const COMPACT_THUMB =
  "shrink-0 rounded-lg bg-muted object-cover h-14 w-14 data-[variant=rail]:h-[3.25rem] data-[variant=rail]:w-[3.25rem]";
const COMPACT_PLACEHOLDER =
  "flex items-center justify-center border border-dashed border-border/85 bg-muted/80";

/** Retail product image — `card` uses presentation CSS inside `.public-shop-card-media` only. */
export function PublicRetailProductThumb({
  name,
  imageUrl,
  className,
  variant = "card",
}: {
  name: string;
  imageUrl?: string | null;
  className?: string;
  variant?: "card" | "compact" | "rail";
}) {
  const [failed, setFailed] = useState(false);
  const src = imageUrl?.trim();
  const isFlexThumb = variant === "compact" || variant === "rail";

  if (!src || failed) {
    return (
      <div
        data-testid="public-retail-product-thumb"
        data-variant={variant}
        className={cn(
          isFlexThumb
            ? cn(COMPACT_THUMB, COMPACT_PLACEHOLDER)
            : "public-shop-card-thumb public-shop-card-thumb--placeholder flex items-center justify-center bg-muted/80 text-muted-foreground",
          className,
        )}
        aria-hidden
      >
        <span
          className={cn(
            "font-medium select-none text-primary/70",
            isFlexThumb ? "text-sm" : "text-lg",
          )}
          style={{ fontFamily: "var(--app-font-serif)" }}
        >
          {productInitial(name)}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt=""
      data-testid="public-retail-product-thumb"
      data-variant={variant}
      className={cn(
        isFlexThumb ? COMPACT_THUMB : "public-shop-card-thumb object-cover",
        className,
      )}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
