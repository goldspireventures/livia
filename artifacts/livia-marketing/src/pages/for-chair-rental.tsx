import { Link } from "wouter";

import { MarketingLayout } from "@/components/marketing-layout";
import { ConstellationPageHeader } from "@/components/constellation/constellation-page-header";
import { ConstellationInnerPage, ConstellationPainList } from "@/components/constellation/constellation-inner-page";
import { MarketingForm } from "@/components/marketing-form";
import { planMarketingCard } from "@/lib/pricing-catalog";

const hostCard = planMarketingCard("chair-host");

const HOST_POINTS = [
  "Your landlord dashboard — chairs, rent cycles, and reminders",
  `Per-renter billing (${hostCard.priceLabel.replace("/mo", "")}/mo base) aligned with closed-beta pricing`,
  "Aggregate occupancy — no downstream customer PII on your host view",
  "Renters use Solo/Studio tiers with their own Liv inbox and booking page",
];

export default function ForChairRentalPage() {
  return (
    <MarketingLayout active="For hosts">
      <ConstellationInnerPage narrow>
        <ConstellationPageHeader
          eyebrow="Chair rental"
          title={
            <>
              For <em>hosts</em>
            </>
          }
          subtitle="Collect rent. See occupancy. No renter customer lists on your dashboard."
        />

        <section className="mt-10">
          <p className="cst-section-label">Landlord view</p>
          <h2 className="text-lg font-medium mb-4">What hosts get</h2>
          <ConstellationPainList items={HOST_POINTS} />
        </section>

        <p className="text-sm text-muted-foreground/80 mb-12 max-w-prose">
          See also{" "}
          <Link href="/pricing" className="cst-page-link">
            pricing
          </Link>{" "}
          and the{" "}
          <Link href="/verticals/hair" className="cst-page-link">
            hair & barbering
          </Link>{" "}
          vertical.
        </p>

        <section className="cst-page-section pt-8">
          <h2 className="cst-waitlist__title">Join the beta</h2>
          <MarketingForm />
        </section>
      </ConstellationInnerPage>
    </MarketingLayout>
  );
}
