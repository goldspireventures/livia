import { useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { EventDaySheet } from "@/lib/event-vendor-studio";
import { Link2, Unlink, X } from "lucide-react";

type EnquiryOption = {
  id: string;
  contactName: string;
  contactEmail?: string | null;
  eventType?: string | null;
  eventDate?: string | null;
  status?: string;
};

type CustomerOption = {
  id: string;
  displayName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
};

type Props = {
  disabled?: boolean;
  enquiryId?: string | null;
  enquiry?: EnquiryOption | null;
  enquiries?: EnquiryOption[];
  sheet: EventDaySheet | null | undefined;
  customers: CustomerOption[];
  onChange: (patch: {
    enquiryId?: string | null;
    customerId?: string | null;
    eventDaySheet: EventDaySheet;
    enquiry?: EnquiryOption | null;
  }) => void;
};

function customerLabel(c: CustomerOption): string {
  return (
    c.displayName?.trim() ||
    [c.firstName, c.lastName].filter(Boolean).join(" ") ||
    c.email ||
    "Client"
  );
}

/** Bill To — link to an inbox lead inline; no redirect to inbox. */
export function QuoteBillToPanel({
  disabled,
  enquiryId,
  enquiry,
  enquiries = [],
  sheet,
  customers,
  onChange,
}: Props) {
  const merged: EventDaySheet = sheet ?? {};
  const linkedLead = enquiryId && enquiry;
  const [linkOpen, setLinkOpen] = useState(false);
  const [leadSearch, setLeadSearch] = useState("");

  const filteredLeads = useMemo(() => {
    const q = leadSearch.trim().toLowerCase();
    if (!q) return enquiries.slice(0, 12);
    return enquiries
      .filter(
        (e) =>
          e.contactName.toLowerCase().includes(q) ||
          (e.eventType?.toLowerCase().includes(q) ?? false) ||
          (e.eventDate?.includes(q) ?? false),
      )
      .slice(0, 12);
  }, [enquiries, leadSearch]);

  function linkEnquiry(e: EnquiryOption) {
    onChange({
      enquiryId: e.id,
      customerId: null,
      enquiry: e,
      eventDaySheet: {
        ...merged,
        billToName: e.contactName,
        billToEmail: e.contactEmail ?? merged.billToEmail,
        eventType: e.eventType ?? merged.eventType,
        eventDate: e.eventDate ?? merged.eventDate,
      },
    });
    setLinkOpen(false);
    setLeadSearch("");
  }

  function unlinkEnquiry() {
    onChange({
      enquiryId: null,
      enquiry: null,
      eventDaySheet: merged,
    });
  }

  if (linkedLead) {
    return (
      <div className="rounded-lg border bg-muted/20 p-3 space-y-2" data-testid="quote-bill-to-linked">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground">Bill to</p>
          {!disabled ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-6 text-[10px] px-2 text-muted-foreground"
              onClick={unlinkEnquiry}
            >
              <Unlink className="h-3 w-3 mr-1" />
              Unlink
            </Button>
          ) : null}
        </div>
        <div>
          <p className="font-medium text-sm">{enquiry.contactName}</p>
          {enquiry.eventType ? (
            <p className="text-xs text-muted-foreground">{enquiry.eventType}</p>
          ) : null}
          {enquiry.eventDate ? (
            <p className="text-xs text-muted-foreground">{enquiry.eventDate}</p>
          ) : null}
          {(merged.billToEmail ?? enquiry.contactEmail) ? (
            <p className="text-[11px] text-muted-foreground mt-1">{merged.billToEmail ?? enquiry.contactEmail}</p>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-muted/20 p-3 space-y-3" data-testid="quote-bill-to-panel">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground">Bill to</p>
        {!disabled && enquiries.length > 0 ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => setLinkOpen((v) => !v)}
          >
            <Link2 className="h-3 w-3 mr-1" />
            {linkOpen ? "Close" : "Link to enquiry"}
          </Button>
        ) : null}
      </div>

      {!disabled && linkOpen && enquiries.length > 0 ? (
        <div className="rounded-md border bg-background p-2 space-y-2" data-testid="quote-lead-picker">
          <div className="flex gap-2">
            <Input
              value={leadSearch}
              onChange={(e) => setLeadSearch(e.target.value)}
              placeholder="Search by name, event, or date…"
              className="h-8 text-xs flex-1"
              autoFocus
            />
            <Button type="button" size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => setLinkOpen(false)}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
          <ul className="max-h-40 overflow-y-auto divide-y rounded-md border">
            {filteredLeads.length === 0 ? (
              <li className="px-2 py-3 text-xs text-muted-foreground text-center">No matching enquiries</li>
            ) : (
              filteredLeads.map((e) => (
                <li key={e.id}>
                  <button
                    type="button"
                    className="w-full text-left px-2 py-2 hover:bg-muted/50 transition-colors text-xs"
                    onClick={() => linkEnquiry(e)}
                  >
                    <span className="font-medium block truncate">{e.contactName}</span>
                    <span className="text-muted-foreground">
                      {[e.eventType, e.eventDate].filter(Boolean).join(" · ") || "Enquiry"}
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}

      {!disabled && customers.length > 0 ? (
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Or pick a saved client</Label>
          <Select
            onValueChange={(id) => {
              const c = customers.find((x) => x.id === id);
              onChange({
                enquiryId: null,
                customerId: id,
                enquiry: null,
                eventDaySheet: {
                  ...merged,
                  billToName: c ? customerLabel(c) : merged.billToName,
                  billToEmail: c?.email ?? merged.billToEmail,
                },
              });
            }}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Choose client…" />
            </SelectTrigger>
            <SelectContent>
              {customers.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {customerLabel(c)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="bill-to-name" className="text-xs">
            Name
          </Label>
          <Input
            id="bill-to-name"
            value={merged.billToName ?? ""}
            onChange={(e) =>
              onChange({
                enquiryId: null,
                customerId: null,
                enquiry: null,
                eventDaySheet: { ...merged, billToName: e.target.value },
              })
            }
            placeholder="Client or couple name"
            disabled={disabled}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="bill-to-email" className="text-xs">
            Email
          </Label>
          <Input
            id="bill-to-email"
            type="email"
            value={merged.billToEmail ?? ""}
            onChange={(e) =>
              onChange({
                eventDaySheet: { ...merged, billToEmail: e.target.value },
              })
            }
            placeholder="For send by email"
            disabled={disabled}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="bill-to-phone" className="text-xs">
            Phone
          </Label>
          <Input
            id="bill-to-phone"
            value={merged.billToPhone ?? ""}
            onChange={(e) =>
              onChange({
                eventDaySheet: { ...merged, billToPhone: e.target.value },
              })
            }
            placeholder="Optional — WhatsApp"
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
}
