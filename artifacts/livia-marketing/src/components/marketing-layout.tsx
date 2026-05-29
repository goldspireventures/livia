import { useState, type ReactNode } from "react";
import { Link } from "wouter";
import { Menu } from "lucide-react";
import { LiviaWordmark } from "@/components/brand/LiviaMark";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { LEGAL_FOOTER_LINE } from "@/lib/company";
import { dashboardDemoUrl, dashboardSignInUrl, legalBase } from "@/lib/marketing-links";

const base = import.meta.env.BASE_URL.replace(/\/$/, "");

const NAV = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/verticals", label: "Verticals" },
  { href: "/europe", label: "Europe" },
  { href: "/eu-ai", label: "EU AI" },
  { href: "/for/chair-rental", label: "For hosts" },
  { href: "/contact", label: "Contact" },
  { href: "/de", label: "Deutsch" },
] as const;

export function MarketingLayout({
  children,
  active,
}: {
  children: ReactNode;
  active?: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const homeHref = base || "/";

  const navLink = (item: (typeof NAV)[number]) => (
    <Link
      key={item.href}
      href={item.href}
      onClick={() => setMenuOpen(false)}
      className={`min-h-[44px] inline-flex items-center text-sm ${
        active === item.label
          ? "text-foreground font-medium"
          : "text-muted-foreground hover:text-white transition-colors"
      }`}
    >
      {item.label}
    </Link>
  );

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-background/80 backdrop-blur-md pt-[env(safe-area-inset-top)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <Link href={homeHref}>
            <LiviaWordmark size="md" />
          </Link>

          <div className="hidden lg:flex items-center gap-5">{NAV.map(navLink)}</div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <a
              href={dashboardDemoUrl}
              className="hidden md:inline text-sm font-medium text-muted-foreground hover:text-white transition-colors min-h-[44px] items-center"
              data-testid="marketing-demo-link"
            >
              Try demo
            </a>
            <a
              href={dashboardSignInUrl}
              className="hidden md:inline text-sm font-medium text-muted-foreground hover:text-white transition-colors min-h-[44px] items-center"
            >
              Sign in
            </a>
            <a
              href={`${homeHref}#waitlist`}
              className="text-sm font-medium text-aurora-cyan hover:text-white transition-colors min-h-[44px] inline-flex items-center px-1"
            >
              Join beta
            </a>
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  className="lg:hidden inline-flex h-11 w-11 items-center justify-center rounded-sm border border-white/10"
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
                  <a
                    href={dashboardDemoUrl}
                    className="min-h-[44px] inline-flex items-center text-sm text-muted-foreground hover:text-white"
                    onClick={() => setMenuOpen(false)}
                  >
                    Try demo
                  </a>
                  <a
                    href={dashboardSignInUrl}
                    className="min-h-[44px] inline-flex items-center text-sm text-muted-foreground hover:text-white"
                    onClick={() => setMenuOpen(false)}
                  >
                    Sign in
                  </a>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>
      <div className="pt-[calc(5rem+env(safe-area-inset-top))]">{children}</div>
      <footer className="border-t border-white/5 bg-[#050505] py-12 px-4 sm:px-6 text-sm mt-24 pb-[calc(3rem+env(safe-area-inset-bottom))]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between gap-8">
          <div>
            <Link href={homeHref}>
              <LiviaWordmark size="sm" className="opacity-80 mb-2" />
            </Link>
            <p className="text-muted-foreground text-xs">{LEGAL_FOOTER_LINE}</p>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-muted-foreground">
            <Link href="/pricing" className="hover:text-white min-h-[44px] inline-flex items-center">
              Pricing
            </Link>
            <Link href="/how-it-works" className="hover:text-white min-h-[44px] inline-flex items-center">
              How it works
            </Link>
            <Link href="/verticals" className="hover:text-white min-h-[44px] inline-flex items-center">
              Verticals
            </Link>
            <Link href="/de" className="hover:text-white min-h-[44px] inline-flex items-center text-aurora-cyan/90">
              Deutsch
            </Link>
            <Link href="/changelog" className="hover:text-white min-h-[44px] inline-flex items-center">
              Changelog
            </Link>
            <Link href="/status" className="hover:text-white min-h-[44px] inline-flex items-center">
              Status
            </Link>
            <Link href="/eu-ai" className="hover:text-white min-h-[44px] inline-flex items-center">
              EU AI
            </Link>
            <a href={`${legalBase}/privacy`} className="hover:text-white min-h-[44px] inline-flex items-center" rel="noopener noreferrer">
              Privacy
            </a>
            <a href={`${legalBase}/tos`} className="hover:text-white min-h-[44px] inline-flex items-center" rel="noopener noreferrer">
              Terms
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
