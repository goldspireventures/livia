import { Link } from "wouter";
import { LiviaWordmark } from "@/components/brand/LiviaMark";
import { LEGAL_FOOTER_LINE, MARKETING_FOOTER_TAGLINE } from "@/lib/company";
import { legalBase } from "@/lib/marketing-links";
import { MarketingLocaleSwitch } from "@/components/marketing-locale-switch";

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

/** ~20% tighter than prior py-12 / gap-8 / 3rem safe-area padding. */
const FOOTER_SHELL =
  "px-4 sm:px-6 text-sm py-[2.4rem] pb-[calc(2.4rem+env(safe-area-inset-bottom))] marketing-w1-footer";

export function MarketingFooter({
  homeHref,
  links,
  layout = "stacked",
  className = "",
}: MarketingFooterProps) {
  const linkClass =
    "hover:text-white transition-colors min-h-[36px] inline-flex items-center text-muted-foreground";

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
        className={`border-t border-border/80 bg-background ${FOOTER_SHELL} ${className}`}
      >
        <div className="max-w-6xl mx-auto flex flex-col gap-[1.6rem]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-[1.2rem]">
            <div className="flex items-center gap-6">
              <Link href={homeHref}>
                <LiviaWordmark size="sm" className="opacity-80 hover:opacity-100 transition-opacity" />
              </Link>
              <span className="text-muted-foreground text-xs">{LEGAL_FOOTER_LINE}</span>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2">{links.map(linkNode)}</div>
          </div>
          <p className="text-muted-foreground/70 text-xs flex flex-wrap items-center gap-x-4 gap-y-2">
            <span>{MARKETING_FOOTER_TAGLINE}</span>
            <MarketingLocaleSwitch />
          </p>
        </div>
      </footer>
    );
  }

  return (
    <footer
      className={`border-t border-white/5 mt-[4.8rem] ${FOOTER_SHELL} ${className}`}
    >
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between gap-[1.6rem]">
        <div>
          <Link href={homeHref}>
            <LiviaWordmark size="sm" className="opacity-80 mb-1.5" />
          </Link>
          <p className="text-muted-foreground text-xs">{LEGAL_FOOTER_LINE}</p>
          <p className="text-muted-foreground/70 text-xs mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-2">
            <span>{MARKETING_FOOTER_TAGLINE}</span>
            <MarketingLocaleSwitch />
          </p>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2">{links.map(linkNode)}</div>
      </div>
    </footer>
  );
}

/** Default W1 constellation footer links. */
export function w1FooterLinks(): MarketingFooterLink[] {
  const legal = legalBase();
  return [
  { href: "/pricing", label: "Pricing" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/verticals", label: "Verticals" },
  { href: "/europe", label: "Europe" },
  { href: "/changelog", label: "Changelog" },
  { href: "/status", label: "Status" },
  { href: "/eu-ai", label: "EU AI" },
  { href: `${legal}/privacy`, label: "Privacy", external: true },
  { href: `${legal}/tos`, label: "Terms", external: true },
];
}
