import { useMemo, useRef, useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { MarketingForm } from "@/components/marketing-form";
import { DeContactBand } from "@/components/marketing-shell";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { editorialCopy, type MarketingLocale } from "@/lib/marketing-editorial-i18n";

type MarketingHomeContentProps = {
  locale: MarketingLocale;
};

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
      <section className="relative overflow-hidden px-4 sm:px-6 border-b border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(6,182,212,0.1),transparent_50%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(139,92,246,0.06),transparent_45%)] pointer-events-none" />

        <div className="max-w-7xl mx-auto pt-14 sm:pt-18 md:pt-20 pb-14 md:pb-16 grid lg:grid-cols-[1fr_1fr] gap-10 lg:gap-14 items-start">
          <div className="lg:pr-4 z-10">
            <p className="text-[11px] font-medium tracking-[0.22em] uppercase text-muted-foreground mb-5">
              {t.hero.eyebrow}
            </p>

            <h1 className="font-serif text-[2.25rem] sm:text-5xl md:text-[3.25rem] leading-[1.05] tracking-tight text-foreground mb-4">
              {t.hero.headline[0]}
              <span className="block">{t.hero.headline[1]}</span>
              <span className="block text-foreground/90">{t.hero.headline[2]}</span>
            </h1>

            <p className="font-serif text-xl sm:text-2xl italic text-aurum-champagne mb-5">{t.hero.livLine}</p>

            <p className="text-base sm:text-lg text-muted-foreground max-w-lg mb-8">{t.hero.body}</p>

            <div className="flex flex-col sm:flex-row flex-wrap gap-3">
              <button
                type="button"
                onClick={scrollToForm}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-aurora-cyan text-black px-5 py-3 text-sm font-semibold hover:bg-aurora-cyan/90 min-h-[44px]"
                data-testid="marketing-hero-join"
              >
                {t.nav.joinBeta}
                <ArrowRight className="w-4 h-4" />
              </button>
              <Link
                href="/how-it-works"
                className="inline-flex items-center justify-center rounded-lg border border-white/15 px-5 py-3 text-sm text-muted-foreground hover:text-foreground min-h-[44px]"
              >
                {t.hero.howItWorks}
              </Link>
            </div>

            <p className="mt-6 text-xs sm:text-sm text-muted-foreground/80 font-mono tracking-wide">{t.hero.regions}</p>
          </div>

          <div className="relative z-10 rounded-xl border border-white/10 bg-[#0c0c10]/80 p-5 sm:p-6 backdrop-blur-sm">
            <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-muted-foreground mb-4">
              {t.homeMarkets.title}
            </p>
            <p className="text-sm text-muted-foreground mb-6">{t.homeMarkets.subtitle}</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {t.homeMarkets.cities.map((city) => (
                <div
                  key={city.place}
                  className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 hover:border-aurora-cyan/25 transition-colors"
                >
                  <p className="text-sm font-medium text-foreground">{city.place}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 font-mono">{city.note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 py-10 border-b border-white/5">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {t.homeTrust.map((stat) => (
            <div key={stat.label} className="rounded-lg border border-white/10 bg-white/[0.02] px-4 py-4 text-center">
              <p className="font-serif text-xl sm:text-2xl text-foreground">{stat.value}</p>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 sm:px-6 py-12 md:py-14 border-b border-white/5">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-5">
          {t.homeFeatures.map((card) => (
            <div key={card.title} className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
              <h2 className="font-serif text-lg text-foreground mb-2">{card.title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{card.body}</p>
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
