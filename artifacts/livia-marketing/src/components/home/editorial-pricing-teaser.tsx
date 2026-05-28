import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { planMarketingCard } from "@/lib/pricing-catalog";
import { editorialCopy, type MarketingLocale } from "@/lib/marketing-editorial-i18n";

type EditorialPricingTeaserProps = {
  locale: MarketingLocale;
};

export function EditorialPricingTeaser({ locale }: EditorialPricingTeaserProps) {
  const t = editorialCopy(locale).pricing;
  const solo = planMarketingCard("solo");
  const studio = planMarketingCard("studio");

  return (
    <section className="py-20 sm:py-24 md:py-32 px-4 sm:px-6 bg-[#0a0a0c] border-y border-white/5 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.04),transparent_55%)] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-[0.85fr_1.15fr] gap-8 lg:gap-16 items-end mb-12 sm:mb-14">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl md:text-5xl tracking-tight mb-3 sm:mb-4">{t.title}</h2>
            <p className="editorial-measure text-muted-foreground text-base sm:text-lg">{t.subtitle}</p>
          </div>
          <p className="text-sm text-muted-foreground lg:text-right lg:pb-1">
            {t.morePlans}{" "}
            <Link href="/pricing" className="text-aurora-cyan hover:text-white transition-colors">
              {t.fullPricing}
            </Link>
            .
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 sm:gap-8 max-w-4xl">
          <div className="p-6 sm:p-8 md:p-10 rounded-sm border border-white/10 bg-white/[0.03] flex flex-col">
            <h3 className="text-lg font-medium text-white/80 mb-2">{solo.name}</h3>
            <p className="font-serif text-3xl sm:text-4xl md:text-5xl tracking-tight mb-6">{solo.priceLabel}</p>
            <ul className="space-y-3 text-sm text-muted-foreground flex-1">
              {t.soloFeatures.map((line) => (
                <li key={line} className="flex gap-3">
                  <span className="text-aurora-cyan shrink-0">—</span>
                  {line}
                </li>
              ))}
            </ul>
          </div>

          <div className="p-6 sm:p-8 md:p-10 rounded-sm border border-aurora-cyan/25 bg-aurora-cyan/[0.04] flex flex-col relative">
            <span className="absolute top-0 right-4 sm:right-6 -translate-y-1/2 text-[10px] font-semibold uppercase tracking-wider text-aurora-cyan border border-aurora-cyan/30 bg-background px-2 py-0.5">
              {t.mostStudios}
            </span>
            <h3 className="text-lg font-medium mb-2 pt-2 sm:pt-0">{studio.name}</h3>
            <p className="font-serif text-3xl sm:text-4xl md:text-5xl tracking-tight text-aurora-cyan mb-6">
              {studio.priceLabel}
            </p>
            <ul className="space-y-3 text-sm text-white/80 flex-1">
              {t.studioFeatures.map((line) => (
                <li key={line} className="flex gap-3">
                  <span className="text-aurora-cyan shrink-0">—</span>
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 sm:mt-12">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-white transition-colors min-h-[44px]"
          >
            {t.compareAll}
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
