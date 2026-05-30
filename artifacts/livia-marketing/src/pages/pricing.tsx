import { Link } from "wouter";

import { MarketingLayout } from "@/components/marketing-layout";
import { EditorialPageHeader } from "@/components/editorial-page-header";

import { MarketingForm } from "@/components/marketing-form";

import {

  ADD_ONS,

  CORE_PLANS,

  EXPANSION_PLANS,

  REVENUE_STREAMS,

  planMarketingCard,

} from "@/lib/pricing-catalog";

import { Check } from "lucide-react";



const PLAN_FEATURES: Record<string, string[]> = {

  solo: [

    "Liv inbox: SMS, email & public chat",

    "Voice receptionist (outcome share, capped)",

    "Public booking page + mobile app",

    "Deposits via Stripe Connect",

    "Audit log + booking continuity",

  ],

  studio: [

    "Everything in Solo",

    "Per-seat team tools + delegations",

    "Payroll export + advanced handoffs",

    "Inbox take-over for managers",

  ],

  chain: [

    "Per-location billing",

    "Chain rollup + multi-brand",

    "Enterprise audit export + SSO",

    "Partner API (alpha)",

  ],

  "chair-host": [

    "Chair rental rent collection",

    "Landlord dashboard without renter PII",

    "Per-renter seat pricing",

  ],

};



export default function PricingPage() {

  return (

    <MarketingLayout active="Pricing">

      <div className="max-w-6xl mx-auto">
        <EditorialPageHeader
          title="Pricing"
          subtitle="EUR. Beta free. Rates lock at launch. No commission on your appointments."
        >
          <p className="text-sm text-muted-foreground/80 mt-4">
            <Link href="/europe" className="text-aurora-cyan hover:text-white min-h-[44px] inline-flex items-center">
              Europe, languages & VAT →
            </Link>
          </p>
        </EditorialPageHeader>
      </div>



      <section className="px-6 pb-8 max-w-5xl mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-6">

        {CORE_PLANS.map((id) => {

          const card = planMarketingCard(id);

          return (

            <div

              key={id}

              className="rounded-sm border border-white/10 p-8 flex flex-col bg-[#0c0c10]/80 backdrop-blur-sm"

            >

              <h2 className="text-xl font-serif">{card.name}</h2>

              <p className="text-3xl font-semibold mt-2">
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

                    <Check className="h-4 w-4 text-aurora-cyan shrink-0" />

                    {f}

                  </li>

                ))}

              </ul>

              {card.voiceNote ? (

                <p className="text-xs text-muted-foreground mt-4 border-t border-white/10 pt-3">{card.voiceNote}</p>

              ) : null}

              {id === "chair-host" ? (
                <Link
                  href="/for/chair-rental"
                  className="text-sm text-aurora-cyan mt-4 inline-block hover:text-white"
                >
                  Chair rental →
                </Link>
              ) : null}

            </div>

          );

        })}

      </section>



      <section className="px-6 py-12 max-w-4xl mx-auto border-t border-white/5">

        <h2 className="text-2xl font-serif mb-6">Host, mid-chain & franchise</h2>

        <div className="grid md:grid-cols-3 gap-4">

          {EXPANSION_PLANS.map((e) => (

            <div key={e.id} className="rounded-xl border border-white/10 p-6">

              <h3 className="font-medium">{e.name}</h3>

              <p className="text-2xl font-semibold mt-1">{e.price}</p>

              <p className="text-sm text-muted-foreground mt-2">{e.desc}</p>

            </div>

          ))}

        </div>

      </section>



      <section className="px-6 py-12 max-w-3xl mx-auto border-t border-white/5">

        <h2 className="text-2xl font-serif mb-6">How Livia earns (transparent)</h2>

        <ul className="space-y-5">

          {REVENUE_STREAMS.map((r) => (

            <li key={r.id} className="rounded-sm border border-white/10 p-5 border-l-2 border-l-aurora-cyan/20 pl-5">

              <h3 className="font-medium text-foreground">{r.title}</h3>

              <p className="text-sm text-muted-foreground mt-2">{r.body}</p>

            </li>

          ))}

        </ul>

      </section>



      <section className="px-6 py-12 max-w-4xl mx-auto border-t border-white/5">

        <h2 className="text-xl font-serif mb-4">Add-ons</h2>

        <div className="grid sm:grid-cols-2 gap-4">

          {ADD_ONS.map((a) => (

            <div key={a.name} className="rounded-lg border border-white/10 p-4 text-sm">

              <div className="flex justify-between gap-2">

                <span className="font-medium">{a.name}</span>

                <span className="text-aurora-cyan">{a.price}</span>

              </div>

              <p className="text-muted-foreground mt-2">{a.desc}</p>

            </div>

          ))}

        </div>

      </section>



      <section className="px-6 py-16 border-t border-white/5" id="waitlist">

        <div className="max-w-xl px-4 sm:px-6 mx-auto">

          <h2 className="text-2xl font-serif mb-4">Join the closed beta</h2>

          <p className="text-sm text-muted-foreground mb-6 editorial-measure">
            Design partners: 12 months at 50% + free migration concierge.
          </p>

          <MarketingForm />

        </div>

      </section>

    </MarketingLayout>

  );

}

