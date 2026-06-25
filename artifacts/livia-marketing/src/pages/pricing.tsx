import { Link } from "wouter";

import { MarketingLayout } from "@/components/marketing-layout";
import { ConstellationGlassCard } from "@/components/constellation/constellation-spine";
import { ConstellationPageHeader } from "@/components/constellation/constellation-page-header";
import { MarketingForm } from "@/components/marketing-form";
import {
  ADD_ONS,
  CORE_PLANS,
  EXPANSION_PLANS,
  planMarketingCard,
  formatEur,
} from "@/lib/pricing-catalog";
import { Check } from "lucide-react";
import { EVENT_OPERATOR_ADDON_EUR_CENTS } from "@workspace/entitlements";

const PLAN_FEATURES: Record<string, string[]> = {
  solo: [
    "Your Liv inbox: SMS, email, and public chat",
    "Voice receptionist (outcome share, capped in your digest)",
    "Your public booking page + mobile app",
    "Deposit-ready at public launch (Stripe Connect)",
    "Audit log + booking continuity",
  ],
  studio: [
    "Everything in Solo",
    "Per-seat team tools + delegations",
    "Payroll export + advanced handoffs",
    "Inbox take-over for your managers",
  ],
  chain: [
    "Per-location billing",
    "Chain rollup + multi-brand",
    "Enterprise audit export + SSO",
    "Partner API (alpha)",
  ],
  "chair-host": [
    "Your chair-rental rent collection",
    "Landlord dashboard without renter PII",
    "Per-renter seat pricing",
  ],
};

export default function PricingPage() {
  return (
    <MarketingLayout active="Pricing">
      <ConstellationPageHeader
        eyebrow="Pricing"
        title={
          <>
            Pricing that <em>scales with you</em>
          </>
        }
        subtitle="EUR list prices. Closed beta is on the house — your rate locks at launch. No commission on your appointments."
      >
        <p className="text-sm text-muted-foreground/80 mt-4">
          <Link href="/europe" className="cst-page-link">
            Your market: Europe, languages & VAT →
          </Link>
        </p>
      </ConstellationPageHeader>

      <section
        className="px-4 sm:px-6 pb-8 max-w-5xl mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-6"
        aria-label="Core plans"
      >
        {CORE_PLANS.map((id) => {
          const card = planMarketingCard(id);
          const featured = id === "studio";
          return (
            <ConstellationGlassCard key={id} featured={featured} className="p-8 flex flex-col">
              {featured ? (
                <p className="text-[10px] font-mono uppercase tracking-widest text-[#d9c39a]/80 mb-2">
                  Most teams
                </p>
              ) : null}
              <h2 className="text-xl font-serif">{card.name}</h2>
              <p className="cst-glass-card__price mt-2">
                {card.priceLabel.replace(/\/mo.*$/, "")}
                <span className="text-sm text-muted-foreground font-normal">/mo</span>
              </p>
              {card.priceLabel.includes("+") ? (
                <p className="text-xs text-muted-foreground mt-1">
                  {card.priceLabel.slice(card.priceLabel.indexOf("+"))}
                </p>
              ) : null}

              <ul className="space-y-2 text-sm flex-1 mt-6">
                {(PLAN_FEATURES[id] ?? []).map((f) => (
                  <li key={f} className="flex gap-2">
                    <Check className="h-4 w-4 cst-check shrink-0" aria-hidden />
                    {f}
                  </li>
                ))}
              </ul>

              {card.voiceNote ? (
                <p className="text-xs text-muted-foreground mt-4 border-t border-white/10 pt-3">{card.voiceNote}</p>
              ) : null}

              {id === "chair-host" ? (
                <Link href="/for/chair-rental" className="cst-page-link mt-4">
                  Chair rental →
                </Link>
              ) : null}
            </ConstellationGlassCard>
          );
        })}
      </section>

      <section className="cst-page-section px-4 sm:px-6 max-w-4xl mx-auto">
        <p className="cst-section-label">Expansion</p>
        <h2 className="cst-page-section__title">Host, mid-chain & franchise</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {EXPANSION_PLANS.map((e) => (
            <ConstellationGlassCard key={e.id} className="p-6">
              <h3 className="font-medium">{e.name}</h3>
              <p className="text-2xl font-semibold mt-1">{e.price}</p>
              <p className="text-sm text-muted-foreground mt-2">{e.desc}</p>
            </ConstellationGlassCard>
          ))}
        </div>
      </section>

      <section className="cst-page-section px-4 sm:px-6 max-w-3xl mx-auto">
        <p className="cst-section-label">Event operators</p>
        <h2 className="cst-page-section__title">Event Operator add-on</h2>
        <ConstellationGlassCard className="p-6">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Balloon artists, florists, and decor studios run enquiry → quote → milestone deposit.
            Add <strong className="text-foreground">Event Operator</strong> ({formatEur(EVENT_OPERATOR_ADDON_EUR_CENTS)}/mo)
            on Solo or Studio for consult-first inbox, quotes, milestone deposits, and your public site.
            Appointment-led businesses stay on base tiers only.
          </p>
        </ConstellationGlassCard>
      </section>

      <section className="cst-page-section px-4 sm:px-6 max-w-4xl mx-auto">
        <p className="cst-section-label">Optional</p>
        <h2 className="cst-page-section__title">Add-ons</h2>
        <p className="text-sm text-muted-foreground mb-4 max-w-2xl">
          Optional packs on top of your plan — shown at checkout when you need them, not hidden later.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          {ADD_ONS.filter((a) => a.name !== "Event Operator").map((a) => (
            <ConstellationGlassCard key={a.name} className="p-4 text-sm">
              <div className="flex justify-between gap-2">
                <span className="font-medium">{a.name}</span>
                <span className="text-[#d9c39a]">{a.price}</span>
              </div>
              <p className="text-muted-foreground mt-2">{a.desc}</p>
            </ConstellationGlassCard>
          ))}
        </div>
      </section>

      <section className="cst-waitlist" id="waitlist">
        <div className="cst-waitlist__inner">
          <h2 className="cst-waitlist__title">Join the closed beta</h2>
          <p className="cst-waitlist__sub">
            Design partners: 12 months at 50% off your tier + free migration concierge.
          </p>
          <MarketingForm />
        </div>
      </section>
    </MarketingLayout>
  );
}
