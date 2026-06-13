import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { QuoteInvoicePreview } from "@/components/event-vendor/quote-invoice-preview";
import type { EventDaySheet } from "@/lib/event-vendor-studio";
import { Download, Mail, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";

type Milestone = { label: string; percent: number; amountMinor: number; dueDate?: string };

type PreviewLine = {
  name: string;
  quantity: string;
  unit: string;
  unitPriceMinor: number;
  lineTotalMinor: number;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessName: string;
  logoUrl?: string | null;
  clientName?: string | null;
  clientEmail?: string | null;
  quoteRef?: string | null;
  status: string;
  personalMessage?: string | null;
  lines: PreviewLine[];
  subtotalMinor: number;
  depositAmountMinor: number;
  balanceDueMinor: number;
  depositPercent: number;
  validUntil?: string | null;
  eventDaySheet?: EventDaySheet | null;
  pdfHref?: string | null;
  clientPayUrl?: string | null;
  publicToken?: string | null;
  onSendEmail: () => void | Promise<void>;
  onSendWhatsApp: () => void | Promise<void>;
  sending?: boolean;
};

/** Step-through invoice review — send & download only appear after operator confirms preview. */
export function QuoteSendReviewDialog({
  open,
  onOpenChange,
  businessName,
  logoUrl,
  clientName,
  clientEmail,
  quoteRef,
  status,
  personalMessage,
  lines,
  subtotalMinor,
  depositAmountMinor,
  balanceDueMinor,
  depositPercent,
  validUntil,
  eventDaySheet,
  pdfHref,
  clientPayUrl,
  publicToken,
  onSendEmail,
  onSendWhatsApp,
  sending,
}: Props) {
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (!open) setConfirmed(false);
  }, [open]);

  const isDraft = status === "draft";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto p-0 gap-0">
        <DialogHeader className="px-5 pt-5 pb-2">
          <DialogTitle>{isDraft ? "Review before you send" : "Invoice preview"}</DialogTitle>
        </DialogHeader>

        <div className="px-5 pb-5 space-y-4">
          <QuoteInvoicePreview
            businessName={businessName}
            logoUrl={logoUrl}
            clientName={clientName}
            clientEmail={clientEmail}
            quoteRef={quoteRef}
            status={status}
            personalMessage={personalMessage}
            lines={lines}
            subtotalMinor={subtotalMinor}
            depositAmountMinor={depositAmountMinor}
            balanceDueMinor={balanceDueMinor}
            depositPercent={depositPercent}
            validUntil={validUntil}
            eventDaySheet={eventDaySheet}
            clientPayUrl={clientPayUrl}
            publicToken={publicToken}
          />

          {isDraft && !confirmed ? (
            <Button
              type="button"
              className="w-full"
              onClick={() => setConfirmed(true)}
              data-testid="quote-preview-confirm"
            >
              Looks good — show send options
            </Button>
          ) : null}

          {(confirmed || !isDraft) ? (
            <div className="space-y-2 pt-1 border-t" data-testid="quote-send-actions">
              {isDraft ? (
                <>
                  <Button
                    type="button"
                    className="w-full"
                    disabled={sending}
                    onClick={() => void onSendEmail()}
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Send by email
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={sending}
                    onClick={() => void onSendWhatsApp()}
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Copy WhatsApp message
                  </Button>
                </>
              ) : null}
              {pdfHref ? (
                <Button type="button" variant="outline" className="w-full" asChild>
                  <a href={pdfHref} target="_blank" rel="noopener noreferrer">
                    <Download className="mr-2 h-4 w-4" />
                    Download invoice PDF
                  </a>
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
