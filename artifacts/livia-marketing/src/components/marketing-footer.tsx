import { Link } from "wouter";
import { LiviaWordmark } from "@/components/brand/LiviaMark";
import { LEGAL_FOOTER_LINE, MARKETING_FOOTER_TAGLINE } from "@/lib/company";
import { legalBase } from "@/lib/marketing-links";

export type MarketingFooterLink = {
  href: string;
  label: string;
  external?: boolean;
  className?: string;
};

type MarketingFooterProps = {
  homeHref: string;
  links: MarketingFooterLink[];
  layout?: "stacked" | "inline-legal";
  className?: string;
};

export function MarketingFooter({
  homeHref,
  links,
  layout = "stacked",
  className = "",
}: MarketingFooterProps) {
  const linkClass =
    "hover:text-white transition-colors min-h-[44px] inline-flex items-center text-muted-foreground";

  const linkNode = (item: MarketingFooterLink) => {
    const cls = `${linkClass}${item.className ? ` ${item.className}` : ""}`;
    if (item.external || item.href.startsWith("http")) {
      return (
        <a key={item.href + item.label} href={item.href} className={cls} rel="noopener noreferrer">
          {item.label}
        </a>
      );
    }
    return (
      <Link key={item.href + item.label} href={item.href} className={cls}>
        {item.label}
      </Link>
    );
  };

  if (layout === "inline-legal") {
    return (
      <footer
        className={`border-t border-border/80 bg-background py-12 px-4 sm:px-6 text-sm pb-[calc(3rem+env(safe-area-inset-bottom))] marketing-w1-footer ${className}`}
      >
        <div className="max-w-6xl mx-auto flex flex-col gap-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex items-center gap-6">
              <Link href={homeHref}>
                <LiviaWordmark size="sm" className="opacity-80 hover:opacity-100 transition-opacity" />
              </Link>
              <span className="text-muted-foreground text-xs">{LEGAL_FOOTER_LINE}</span>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2">{links.map(linkNode)}</div>
          </div>
          <p className="text-muted-foreground/70 text-xs">{MARKETING_FOOTER_TAGLINE}</p>
        </div>
      </footer>
    );
  }

  return (
    <footer
      className={`marketing-w1-footer border-t border-white/5 py-12 px-4 sm:px-6 text-sm mt-24 pb-[calc(3rem+env(safe-area-inset-bottom))] ${className}`}
    >
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between gap-8">
        <div>
          <Link href={homeHref}>
            <LiviaWordmark size="sm" className="opacity-80 mb-2" />
          </Link>
          <p className="text-muted-foreground text-xs">{LEGAL_FOOTER_LINE}</p>
          <p className="text-muted-foreground/70 text-xs mt-2">{MARKETING_FOOTER_TAGLINE}</p>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2">{links.map(linkNode)}</div>
      </div>
    </footer>
  );
}

/** Default W1 constellation footer links. */
export const W1_FOOTER_LINKS: MarketingFooterLink[] = [
  { href: "/pricing", label: "Pricing" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/verticals", label: "Verticals" },
  { href: "/de", label: "Deutsch", className: "text-aurora-cyan/90" },
  { href: "/changelog", label: "Changelog" },
  { href: "/status", label: "Status" },
  { href: "/eu-ai", label: "EU AI" },
  { href: `${legalBase}/privacy`, label: "Privacy", external: true },
  { href: `${legalBase}/tos`, label: "Terms", external: true },
];
