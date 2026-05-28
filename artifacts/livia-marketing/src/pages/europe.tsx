import { Link } from "wouter";
import { MarketingLayout } from "@/components/marketing-layout";
import { EditorialPageHeader } from "@/components/editorial-page-header";
import { EditorialArticle } from "@/components/editorial-article";
import { MarketingForm } from "@/components/marketing-form";
import { EU_MARKETS, REVENUE_STREAMS } from "@/lib/pricing-catalog";

export default function EuropePage() {
  return (
    <MarketingLayout active="Europe">
      <EditorialArticle wide>
        <EditorialPageHeader
          title="Europe"
          subtitle="Dashboard in English today. Liv on customer channels in market language. Jurisdiction packs for currency, cancellation, GDPR."
        />

        <h2 className="font-serif text-2xl mb-6 mt-12">Markets we serve</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {EU_MARKETS.map((m) => (
            <div key={m.code} className="rounded-sm border border-white/10 p-5 bg-white/[0.02]">
              <div className="flex justify-between items-baseline gap-2">
                <h3 className="font-medium">{m.label}</h3>
                <span className="text-xs text-muted-foreground font-mono">{m.currency}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">{m.language}</p>
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground mt-8 editorial-measure">
          <Link href="/de" className="text-aurora-cyan hover:text-white">
            Deutsche Marketing-Seite →
          </Link>
          {" · "}
          Pick jurisdiction at onboarding — timezone, regulatory footer, and channel priorities follow.
        </p>
      </EditorialArticle>

      <EditorialArticle wide className="border-t border-white/5 pt-12">
        <h2 className="font-serif text-2xl mb-6">How we price across borders</h2>
        <ul className="space-y-4 text-sm text-muted-foreground">
          {REVENUE_STREAMS.slice(0, 4).map((r) => (
            <li key={r.id} className="border-l border-white/10 pl-4">
              <strong className="text-foreground font-medium">{r.title}</strong> — {r.body}
            </li>
          ))}
          <li className="border-l border-white/10 pl-4">
            <strong className="text-foreground font-medium">VAT</strong> — EU B2B with valid VAT ID:
            reverse charge at checkout. UK and IE consumers see prices ex. VAT where applicable.
          </li>
        </ul>
        <p className="mt-8">
          <Link href="/pricing" className="text-aurora-cyan hover:text-white min-h-[44px] inline-flex items-center">
            Full pricing & revenue streams →
          </Link>
        </p>
      </EditorialArticle>

      <section className="px-4 sm:px-6 py-16 border-t border-white/5" id="waitlist">
        <div className="max-w-xl">
          <h2 className="font-serif text-2xl sm:text-3xl mb-4">Join the closed beta</h2>
          <p className="text-muted-foreground mb-8 editorial-measure">IE · UK · EU. Invite batches.</p>
          <MarketingForm />
        </div>
      </section>
    </MarketingLayout>
  );
}
