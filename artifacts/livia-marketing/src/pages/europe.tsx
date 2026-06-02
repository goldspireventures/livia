import { Link } from "wouter";
import { MarketingLayout } from "@/components/marketing-layout";
import { ConstellationPageHeader } from "@/components/constellation/constellation-page-header";
import { ConstellationInnerPage } from "@/components/constellation/constellation-inner-page";
import { ConstellationGlassCard } from "@/components/constellation/constellation-spine";
import { MarketingForm } from "@/components/marketing-form";
import { EU_MARKETS, REVENUE_STREAMS } from "@/lib/pricing-catalog";

export default function EuropePage() {
  return (
    <MarketingLayout active="Europe">
      <ConstellationPageHeader
        eyebrow="IE · UK · EU"
        title={
          <>
            Built for <em>Europe</em>
          </>
        }
        subtitle="Dashboard in English today. Liv on customer channels in market language. Jurisdiction packs for currency, cancellation, GDPR."
      />

      <ConstellationInnerPage wide>
        <section className="pb-10">
          <p className="cst-section-label">Markets</p>
          <h2 className="cst-page-section__title">Markets we serve</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {EU_MARKETS.map((m) => (
              <ConstellationGlassCard key={m.code} className="p-5">
                <div className="flex justify-between items-baseline gap-2">
                  <h3 className="font-medium">{m.label}</h3>
                  <span className="text-xs text-muted-foreground font-mono">{m.currency}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{m.language}</p>
              </ConstellationGlassCard>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-8 max-w-prose">
            <Link href="/de" className="cst-page-link">
              Deutsche Marketing-Seite →
            </Link>
            {" · "}
            Pick jurisdiction at onboarding — timezone, regulatory footer, and channel priorities follow.
          </p>
        </section>

        <section className="cst-page-section">
          <p className="cst-section-label">Pricing</p>
          <h2 className="cst-page-section__title">How we price across borders</h2>
          <ul className="space-y-4">
            {REVENUE_STREAMS.slice(0, 4).map((r) => (
              <li key={r.id} className="cst-prose-section">
                <p className="cst-prose-section__body">
                  <strong className="text-foreground font-medium">{r.title}</strong> — {r.body}
                </p>
              </li>
            ))}
            <li className="cst-prose-section">
              <p className="cst-prose-section__body">
                <strong className="text-foreground font-medium">VAT</strong> — EU B2B with valid VAT ID:
                reverse charge at checkout. UK and IE consumers see prices ex. VAT where applicable.
              </p>
            </li>
          </ul>
          <p className="mt-8">
            <Link href="/pricing" className="cst-page-link">
              Full pricing & revenue streams →
            </Link>
          </p>
        </section>
      </ConstellationInnerPage>

      <section className="cst-waitlist" id="waitlist">
        <div className="cst-waitlist__inner">
          <h2 className="cst-waitlist__title">Join the closed beta</h2>
          <p className="cst-waitlist__sub">IE · UK · EU. Invite batches.</p>
          <MarketingForm />
        </div>
      </section>
    </MarketingLayout>
  );
}
