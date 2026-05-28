import { Link } from "wouter";

import { MarketingLayout } from "@/components/marketing-layout";

import { EditorialPageHeader } from "@/components/editorial-page-header";

import { EditorialArticle, EditorialChapterLabel, EditorialPainList } from "@/components/editorial-article";

import { MarketingForm } from "@/components/marketing-form";



const HOST_POINTS = [

  "Landlord dashboard — chairs, rent cycles, and reminders",

  "Per-renter billing (€99 + €19/renter) aligned with closed-beta pricing",

  "Aggregate occupancy — no downstream customer PII on the host view",

  "Renters use Solo/Studio tiers with their own Liv inbox and booking page",

];



export default function ForChairRentalPage() {

  return (

    <MarketingLayout active="For hosts">

      <EditorialArticle>

        <EditorialChapterLabel>Chair rental</EditorialChapterLabel>

        <EditorialPageHeader
          title="Chair rental"
          subtitle="Collect rent. See occupancy. No renter customer lists."
        />



        <h2 className="text-lg font-medium mb-4 mt-10">What hosts get</h2>

        <EditorialPainList items={HOST_POINTS} />



        <p className="text-sm text-muted-foreground/80 mb-12 editorial-measure">

          See also{" "}

          <Link href="/pricing" className="text-aurora-cyan hover:text-white">

            pricing

          </Link>{" "}

          and the{" "}

          <Link href="/verticals/hair" className="text-aurora-cyan hover:text-white">

            hair & barbering

          </Link>{" "}

          vertical.

        </p>



        <div className="border-t border-white/10 pt-12">

          <h2 className="font-serif text-2xl mb-6">Join the beta</h2>

          <MarketingForm />

        </div>

      </EditorialArticle>

    </MarketingLayout>

  );

}


