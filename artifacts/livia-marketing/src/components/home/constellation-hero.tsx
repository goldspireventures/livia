import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { ConstellationSacredMap } from "@/components/home/constellation-sacred-map";
import { editorialCopy, type MarketingLocale } from "@/lib/marketing-editorial-i18n";
import { marketingDemoPath } from "@/lib/marketing-links";
import { CONSTELLATION_ORBIT_VERTICALS } from "@/lib/marketing-verticals";
import "@/styles/constellation-home.css";

type ConstellationHeroProps = {
  locale: MarketingLocale;
  onJoinBeta: (e: React.MouseEvent) => void;
};

export function ConstellationHero({ locale, onJoinBeta }: ConstellationHeroProps) {
  const t = editorialCopy(locale).homeConstellation;
  const verticals = CONSTELLATION_ORBIT_VERTICALS.map((v) => ({
    label: locale === "de" ? v.de : v.en,
  }));

  return (
    <section className="constellation-hero editorial-grain" data-testid="marketing-home-hero">
      <div className="constellation-hero__stars" aria-hidden />
      <div className="constellation-hero__nebula" aria-hidden />

      <div className="constellation-hero__grid">
        <div className="constellation-hero__copy">
          <h1 className="constellation-hero__headline">
            <span className="constellation-hero__headline-lead">{t.headline1}</span>
            <span className="constellation-hero__headline-accent">{t.headline2}</span>
          </h1>
          <p className="constellation-hero__sub">{t.subhead}</p>
          <div className="constellation-hero__actions">
            <Link href={marketingDemoPath} className="constellation-hero__cta-primary" data-testid="marketing-hero-demo">
              {t.bookDemo}
              <ArrowRight className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            </Link>
            <Link href="/how-it-works" className="constellation-hero__cta-secondary">
              {t.howItWorks}
            </Link>
            <button type="button" onClick={onJoinBeta} className="constellation-hero__cta-secondary">
              {t.joinBeta}
            </button>
          </div>
        </div>

        <div className="constellation-hero__visual">
          <ConstellationSacredMap verticals={verticals} />
        </div>
      </div>
    </section>
  );
}
