import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TENANT_RETAIL_PROGRAM } from "@workspace/policy";
import { majorFromMinor, minorFromMajor } from "@/lib/format";
import { RetailProductImageField } from "@/components/beauty/retail-product-image-field";

export type RetailProductEditRow = {
  id: string;
  name: string;
  description?: string | null;
  priceMinor: number;
  currency: string;
  sku?: string | null;
  category?: string | null;
  imageUrl?: string | null;
  stockQuantity?: number | null;
  soldQuantity?: number | null;
  isActive?: boolean;
};

export function BeautyRetailProductEditor({
  open,
  product,
  businessId,
  currency,
  categories = ["Other"],
  busy,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  product: RetailProductEditRow | null;
  businessId: string;
  currency: string;
  categories?: readonly string[];
  busy?: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (patch: {
    name: string;
    description?: string;
    priceMinor: number;
    sku?: string;
    category?: string;
    imageUrl?: string | null;
    stockQuantity?: number | null;
  }) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priceMajor, setPriceMajor] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState(categories[0] ?? "Other");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [stockInput, setStockInput] = useState("");

  useEffect(() => {
    if (!product) return;
    setName(product.name);
    setDescription(product.description ?? "");
    setPriceMajor(String(majorFromMinor(product.priceMinor)));
    setSku(product.sku ?? "");
    setCategory(product.category ?? categories[0] ?? "Other");
    setImageUrl(product.imageUrl ?? null);
    setStockInput(product.stockQuantity != null ? String(product.stockQuantity) : "");
  }, [product]);

  async function submit() {
    if (!product || !name.trim() || !priceMajor) return;
    const stockQuantity =
      stockInput.trim() === "" ? null : Math.max(0, Math.floor(Number(stockInput)));
    await onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      priceMinor: minorFromMajor(Number(priceMajor)),
      sku: sku.trim() || undefined,
      category,
      imageUrl,
      stockQuantity: Number.isFinite(stockQuantity) ? stockQuantity : null,
    });
    onOpenChange(false);
  }

  const sold = product?.soldQuantity ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" data-testid="beauty-retail-product-editor">
        <DialogHeader>
          <DialogTitle>Edit product</DialogTitle>
          <DialogDescription>Changes apply on /b as soon as you save.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <RetailProductImageField
            businessId={businessId}
            productId={product?.id}
            imageUrl={imageUrl}
            disabled={busy}
            onChange={setImageUrl}
          />
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={name} disabled={busy} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              rows={2}
              disabled={busy}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Price ({currency})</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={priceMajor}
                disabled={busy}
                onChange={(e) => setPriceMajor(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                value={category}
                disabled={busy}
                onChange={(e) => setCategory(e.target.value)}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>In stock</Label>
              <Input
                type="number"
                min={0}
                step={1}
                placeholder="Unlimited"
                value={stockInput}
                disabled={busy}
                onChange={(e) => setStockInput(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">{TENANT_RETAIL_PROGRAM.inventoryHint}</p>
            </div>
            <div className="space-y-2">
              <Label>Sold (Liv tracked)</Label>
              <p className="text-sm font-medium tabular-nums pt-2">{sold}</p>
              <p className="text-[11px] text-muted-foreground">Updates when guests pay.</p>
            </div>
          </div>
          <div className="space-y-2">
            <Label>SKU (optional)</Label>
            <Input value={sku} disabled={busy} onChange={(e) => setSku(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={busy || !name.trim() || !priceMajor} onClick={() => void submit()}>
            Save product
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
