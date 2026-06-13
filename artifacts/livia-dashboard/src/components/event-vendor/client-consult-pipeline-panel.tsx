import { useEffect, useState } from "react";
import { Link } from "wouter";
import { customFetch } from "@workspace/api-client-react";
import { consultInboxLeadHref } from "@workspace/policy";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ClipboardList, FileText } from "lucide-react";
import { ENQUIRY_STATUSES, eur, statusMeta } from "@/lib/event-vendor-studio";

type EnquiryRow = {
  id: string;
  status: string;
  eventType?: string | null;
  eventDate?: string | null;
  guestCount?: number | null;
  theme?: string | null;
  createdAt?: string;
};

type QuoteRow = {
  id: string;
  enquiryId?: string | null;
  status: string;
  subtotalMinor: number;
};

/** Consult-first client card — enquiries and quotes, not visit/rebook relationship. */
export function ClientConsultPipelinePanel({
  businessId,
  customerId,
}: {
  businessId: string;
  customerId: string;
}) {
  const [enquiries, setEnquiries] = useState<EnquiryRow[]>([]);
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!businessId || !customerId) return;
    setLoading(true);
    Promise.all([
      customFetch<EnquiryRow[]>(
        `/api/businesses/${businessId}/enquiries?customerId=${encodeURIComponent(customerId)}`,
      ),
      customFetch<QuoteRow[]>(`/api/businesses/${businessId}/quotes`),
    ])
      .then(([enq, qList]) => {
        setEnquiries(enq);
        const enquiryIds = new Set(enq.map((e) => e.id));
        setQuotes(qList.filter((q) => q.enquiryId && enquiryIds.has(q.enquiryId)));
      })
      .catch(() => {
        setEnquiries([]);
        setQuotes([]);
      })
      .finally(() => setLoading(false));
  }, [businessId, customerId]);

  const quoteByEnquiry = new Map(quotes.map((q) => [q.enquiryId!, q]));

  return (
    <Card data-testid="client-consult-pipeline-panel">
      <CardContent className="pt-5 space-y-3">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-medium">Client pipeline</h3>
        </div>
        <p className="text-xs text-muted-foreground leading-snug">
          Enquiries and quotes for this client.
        </p>

        {loading ? (
          <p className="text-xs text-muted-foreground">Loading pipeline…</p>
        ) : enquiries.length === 0 ? (
          <p className="text-sm text-muted-foreground">No enquiries yet.</p>
        ) : (
          <ul className="space-y-2">
            {enquiries.map((enq) => {
              const meta = statusMeta(ENQUIRY_STATUSES, enq.status);
              const quote = quoteByEnquiry.get(enq.id);
              return (
                <li key={enq.id} className="rounded-lg border p-3 space-y-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">
                        {enq.eventType ?? "Event enquiry"}
                        {enq.eventDate ? ` · ${enq.eventDate}` : ""}
                      </p>
                      {enq.theme ? (
                        <p className="text-xs text-muted-foreground">{enq.theme}</p>
                      ) : null}
                      {enq.guestCount ? (
                        <p className="text-xs text-muted-foreground">{enq.guestCount} guests</p>
                      ) : null}
                    </div>
                    <Badge variant="secondary" className="text-[10px] uppercase shrink-0">
                      {meta?.label ?? enq.status}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" asChild>
                      <Link href={consultInboxLeadHref(enq.id)}>Open lead</Link>
                    </Button>
                    {quote ? (
                      <Button size="sm" variant="ghost" asChild>
                        <Link href={`/quotes?id=${quote.id}`}>
                          <FileText className="h-3 w-3 mr-1" />
                          Quote {eur(quote.subtotalMinor)} · {quote.status}
                        </Link>
                      </Button>
                    ) : enq.status === "new" ? (
                      <Button size="sm" variant="ghost" asChild>
                        <Link href={consultInboxLeadHref(enq.id)}>Draft quote</Link>
                      </Button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
