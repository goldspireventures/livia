import { useEffect, useState, type ReactNode } from "react";
import { Link } from "wouter";
import { Menu } from "lucide-react";
import { LiviaWordmark } from "@/components/brand/LiviaMark";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { MarketingFooter, type MarketingFooterLink } from "@/components/marketing-footer";
import { legalBase, marketingDemoPath } from "@/lib/marketing-links";
import { editorialCopy, type MarketingLocale } from "@/lib/marketing-editorial-i18n";
import { applyMarketingPlatformTheme } from "@/lib/marketing-platform-theme";
import { MarketingSkipLink } from "@/components/marketing-skip-link";

type MarketingShellProps = {
  locale: MarketingLocale;
  children: ReactNode;
  onJoinBeta?: (e: React.MouseEvent) => void;
};

export function MarketingShell({ locale, children, onJoinBeta }: MarketingShellProps) {
  const t = editorialCopy(locale);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    applyMarketingPlatformTheme();
  }, []);
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const homeHref = locale === "de" ? "/de" : base || "/";
  const altLocaleHref = locale === "de" ? "/" : "/de";
  const altLocaleLabel = locale === "de" ? t.nav.english : t.nav.deutsch;

  const joinHandler = onJoinBeta ?? ((e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth" });
  });

  const navLinks = (
    <>
      <Link
        href={marketingDemoPath}
        className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors min-h-[44px] inline-flex items-center"
        data-testid="marketing-demo-link"
        onClick={() => setMenuOpen(false)}
      >
        {t.nav.seeDemo}
      </Link>
      <Link
        href="/pricing"
        className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors min-h-[44px] inline-flex items-center"
        onClick={() => setMenuOpen(false)}
      >
        {t.nav.pricing}
      </Link>
      <Link
        href="/how-it-works"
        className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors min-h-[44px] inline-flex items-center"
        onClick={() => setMenuOpen(false)}
      >
        {t.nav.howItWorks}
      </Link>
      <Link
        href={altLocaleHref}
        className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors min-h-[44px] inline-flex items-center"
        onClick={() => setMenuOpen(false)}
      >
        {altLocaleLabel}
      </Link>
      <button
        type="button"
        onClick={(e) => {
          setMenuOpen(false);
          joinHandler(e);
        }}
        className="text-sm font-medium text-aurora-cyan hover:text-foreground transition-colors min-h-[44px] inline-flex items-center"
      >
        {t.nav.joinBeta}
      </button>
    </>
  );

  return (
    <div
      className="marketing-w1-shell min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-aurora-cyan/30 selection:text-aurora-cyan"
      data-surface-world="w1"
    >
      <MarketingSkipLink />
      <nav
        className="fixed top-0 left-0 right-0 z-50 border-b pt-[env(safe-area-inset-top)] marketing-w1-nav border-border/80 bg-background/85 backdrop-blur-md"
        aria-label="Site"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 py-4 gap-4">
          <Link href={homeHref}>
            <LiviaWordmark size="md" />
          </Link>

          <div className="hidden md:flex items-center gap-5">{navLinks}</div>

          <div className="flex items-center gap-2 md:hidden ml-auto">
            <button
              type="button"
              onClick={joinHandler}
              className="text-sm font-medium text-aurora-cyan min-h-[44px] px-2"
            >
              {t.nav.joinBeta}
            </button>
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-sm border border-border bg-background text-foreground"
                  aria-label={t.nav.menu}
                >
                  <Menu className="h-5 w-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[min(100vw,320px)] border-border bg-background">
                <SheetHeader>
                  <SheetTitle className="font-serif text-left">{t.nav.menu}</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-1 mt-8">{navLinks}</div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>

      <main id="main-content">{children}</main>

      <MarketingFooter
        homeHref={homeHref}
        layout="inline-legal"
        links={
          [
            { href: "/changelog", label: "Changelog" },
            { href: "/status", label: "Status" },
            { href: "/for/chair-rental", label: "Chair rental" },
            { href: `${legalBase}/privacy`, label: "Privacy", external: true },
            { href: `${legalBase}/tos`, label: "Terms", external: true },
            { href: "/pricing", label: t.nav.pricing },
            { href: "/europe", label: "Europe" },
            { href: altLocaleHref, label: altLocaleLabel, className: "text-aurora-cyan/90" },
          ] satisfies MarketingFooterLink[]
        }
      />
    </div>
  );
}

export function DeContactBand({ locale }: { locale: MarketingLocale }) {
  const contact = editorialCopy(locale).deContact;
  if (!contact) return null;

  return (
    <section className="py-16 md:py-20 px-4 sm:px-6 border-t border-white/5">
      <div className="max-w-3xl mx-auto border-l-2 border-aurora-cyan/40 pl-6 md:pl-8">
        <h2 className="font-serif text-2xl md:text-3xl tracking-tight mb-3">{contact.title}</h2>
        <p className="editorial-measure text-muted-foreground leading-relaxed mb-6">{contact.body}</p>
        <a
          href={`mailto:hello@livia-hq.com?subject=${encodeURIComponent(contact.mailSubject)}`}
          className="inline-flex items-center gap-2 text-aurora-cyan font-medium min-h-[44px]"
        >
          {contact.cta}
        </a>
      </div>
    </section>
  );
}
