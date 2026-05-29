import { useState, type ReactNode } from "react";
import { Link } from "wouter";
import { Menu, ArrowRight } from "lucide-react";
import { LiviaWordmark } from "@/components/brand/LiviaMark";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { LEGAL_FOOTER_LINE } from "@/lib/company";
import { dashboardDemoUrl, legalBase } from "@/lib/marketing-links";
import { editorialCopy, type MarketingLocale } from "@/lib/marketing-editorial-i18n";

type MarketingShellProps = {
  locale: MarketingLocale;
  children: ReactNode;
  onJoinBeta?: (e: React.MouseEvent) => void;
};

export function MarketingShell({ locale, children, onJoinBeta }: MarketingShellProps) {
  const t = editorialCopy(locale);
  const [menuOpen, setMenuOpen] = useState(false);
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
      <a
        href={dashboardDemoUrl}
        className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors min-h-[44px] inline-flex items-center"
        data-testid="marketing-demo-link"
        onClick={() => setMenuOpen(false)}
      >
        {t.nav.seeDemo}
      </a>
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
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-aurora-cyan/30 selection:text-aurora-cyan">
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-background/80 backdrop-blur-md pt-[env(safe-area-inset-top)]">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 py-4 gap-4">
          <Link href={homeHref}>
            <LiviaWordmark size="md" />
          </Link>

          <div className="hidden md:flex items-center gap-5">{navLinks}</div>

          <div className="flex md:hidden items-center gap-2">
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

      <main>{children}</main>

      <footer className="border-t border-white/5 bg-[#0a0a0c] py-12 px-4 sm:px-6 text-sm pb-[calc(3rem+env(safe-area-inset-bottom))]">
        <div className="max-w-6xl mx-auto flex flex-col gap-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex items-center gap-6">
              <Link href={homeHref}>
                <LiviaWordmark size="sm" className="opacity-80 hover:opacity-100 transition-opacity" />
              </Link>
              <span className="text-muted-foreground text-xs">{LEGAL_FOOTER_LINE}</span>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-muted-foreground">
              <Link href="/changelog" className="hover:text-foreground transition-colors min-h-[44px] inline-flex items-center">
                Changelog
              </Link>
              <Link href="/status" className="hover:text-foreground transition-colors min-h-[44px] inline-flex items-center">
                Status
              </Link>
              <Link href="/for/chair-rental" className="hover:text-foreground transition-colors min-h-[44px] inline-flex items-center">
                Chair rental
              </Link>
              <a href={`${legalBase}/privacy`} className="hover:text-foreground transition-colors min-h-[44px] inline-flex items-center" rel="noopener noreferrer">
                Privacy
              </a>
              <a href={`${legalBase}/tos`} className="hover:text-foreground transition-colors min-h-[44px] inline-flex items-center" rel="noopener noreferrer">
                Terms
              </a>
              <Link href="/pricing" className="hover:text-foreground transition-colors min-h-[44px] inline-flex items-center">
                {t.nav.pricing}
              </Link>
              <Link href="/europe" className="hover:text-foreground transition-colors min-h-[44px] inline-flex items-center">
                Europe
              </Link>
              <Link href={altLocaleHref} className="hover:text-foreground transition-colors min-h-[44px] inline-flex items-center text-aurora-cyan/90">
                {altLocaleLabel}
              </Link>
            </div>
          </div>
          <p className="text-muted-foreground/60 text-xs">Made with care in Dublin</p>
        </div>
      </footer>
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
          href={`mailto:hello@livia.app?subject=${encodeURIComponent(contact.mailSubject)}`}
          className="inline-flex items-center gap-2 text-aurora-cyan font-medium min-h-[44px]"
        >
          {contact.cta}
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </section>
  );
}
