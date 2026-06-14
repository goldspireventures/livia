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
  type GuestRetailFulfillmentMode,
  type GuestRetailFulfillmentOption,
} from "@workspace/policy";
import { Minus, Plus, Loader2 } from "lucide-react";
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[min(92vh,720px)] rounded-t-2xl px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <SheetHeader className="text-left pb-2">
          <SheetTitle>Your bag</SheetTitle>
          <SheetDescription>
            {count} {count === 1 ? "item" : "items"} · {formatCurrency(subtotal, currency)}
          </SheetDescription>
        </SheetHeader>

        <ul className="space-y-3 overflow-y-auto max-h-[38vh] pr-1 -mr-1" data-testid="public-retail-cart-lines">
          {cart.lines.map((line) => (
            <li
              key={line.productId}
              className="flex items-center gap-3 rounded-lg border border-border/80 p-2.5"
            >
              <PublicRetailProductThumb
                name={line.name}
                imageUrl={line.imageUrl}
                className="h-14 w-14 shrink-0 rounded-md"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{line.name}</p>
                <p className="text-xs text-primary tabular-nums">
                  {formatCurrency(line.priceMinor, line.currency)}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
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
                <span className="text-xs font-medium tabular-nums w-5 text-center">{line.quantity}</span>
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
            </li>
          ))}
        </ul>

        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium">How should we get this to you?</p>
          <div className="grid gap-2">
            {fulfillmentOptions.map((opt) => (
              <button
                key={opt.mode}
                type="button"
                className={cn(
                  "rounded-lg border px-3 py-2.5 text-left transition-colors",
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

        <div className="mt-4 space-y-2 border-t border-border pt-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium tabular-nums">{formatCurrency(subtotal, currency)}</span>
          </div>
          {combinedAvailable && onCheckoutCombined ? (
            <Button
              type="button"
              className="w-full"
              disabled={checkoutBusy || (selectedFulfillment?.requiresAddress && !fulfillmentDetail.trim())}
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
            disabled={checkoutBusy || (selectedFulfillment?.requiresAddress && !fulfillmentDetail.trim())}
            onClick={onCheckoutRetailOnly}
            data-testid="public-cart-retail-checkout"
          >
            {checkoutBusy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Checkout bag only
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
