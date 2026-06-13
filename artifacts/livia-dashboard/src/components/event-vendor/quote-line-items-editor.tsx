import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { eur, recalcQuoteTotals } from "@/lib/event-vendor-studio";
import { Plus, Trash2 } from "lucide-react";

export type EditableQuoteLine = {
  id: string;
  name: string;
  quantity: string;
  unit: string;
  unitPriceMinor: number;
  lineTotalMinor: number;
};

type CatalogueItem = {
  id: string;
  name: string;
  priceMinor: number;
  quoteUnit?: string | null;
};

type Props = {
  lines: EditableQuoteLine[];
  depositPercent: number;
  disabled?: boolean;
  catalogue: CatalogueItem[];
  onChange: (next: {
    lines: EditableQuoteLine[];
    subtotalMinor: number;
    depositAmountMinor: number;
    balanceDueMinor: number;
  }) => void;
};

/** Line items from catalogue — qty only; unit & price live in services. */
export function QuoteLineItemsEditor({
  lines,
  depositPercent,
  disabled,
  catalogue,
  onChange,
}: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [catalogueSearch, setCatalogueSearch] = useState("");

  const filteredCatalogue = useMemo(() => {
    const q = catalogueSearch.trim().toLowerCase();
    if (!q) return catalogue;
    return catalogue.filter((s) => s.name.toLowerCase().includes(q));
  }, [catalogue, catalogueSearch]);

  function applyLines(nextLines: EditableQuoteLine[]) {
    const totals = recalcQuoteTotals(nextLines, depositPercent);
    onChange({
      lines: totals.lines,
      subtotalMinor: totals.subtotalMinor,
      depositAmountMinor: totals.depositAmountMinor,
      balanceDueMinor: totals.balanceDueMinor,
    });
  }

  function updateQty(i: number, quantity: string) {
    const next = [...lines];
    const qty = Number(quantity) || 0;
    next[i] = {
      ...next[i],
      quantity,
      lineTotalMinor: Math.round(qty * next[i].unitPriceMinor),
    };
    applyLines(next);
  }

  function removeLine(i: number) {
    applyLines(lines.filter((_, j) => j !== i));
  }

  function addFromCatalogue(serviceId: string) {
    const svc = catalogue.find((s) => s.id === serviceId);
    if (!svc) return;
    applyLines([
      ...lines,
      {
        id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: svc.name,
        unit: svc.quoteUnit ?? "flat",
        unitPriceMinor: svc.priceMinor,
        quantity: "1",
        lineTotalMinor: svc.priceMinor,
      },
    ]);
    setPickerOpen(false);
    setCatalogueSearch("");
  }

  return (
    <div className="space-y-3" data-testid="quote-line-items-editor">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Line items</p>
        </div>
        {!disabled && catalogue.length > 0 ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 text-xs"
            onClick={() => setPickerOpen(true)}
          >
            <Plus className="h-3 w-3 mr-1" />
            Add from catalogue
          </Button>
        ) : null}
      </div>

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
          <DialogTitle>Add from catalogue</DialogTitle>
          </DialogHeader>
          <Input
            value={catalogueSearch}
            onChange={(e) => setCatalogueSearch(e.target.value)}
            placeholder="Search services…"
            className="h-9"
            autoFocus
            data-testid="catalogue-search"
          />
          <ul className="max-h-56 overflow-y-auto divide-y rounded-md border">
            {filteredCatalogue.length === 0 ? (
              <li className="px-3 py-4 text-sm text-muted-foreground text-center">No matching services</li>
            ) : (
              filteredCatalogue.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2.5 hover:bg-muted/50 transition-colors text-sm flex justify-between gap-3"
                    onClick={() => addFromCatalogue(s.id)}
                  >
                    <span className="font-medium truncate">{s.name}</span>
                    <span className="text-muted-foreground tabular-nums shrink-0">{eur(s.priceMinor)}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </DialogContent>
      </Dialog>

      {lines.length === 0 ? (
        <p className="text-sm text-muted-foreground rounded-lg border border-dashed p-4 text-center">
          {catalogue.length > 0
            ? "Add services from your catalogue to build this quote."
            : "Add services in Catalogue first — unit and price are set there."}
        </p>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <div className="hidden sm:grid grid-cols-[1fr_5rem_6rem_6rem_2rem] gap-2 px-3 py-2 bg-muted/40 text-[10px] uppercase tracking-wide font-medium text-muted-foreground">
            <span>Item</span>
            <span className="text-right">Qty</span>
            <span className="text-right">Unit price</span>
            <span className="text-right">Total</span>
            <span />
          </div>
          <ul className="divide-y">
            {lines.map((line, i) => (
              <li
                key={line.id}
                className="grid grid-cols-1 sm:grid-cols-[1fr_5rem_6rem_6rem_2rem] gap-2 px-3 py-2.5 items-center"
              >
                <p className="text-sm font-medium truncate">{line.name}</p>
                <div className="space-y-0.5 sm:space-y-0">
                  <Label className="text-[10px] uppercase text-muted-foreground sm:sr-only">Qty</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={line.quantity}
                    disabled={disabled}
                    onChange={(e) => updateQty(i, e.target.value)}
                    className="h-8 text-sm tabular-nums text-right"
                  />
                </div>
                <p className="text-sm tabular-nums text-right text-muted-foreground">{eur(line.unitPriceMinor)}</p>
                <p className="text-sm font-semibold tabular-nums text-right">{eur(line.lineTotalMinor)}</p>
                {!disabled ? (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive hover:text-destructive justify-self-end"
                    onClick={() => removeLine(i)}
                    aria-label="Remove line"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                ) : (
                  <span />
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
