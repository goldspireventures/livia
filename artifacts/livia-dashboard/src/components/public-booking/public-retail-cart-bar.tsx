import { formatCurrency } from "@/lib/format";
import {
  cartCurrency,
  cartLineCount,
  cartSubtotalMinor,
  type RetailCart,
} from "@/lib/retail-cart";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function PublicRetailCartBar({
  cart,
  checkoutBusy,
  onViewBag,
  className,
}: {
  cart: RetailCart;
  checkoutBusy?: boolean;
  onViewBag: () => void;
  className?: string;
}) {
  const count = cartLineCount(cart);
  if (count === 0) return null;

  const subtotal = cartSubtotalMinor(cart);
  const currency = cartCurrency(cart);

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 border-t border-border/80 bg-background/95 backdrop-blur-md px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(0,0,0,0.12)]",
        className,
      )}
      data-testid="public-retail-cart-bar"
    >
      <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
        <button
          type="button"
          className="min-w-0 text-left"
          onClick={onViewBag}
          data-testid="public-retail-cart-view"
        >
          <p className="text-sm font-medium flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-primary shrink-0" />
            Bag · {count} {count === 1 ? "item" : "items"}
          </p>
          <p className="text-xs text-muted-foreground tabular-nums">
            {formatCurrency(subtotal, currency)} · tap to review
          </p>
        </button>
        <Button
          type="button"
          size="sm"
          disabled={checkoutBusy}
          onClick={onViewBag}
          data-testid="public-retail-cart-checkout"
        >
          {checkoutBusy ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
          View bag
        </Button>
      </div>
    </div>
  );
}
