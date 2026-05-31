import { useMemo, useRef, useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { MarketingForm } from "@/components/marketing-form";
import { DeContactBand } from "@/components/marketing-shell";
import { EditorialStory } from "@/components/home/editorial-story";
import { EditorialPricingTeaser } from "@/components/home/editorial-pricing-teaser";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { editorialCopy, type MarketingLocale } from "@/lib/marketing-editorial-i18n";
import { dashboardWedgeUrl } from "@/lib/marketing-links";
import { MARKETING_VERTICAL_LINKS } from "@/lib/marketing-verticals";

type MarketingHomeContentProps = {
  locale: MarketingLocale;
};

/** M1-R2 — One thread (story scroll). See MARKETING-SURFACE-PROGRAM.md */
export function MarketingHomeContent({ locale }: MarketingHomeContentProps) {
  const formRef = useRef<HTMLDivElement>(null);
  const [showAllFaq, setShowAllFaq] = useState(false);
  const t = editorialCopy(locale);

  const scrollToForm = (e: React.MouseEvent) => {
    e.preventDefault();
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const faqItems = useMemo(() => (showAllFaq ? t.faq.items : t.faq.items.slice(0, 4)), [showAllFaq, t.faq.items]);

  return (
    <>
      {/* Hero — continuity thread opens here (M1-R2) */}
      <section className="relative overflow-hidden px-4 sm:px-6 border-b border-white/5">
        <div className="absolute inset-0 marketing-aurora-breathe pointer-events-none" aria-hidden>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(6,182,212,0.12),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(139,92,246,0.06),transparent_45%)]" />
        </div>

        <div className="max-w-4xl mx-auto pt-16 sm:pt-20 md:pt-24 pb-12 md:pb-16 text-center z-10 relative">
          <p className="text-[11px] font-medium tracking-[0.22em] uppercase text-muted-foreground mb-6">
            {t.hero.eyebrow}
          </p>

          <h1 className="font-serif text-[2.35rem] sm:text-5xl md:text-[3.5rem] leading-[1.06] tracking-tight text-foreground mb-5">
            One thread.
            <span className="block text-foreground/90">From first DM to day-of.</span>
          </h1>

          <p className="font-serif text-xl sm:text-2xl italic text-aurum-champagne mb-6">{t.hero.livLine}</p>

          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
            Livia is the operator OS for appointment businesses — inbox, calendar, team, and deposits on one
            continuity line. Not seven apps. Not a marketplace.
          </p>

          <div className="flex flex-col sm:flex-row flex-wrap gap-3 justify-center">
            <button
              type="button"
              onClick={scrollToForm}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-aurora-cyan text-black px-5 py-3 text-sm font-semibold hover:bg-aurora-cyan/90 min-h-[44px]"
              data-testid="marketing-hero-join"
            >
              {t.nav.joinBeta}
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href={dashboardWedgeUrl("body-art")}
              className="inline-flex items-center justify-center rounded-lg border border-white/15 px-5 py-3 text-sm text-muted-foreground hover:text-foreground min-h-[44px]"
              data-testid="marketing-hero-demo"
            >
              {t.nav.seeDemo}
            </a>
            <Link
              href="/how-it-works"
              className="inline-flex items-center justify-center rounded-lg border border-white/15 px-5 py-3 text-sm text-muted-foreground hover:text-foreground min-h-[44px]"
            >
              {t.hero.howItWorks}
            </Link>
          </div>

          <p className="mt-8 text-xs sm:text-sm text-muted-foreground/80 font-mono tracking-wide">{t.hero.regions}</p>
        </div>

        {/* Continuity thread — visual spine into story sections */}
        <div className="absolute left-1/2 top-[min(72%,520px)] bottom-0 w-px bg-gradient-to-b from-aurora-cyan/40 via-aurora-cyan/15 to-transparent -translate-x-1/2 pointer-events-none hidden md:block" />
      </section>

      {/* M1-R2 story scroll — chapters 1–3 + trust timeline */}
      <div className="relative">
        <div
          className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 bg-gradient-to-b from-aurora-cyan/35 via-aurora-cyan/10 to-transparent pointer-events-none"
          aria-hidden
        />
        <EditorialStory locale={locale} />
      </div>

      {/* M2-A pricing teaser — honest tiers, link to full /pricing */}
      <EditorialPricingTeaser locale={locale} />

      {/* Trade worlds strip → demo wedge (G1-A entry from marketing) */}
      <section className="px-4 sm:px-6 py-12 md:py-14 border-y border-white/5 bg-[#0c0c10]/40">
        <div className="max-w-6xl mx-auto">
          <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-muted-foreground mb-3">
            Your trade
          </p>
          <h2 className="font-serif text-2xl sm:text-3xl tracking-tight mb-3">See what Livia does for your shop type</h2>
          <p className="text-sm text-muted-foreground mb-8 max-w-2xl">
            Pick a vertical — a short story, then enter the live demo. No sign-up until you&apos;re ready.
          </p>
          <div className="flex flex-wrap gap-2">
            {MARKETING_VERTICAL_LINKS.map((v) => (
              <a
                key={v.slug}
                href={dashboardWedgeUrl(v.slug)}
                className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm hover:border-aurora-cyan/40 hover:text-aurora-cyan transition-colors min-h-[44px] inline-flex items-center"
              >
                {v.label}
              </a>
            ))}
            <Link
              href="/verticals"
              className="rounded-full border border-white/10 px-4 py-2 text-sm text-muted-foreground hover:text-foreground min-h-[44px] inline-flex items-center"
            >
              All verticals →
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 py-10 border-b border-white/5">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {t.homeTrust.map((stat) => (
            <div key={stat.label} className="rounded-lg border border-white/10 bg-[#0c0c10]/80 backdrop-blur px-4 py-4 text-center">
              <p className="font-serif text-xl sm:text-2xl text-foreground">{stat.value}</p>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {locale === "de" ? <DeContactBand locale={locale} /> : null}

      <section className="py-12 md:py-16 px-4 sm:px-6 border-b border-white/5">
        <div className="max-w-3xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
            <h2 className="text-2xl sm:text-3xl font-serif tracking-tight">{t.faq.title}</h2>
            <button
              type="button"
              onClick={() => setShowAllFaq((s) => !s)}
              className="text-sm text-muted-foreground hover:text-foreground min-h-[44px]"
            >
              {showAllFaq ? (locale === "de" ? "Weniger" : "Fewer") : locale === "de" ? "Alle" : "All"}
            </button>
          </div>
          <p className="text-sm text-muted-foreground mb-6">{t.faqIntro}</p>

          <Accordion type="single" collapsible className="w-full space-y-2">
            {faqItems.map((item, i) => (
              <AccordionItem key={item.q} value={`item-${i}`} className="border-white/10 px-1">
                <AccordionTrigger className="text-left text-sm sm:text-base font-medium hover:no-underline hover:text-aurora-cyan py-4 min-h-[44px]">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm leading-relaxed pb-4">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <section className="py-14 md:py-18 px-4 sm:px-6 relative scroll-mt-24" ref={formRef} id="waitlist">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(6,182,212,0.08),transparent_55%)] pointer-events-none" />
        <div className="max-w-3xl mx-auto relative z-10">
          <p className="text-lg md:text-xl font-serif italic text-foreground/90 mb-8 max-w-xl">
            &ldquo;{t.founder.quote}&rdquo;
          </p>
          <h2 className="text-3xl md:text-4xl font-serif mb-2 tracking-tight">{t.founder.ctaTitle}</h2>
          <p className="text-muted-foreground mb-8">{t.founder.ctaSubtitle}</p>
          <MarketingForm locale={locale} />
        </div>
      </section>
    </>
  );
}
