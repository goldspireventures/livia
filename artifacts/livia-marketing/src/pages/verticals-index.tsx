import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { MarketingLayout } from "@/components/marketing-layout";
import { ConstellationPageHeader } from "@/components/constellation/constellation-page-header";
import { ConstellationPageFooter } from "@/components/constellation/constellation-inner-page";
import { MARKETING_VERTICAL_LINKS } from "@/lib/marketing-verticals";

export default function VerticalsIndexPage() {
  return (
    <MarketingLayout active="Verticals">
      <div className="cst-verticals">
        <ConstellationPageHeader
          eyebrow="One platform · every trade"
          title={
            <>
              Every <em>vertical</em>
            </>
          }
          subtitle="Longer trade stories and pain points — when you want detail before you pick a demo card."
        />

        <ul className="cst-verticals__grid">
          {MARKETING_VERTICAL_LINKS.map((v) => (
            <li key={v.slug}>
              <Link href={`/verticals/${v.slug}`} className="cst-vertical-card group">
                <span className="cst-vertical-card__star" aria-hidden />
                <div className="cst-vertical-card__body">
                  <p className="cst-vertical-card__title">{v.label}</p>
                  <p className="cst-vertical-card__hint">{v.hint}</p>
                </div>
                <ArrowRight className="cst-vertical-card__arrow" strokeWidth={1.75} aria-hidden />
              </Link>
            </li>
          ))}
        </ul>

        <ConstellationPageFooter>
          <p>Each page explains how Livia fits that trade. When you are ready, book once and walk a live studio.</p>
          <Link href="/book-demo" className="cst-page-link" data-testid="marketing-demo-link">
            Book a demo →
          </Link>
          <Link href="/" className="cst-page-link cst-page-link--muted">
            Back to home
          </Link>
        </ConstellationPageFooter>
      </div>
    </MarketingLayout>
  );
}
