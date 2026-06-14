import { Copy } from "lucide-react";
import { formatStudioQuoteRef, quotePaymentReference } from "@workspace/policy";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Props = {
  publicToken: string;
  className?: string;
  /** heading = quote detail title; inline = compact mono ref */
  variant?: "heading" | "inline";
};

/** One-tap copy for quote payment reference — no double-click or text selection. */
export function QuoteRefCopy({ publicToken, className, variant = "heading" }: Props) {
  const { toast } = useToast();
  const label = formatStudioQuoteRef(publicToken);
  const payRef = quotePaymentReference(publicToken);

  async function copy() {
    try {
      await navigator.clipboard.writeText(payRef);
      toast({ title: "Quote ref copied", description: payRef });
    } catch {
      toast({ title: "Could not copy", variant: "destructive" });
    }
  }

  return (
    <button
      type="button"
      onClick={() => void copy()}
      className={cn(
        "group inline-flex items-center gap-1.5 rounded-md text-left transition-colors",
        "hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        variant === "heading" ? "font-semibold px-1 -mx-1 py-0.5" : "font-mono text-xs px-1.5 py-0.5",
        className,
      )}
      title="Tap to copy quote ref"
      data-testid="quote-ref-copy"
    >
      <span>{variant === "inline" ? payRef : label}</span>
      <Copy className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-60 group-hover:opacity-100" aria-hidden />
    </button>
  );
}
