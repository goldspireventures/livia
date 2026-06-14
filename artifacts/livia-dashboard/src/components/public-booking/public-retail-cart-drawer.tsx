import { formatCurrency } from "@/lib/format";
import {
  cartCurrency,
  cartLineCount,
  cartSubtotalMinor,
  type RetailCart,
} from "@/lib/retail-cart";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { PublicRetailProductThumb } from "@/components/public-booking/public-retail-product-thumb";
import {
  guestRetailFulfillmentDetailHint,
  guestRetailFulfillmentLabel,
  type GuestRetailFulfillmentMode,
  type GuestRetailFulfillmentOption,
} from "@workspace/policy";
import { Minus, Plus, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function PublicRetailCartDrawer({
  open,
  onOpenChange,
  cart,
  fulfillmentOptions,
  fulfillmentMode,
  onFulfillmentModeChange,
  fulfillmentDetail,
  onFulfillmentDetailChange,
  onChangeQty,
  checkoutBusy,
  onCheckoutRetailOnly,
  onCheckoutCombined,
  combinedAvailable,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cart: RetailCart;
  fulfillmentOptions: readonly GuestRetailFulfillmentOption[];
  fulfillmentMode: GuestRetailFulfillmentMode;
  onFulfillmentModeChange: (mode: GuestRetailFulfillmentMode) => void;
  fulfillmentDetail: string;
  onFulfillmentDetailChange: (value: string) => void;
  onChangeQty: (productId: string, quantity: number) => void;
  checkoutBusy?: boolean;
  onCheckoutRetailOnly: () => void;
  onCheckoutCombined?: () => void;
  combinedAvailable?: boolean;
}) {
  const count = cartLineCount(cart);
  const subtotal = cartSubtotalMinor(cart);
  const currency = cartCurrency(cart);
  const selectedFulfillment = fulfillmentOptions.find((o) => o.mode === fulfillmentMode);
  const detailHint = guestRetailFulfillmentDetailHint(fulfillmentMode);
  const checkoutBlocked =
    checkoutBusy || (selectedFulfillment?.requiresAddress && !fulfillmentDetail.trim());

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="flex max-h-[min(92vh,720px)] flex-col overflow-hidden rounded-t-2xl px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-6"
      >
        <SheetHeader className="shrink-0 text-left pb-3">
          <SheetTitle>Your bag</SheetTitle>
          <SheetDescription>
            {count} {count === 1 ? "item" : "items"} · {formatCurrency(subtotal, currency)}
          </SheetDescription>
        </SheetHeader>

        <ul
          className="min-h-0 flex-1 space-y-2 overflow-y-auto overflow-x-hidden overscroll-contain pr-1"
          data-testid="public-retail-cart-lines"
        >
          {cart.lines.map((line) => (
            <li
              key={line.productId}
              className="flex items-center gap-3 rounded-lg border border-border/80 bg-card/50 p-2.5"
              data-testid={`public-cart-line-${line.productId}`}
            >
              <PublicRetailProductThumb
                name={line.name}
                imageUrl={line.imageUrl}
                variant="compact"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium leading-snug line-clamp-2">{line.name}</p>
                <p className="text-xs text-muted-foreground tabular-nums mt-0.5">
                  {formatCurrency(line.priceMinor, line.currency)} each
                </p>
                <p className="text-xs font-medium text-primary tabular-nums mt-0.5">
                  {formatCurrency(line.priceMinor * line.quantity, line.currency)}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="h-8 w-8"
                    aria-label={`Remove one ${line.name}`}
                    onClick={() => onChangeQty(line.productId, line.quantity - 1)}
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                  <span
                    className="text-sm font-medium tabular-nums w-6 text-center"
                    data-testid={`public-cart-qty-${line.productId}`}
                  >
                    {line.quantity}
                  </span>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="h-8 w-8"
                    aria-label={`Add one ${line.name}`}
                    onClick={() => onChangeQty(line.productId, line.quantity + 1)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-muted-foreground"
                  aria-label={`Remove ${line.name} from bag`}
                  onClick={() => onChangeQty(line.productId, 0)}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Remove
                </Button>
              </div>
            </li>
          ))}
        </ul>

        <div className="shrink-0 mt-3 space-y-2 overflow-x-hidden">
          <p className="text-sm font-medium">How should we get this to you?</p>
          <div className="grid gap-2">
            {fulfillmentOptions.map((opt) => (
              <button
                key={opt.mode}
                type="button"
                className={cn(
                  "w-full rounded-lg border px-3 py-2.5 text-left transition-colors",
                  fulfillmentMode === opt.mode
                    ? "border-primary bg-primary/5"
                    : "border-border/80 hover:border-primary/30",
                )}
                onClick={() => onFulfillmentModeChange(opt.mode)}
                data-testid={`fulfillment-${opt.mode}`}
              >
                <p className="text-sm font-medium">{opt.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{opt.description}</p>
              </button>
            ))}
          </div>
          {selectedFulfillment ? (
            <Textarea
              value={fulfillmentDetail}
              onChange={(e) => onFulfillmentDetailChange(e.target.value)}
              placeholder={detailHint}
              rows={2}
              className="resize-none text-sm"
              data-testid="fulfillment-detail"
            />
          ) : null}
        </div>

        <div className="shrink-0 mt-4 space-y-2 border-t border-border pt-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium tabular-nums">{formatCurrency(subtotal, currency)}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {guestRetailFulfillmentLabel(fulfillmentMode)}
            {fulfillmentDetail.trim() ? ` · ${fulfillmentDetail.trim()}` : null}
          </p>
          {combinedAvailable && onCheckoutCombined ? (
            <Button
              type="button"
              className="w-full"
              disabled={checkoutBlocked}
              onClick={onCheckoutCombined}
              data-testid="public-cart-combined-checkout"
            >
              {checkoutBusy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Pay deposit + bag together
            </Button>
          ) : null}
          <Button
            type="button"
            variant={combinedAvailable ? "outline" : "default"}
            className="w-full"
            disabled={checkoutBlocked}
            onClick={onCheckoutRetailOnly}
            data-testid="public-cart-retail-checkout"
          >
            {checkoutBusy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Checkout bag
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
