import { useEffect, useState, type ReactNode } from "react";
import { Link } from "wouter";
import { Menu } from "lucide-react";
import { LiviaWordmark } from "@/components/brand/LiviaMark";
import { ConstellationPageShell } from "@/components/constellation/constellation-page-shell";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { MarketingFooter, W1_FOOTER_LINKS } from "@/components/marketing-footer";
import { marketingDemoPath } from "@/lib/marketing-links";
import { applyMarketingPlatformTheme } from "@/lib/marketing-platform-theme";
import { MarketingSkipLink } from "@/components/marketing-skip-link";
import { MarketingBackLink, shouldShowMarketingBack } from "@/components/marketing-back-link";
import { MarketingLocaleSwitch } from "@/components/marketing-locale-switch";
import { useLocation } from "wouter";

const base = import.meta.env.BASE_URL.replace(/\/$/, "");

const NAV = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/verticals", label: "Verticals" },
  { href: "/europe", label: "Europe" },
  { href: "/eu-ai", label: "EU AI" },
  { href: "/for/chair-rental", label: "For hosts" },
  { href: "/contact", label: "Contact" },
] as const;

export function MarketingLayout({
  children,
  active,
  shellTone = "strong",
}: {
  children: ReactNode;
  active?: string;
  shellTone?: "default" | "strong";
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [path] = useLocation();
  const homeHref = base || "/";

  useEffect(() => {
    applyMarketingPlatformTheme();
  }, []);

  const navLink = (item: (typeof NAV)[number]) => (
    <Link
      key={item.href}
      href={item.href}
      onClick={() => setMenuOpen(false)}
      className={`min-h-[44px] inline-flex items-center whitespace-nowrap text-sm ${
        active === item.label
          ? "text-[#d9c39a] font-medium"
          : "text-muted-foreground hover:text-white transition-colors"
      }`}
    >
      {item.label}
    </Link>
  );

  return (
    <div className="marketing-w1-shell min-h-screen bg-background text-foreground overflow-x-hidden">
      <MarketingSkipLink />
      <nav
        className="marketing-w1-nav fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-background/80 backdrop-blur-md pt-[env(safe-area-inset-top)]"
        aria-label="Site"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <Link href={homeHref} className="justify-self-start shrink-0">
            <LiviaWordmark size="nav" />
          </Link>

          <div className="hidden xl:flex items-center justify-center gap-x-4 gap-y-1">{NAV.map(navLink)}</div>

          <div className="justify-self-end flex items-center gap-3 sm:gap-4 shrink-0">
            <MarketingLocaleSwitch className="hidden sm:flex" />
            <Link
              href={marketingDemoPath}
              className="hidden sm:inline-flex text-sm font-medium text-muted-foreground hover:text-white transition-colors min-h-[44px] items-center"
              data-testid="marketing-demo-link"
            >
              Book a demo
            </Link>
            <a
              href={`${homeHref}#waitlist`}
              className="text-sm font-medium text-aurora-cyan hover:text-white transition-colors min-h-[44px] inline-flex items-center"
            >
              Join beta
            </a>
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  className="xl:hidden inline-flex h-11 w-11 items-center justify-center rounded-sm border border-white/10"
                  aria-label="Menu"
                >
                  <Menu className="h-5 w-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[min(100vw,320px)] border-white/10 bg-background">
                <SheetHeader>
                  <SheetTitle className="font-serif text-left">Menu</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-1 mt-8">
                  {NAV.map(navLink)}
                  <MarketingLocaleSwitch className="mt-2 px-0" />
                  <Link
                    href={marketingDemoPath}
                    className="min-h-[44px] inline-flex items-center text-sm text-muted-foreground hover:text-white"
                    onClick={() => setMenuOpen(false)}
                  >
                    Book a demo
                  </Link>
                  <a
                    href={`${homeHref}#waitlist`}
                    className="min-h-[44px] inline-flex items-center text-sm text-aurora-cyan hover:text-white"
                    onClick={() => setMenuOpen(false)}
                  >
                    Join beta
                  </a>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>
      <main id="main-content" className="pt-[calc(5rem+env(safe-area-inset-top))]">
        {shouldShowMarketingBack(path) ? (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-3 pb-1 relative z-[1]">
            <MarketingBackLink />
          </div>
        ) : null}
        <ConstellationPageShell tone={shellTone}>{children}</ConstellationPageShell>
      </main>
      <MarketingFooter homeHref={homeHref} links={W1_FOOTER_LINKS} />
    </div>
  );
}
