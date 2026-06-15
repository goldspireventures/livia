import { Link } from "wouter";
import { Smartphone } from "lucide-react";
import { PublicBookLinkCard } from "@/components/settings/public-book-link-card";

/** Owner-facing note — guests use My Livia; one calm line, not a marketing banner. */
export function GuestVaultOwnerCallout({
  slug,
  businessName,
  compact,
}: {
  slug: string;
  businessName?: string;
  compact?: boolean;
}) {
  return (
    <div
      className="rounded-lg border border-border/80 bg-muted/30 px-3 py-2.5 text-xs text-muted-foreground space-y-2"
      data-testid="guest-vault-owner-callout"
    >
      <p className="flex gap-2">
        <Smartphone className="h-4 w-4 text-primary shrink-0 mt-0.5" aria-hidden />
        <span>
          Returning guests manage visits and packs in{" "}
          <Link href="/my" className="text-primary hover:underline font-medium">
            My Livia
          </Link>{" "}
          when they book with the same phone — your book page stays for new guests.
        </span>
      </p>
      {!compact ? (
        <PublicBookLinkCard slug={slug} businessName={businessName} showPreviewLink />
      ) : null}
    </div>
  );
}
