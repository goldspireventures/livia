import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, ExternalLink, Globe } from "lucide-react";
import { publicBookingUrl, publicEventVendorSiteUrl } from "@/lib/surface-urls";
import { clientGuestBookHref } from "@/lib/guest-book-url";

type Props = {
  slug: string;
  businessName?: string;
  onCopy?: () => void;
  compact?: boolean;
  showPreviewLink?: boolean;
  /** event-vendors use /e/ website, not /book/ */
  vertical?: string | null;
};

export function PublicBookLinkCard({
  slug,
  businessName,
  onCopy,
  compact,
  showPreviewLink = true,
  vertical,
}: Props) {
  const isEventVendor = vertical === "event-vendors";
  const absolute = isEventVendor ? publicEventVendorSiteUrl(slug) : publicBookingUrl(slug);
  const previewPath = isEventVendor ? `/e/${slug}` : clientGuestBookHref(slug);
  const displayLabel = import.meta.env.DEV
    ? previewPath
    : `${slug}.livia-hq.com`;
  const linkLabel = isEventVendor ? "Public website" : "Guest book page";
  const copyAria = isEventVendor ? "Copy website link" : "Copy booking link";
  const previewAria = isEventVendor ? "Open website" : "Open booking page";

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(absolute);
      onCopy?.();
    } catch {
      /* caller may toast */
    }
  }

  if (compact) {
    return (
      <div
        className="flex items-center gap-2 rounded-lg border border-border/80 bg-muted/30 px-3 py-2.5"
        data-testid="public-book-link-card"
      >
        <Globe className="h-4 w-4 shrink-0 text-primary" aria-hidden />
        <span
          className="flex-1 text-xs font-mono truncate text-muted-foreground"
          title={absolute}
          data-testid="text-booking-url"
        >
          {displayLabel}
        </span>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 shrink-0"
          aria-label={copyAria}
          onClick={() => void copyLink()}
          data-testid="button-copy-link"
        >
          <Copy className="h-3.5 w-3.5" />
        </Button>
        {showPreviewLink ? (
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" asChild>
            <a href={previewPath} target="_blank" rel="noopener noreferrer" aria-label={previewAria}>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-border/50 bg-background/50 p-4" data-testid="public-book-link-card">
      <p className="text-xs text-muted-foreground">{linkLabel}</p>
      <div className="flex gap-2">
        <Input readOnly value={absolute} className="text-xs font-mono" data-testid="text-booking-url" />
        <Button type="button" variant="outline" size="icon" onClick={() => void copyLink()} aria-label={copyAria}>
          <Copy className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {showPreviewLink ? (
          <Button type="button" variant="secondary" size="sm" asChild>
            <a href={previewPath} target="_blank" rel="noopener noreferrer">
              {isEventVendor ? "Open website" : "Open book page"}
              <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </Button>
        ) : null}
      </div>
      {businessName && !isEventVendor ? (
        <p className="text-xs text-muted-foreground">
          Returning guests manage visits at{" "}
          <code className="text-primary">/my</code> — book at{" "}
          <code className="text-primary">{displayLabel}</code>
        </p>
      ) : null}
      {businessName && isEventVendor ? (
        <p className="text-xs text-muted-foreground">
          Enquire form lives at{" "}
          <code className="text-primary">{previewPath}/enquire</code> — share on Instagram bio.
        </p>
      ) : null}
    </div>
  );
}
