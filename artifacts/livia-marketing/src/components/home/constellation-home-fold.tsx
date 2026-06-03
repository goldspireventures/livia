import type { RefObject } from "react";
import { Link } from "wouter";
import { MarketingForm } from "@/components/marketing-form";
import { editorialCopy, type MarketingLocale } from "@/lib/marketing-editorial-i18n";
import { marketingBookDemoUrl, marketingDemoPath } from "@/lib/marketing-links";
import { MARKETING_VERTICAL_LINKS } from "@/lib/marketing-verticals";
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
          </div>
        </div>
      </section>

      <section className="cst-fold__section">
        <div className="cst-fold__inner">
          <p className="cst-fold__eyebrow">{fold.verticalsEyebrow}</p>
          <h2 className="cst-fold__title">{fold.verticalsHeadline}</h2>
          <p className="cst-fold__liv-body mb-4">{fold.verticalsSub}</p>
          <div className="cst-fold__pills">
            {verticals.map((v) => (
              <Link key={v.slug} href={marketingBookDemoUrl(v.slug)} className="cst-fold__pill">
                {v.label}
              </Link>
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
