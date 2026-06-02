import type { RefObject } from "react";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { MarketingForm } from "@/components/marketing-form";
import { editorialCopy, type MarketingLocale } from "@/lib/marketing-editorial-i18n";
import { dashboardWedgeUrl, marketingDemoPath } from "@/lib/marketing-links";
import { MARKETING_VERTICAL_LINKS } from "@/lib/marketing-verticals";
import { planMarketingCard } from "@/lib/pricing-catalog";
import "@/styles/constellation-home-fold.css";

const PHYSICS_KEYS = [0, 2, 4] as const;
const VERTICAL_SLUGS = ["medspa", "wellness", "fitness", "beauty", "hair", "allied-health"] as const;
const FAQ_COUNT = 3;

type ConstellationHomeFoldProps = {
  locale: MarketingLocale;
  formRef: RefObject<HTMLDivElement | null>;
};

export function ConstellationHomeFold({ locale, formRef }: ConstellationHomeFoldProps) {
  const t = editorialCopy(locale);
  const os = t.homeOs;
  const fold = t.homeFold;
  const solo = planMarketingCard("solo");
  const studio = planMarketingCard("studio");
  const physics = PHYSICS_KEYS.map((i) => os.physics[i]!);
  const verticals = MARKETING_VERTICAL_LINKS.filter((v) =>
    (VERTICAL_SLUGS as readonly string[]).includes(v.slug),
  );
  const faqItems = t.faq.items.slice(0, FAQ_COUNT);

  return (
    <div className="cst-fold">
      <section className="cst-fold__section" aria-labelledby="cst-fold-physics">
        <div className="cst-fold__inner">
          <p className="cst-fold__eyebrow">{fold.physicsEyebrow}</p>
          <h2 id="cst-fold-physics" className="cst-fold__title">
            {fold.physicsHeadline}
          </h2>
          <div className="cst-fold__physics">
            {physics.map((item) => (
              <article key={item.title} className="cst-fold__physics-card">
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="cst-fold__section" aria-labelledby="cst-fold-liv">
        <div className="cst-fold__inner cst-fold__liv">
          <div className="cst-fold__liv-copy">
            <h2 id="cst-fold-liv" className="cst-fold__liv-title">
              {os.livBand.title}
            </h2>
            <p className="cst-fold__liv-body">{fold.livLine}</p>
          </div>
          <div className="cst-fold__liv-actions">
            <Link href={marketingDemoPath} className="cst-fold__link" data-testid="marketing-demo-link">
              {os.seeDemo} →
            </Link>
            <Link href="/how-it-works" className="cst-fold__link cst-fold__link--muted">
              {os.howItWorks}
            </Link>
          </div>
        </div>
      </section>

      <section className="cst-fold__section" aria-labelledby="cst-fold-pricing">
        <div className="cst-fold__inner">
          <p className="cst-fold__eyebrow">{t.pricing.title}</p>
          <h2 id="cst-fold-pricing" className="cst-fold__title">
            {t.pricing.subtitle}
          </h2>
          <div className="cst-fold__pricing-row">
            <div className="cst-fold__price-card">
              <span className="cst-fold__price-name">{solo.name}</span>
              <span className="cst-fold__price-value">{solo.priceLabel.replace(/\/mo.*$/, "")}/mo</span>
            </div>
            <div className="cst-fold__price-card cst-fold__price-card--featured">
              <span className="cst-fold__price-name">{studio.name}</span>
              <span className="cst-fold__price-value">{studio.priceLabel.replace(/\/mo.*$/, "")}/mo</span>
            </div>
            <Link href="/pricing" className="cst-fold__link">
              {t.pricing.fullPricing} <ArrowRight className="inline h-3.5 w-3.5 ml-1" />
            </Link>
          </div>
          <p className="cst-fold__pricing-note">{fold.pricingFrom}</p>
        </div>
      </section>

      <section className="cst-fold__section">
        <div className="cst-fold__inner">
          <p className="cst-fold__eyebrow">{fold.verticalsEyebrow}</p>
          <h2 className="cst-fold__title">{fold.verticalsHeadline}</h2>
          <p className="cst-fold__liv-body mb-4">{fold.verticalsSub}</p>
          <div className="cst-fold__pills">
            {verticals.map((v) => (
              <a key={v.slug} href={dashboardWedgeUrl(v.slug)} className="cst-fold__pill">
                {v.label}
              </a>
            ))}
            <Link href="/verticals" className="cst-fold__pill">
              {locale === "de" ? "Alle Branchen →" : "All verticals →"}
            </Link>
          </div>
        </div>
      </section>

      <section className="cst-fold__section">
        <div className="cst-fold__inner cst-fold__inner--narrow">
          <h2 className="cst-fold__title">{t.faq.title}</h2>
          {faqItems.map((item) => (
            <div key={item.q} className="cst-fold__faq-item">
              <p className="cst-fold__faq-q">{item.q}</p>
              <p className="cst-fold__faq-a">{item.a}</p>
            </div>
          ))}
          <Link href="/how-it-works" className="cst-fold__link mt-4 inline-flex">
            {fold.faqMore} →
          </Link>
        </div>
      </section>

      <section className="cst-fold__section cst-fold__beta scroll-mt-24" ref={formRef} id="waitlist">
        <div className="cst-fold__inner cst-fold__inner--narrow">
          <h2 className="cst-fold__beta-title">{t.founder.ctaTitle}</h2>
          <p className="cst-fold__beta-sub">{t.founder.ctaSubtitle}</p>
          <MarketingForm locale={locale} />
        </div>
      </section>
    </div>
  );
}
