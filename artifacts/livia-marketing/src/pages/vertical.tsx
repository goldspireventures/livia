import { useRoute } from "wouter";
import { MarketingLayout } from "@/components/marketing-layout";
import { EditorialPageHeader } from "@/components/editorial-page-header";
import { EditorialArticle, EditorialChapterLabel, EditorialPainList } from "@/components/editorial-article";
import { MarketingForm } from "@/components/marketing-form";
import { dashboardDemoUrl } from "@/lib/marketing-links";

const VERTICALS: Record<
  string,
  { title: string; headline: string; pains: string[]; liv: string }
> = {
  hair: {
    title: "Hair & barbering",
    headline: "Chairs booked. Phones answered. Clients remembered.",
    pains: ["Missed calls while you're mid-cut", "DM chaos on Instagram", "No-show gaps in the diary"],
    liv: "Liv books cuts and colours, sends reminders, and keeps patch-test notes where your policies require them.",
  },
  beauty: {
    title: "Beauty & nails",
    headline: "Treatments scheduled without the back-and-forth.",
    pains: ["Clients asking the same questions", "Last-minute cancellations", "Spreadsheet client lists"],
    liv: "Liv handles treatment enquiries, respects duration rules, and keeps your menu accurate.",
  },
  barber: {
    title: "Barbershops",
    headline: "Walk-ins and bookings in one calm flow.",
    pains: ["Queue at the door + phone ringing", "Fresha fees on your clients", "No memory of regulars"],
    liv: "Fast tone, slot-aware booking, and client history on every reply.",
  },
  tattoo: {
    title: "Tattoo & piercing",
    headline: "Consults and sessions — organised, not improvised.",
    pains: ["Long DM threads before a deposit", "Artist-specific calendars", "Consent and consult steps"],
    liv: "Liv qualifies consults, books session length correctly, and never rushes the relationship.",
  },
  wellness: {
    title: "Wellness & therapy",
    headline: "Sessions held with a quieter operational rhythm.",
    pains: ["Evening enquiry overload", "Policy-heavy reschedules", "Multi-practitioner scheduling"],
    liv: "Calmer cadence, clear policies, and practitioner-aware availability.",
  },
  fitness: {
    title: "Fitness & studios",
    headline: "Classes and 1:1s — one schedule, not three apps.",
    pains: ["DMs for class spots", "No-show on packs", "Roster chaos across trainers"],
    liv: "Liv books class sessions and 1:1 slots, respects capacity, and nudges waitlists when you turn them on.",
  },
  "body-art": {
    title: "Body art & piercing",
    headline: "Consults, proofs, and session length — handled with care.",
    pains: ["Deposit threads in DMs", "Artist-specific calendars", "Design approval before the chair"],
    liv: "Liv qualifies consults, tracks design-proof steps, and books session length correctly — never rushes the relationship.",
  },
  "pet-grooming": {
    title: "Pet grooming",
    headline: "Every groom booked — pet details in one thread.",
    pains: [
      "Parents booking online then texting breed pics separately",
      "Behaviour and allergy notes lost between DMs",
      "Rebook cycles every 4–8 weeks hard to track",
    ],
    liv: "Liv books grooms, collects pet details and photos in the same thread, and nudges rebooks on your cycle.",
  },
  "allied-health": {
    title: "Allied health adjacency",
    headline: "Sessions scheduled — not primary care.",
    pains: [
      "Intake scattered across email",
      "Confusion between consult and treatment length",
      "Rebooking after assessment",
    ],
    liv: "Liv books physio, hygiene, and coaching sessions with calm intake — we do not replace clinical records systems.",
  },
  medspa: {
    title: "Medspa & aesthetics",
    headline: "Appointments with intake and consent — not chaos in the inbox.",
    pains: ["Consult vs treatment confusion", "Consent before chair time", "Regulated copy per market"],
    liv: "Calm, clinical tone; intake and consent workflows when your counsel signs them off.",
  },
  "automotive-detailing": {
    title: "Automotive detailing",
    headline: "Bay time booked with vehicle details upfront.",
    pains: ["Vague online books without make/model", "DM threads for add-ons and access", "No-show bays empty"],
    liv: "Liv captures vehicle details in-thread after book and keeps add-ons off Instagram-only chaos.",
  },
};

export default function VerticalPage() {
  const [, params] = useRoute("/verticals/:slug");
  const slug = params?.slug ?? "hair";
  const v = VERTICALS[slug] ?? VERTICALS.hair;

  return (
    <MarketingLayout active="Verticals">
      <EditorialArticle>
        <EditorialChapterLabel>Vertical</EditorialChapterLabel>
        <EditorialPageHeader title={v.title} subtitle={v.headline} />

        <h2 className="text-lg font-medium mb-4 mt-10">What hurts today</h2>
        <EditorialPainList items={v.pains} />

        <h2 className="text-lg font-medium mb-3">How Liv helps</h2>
        <p className="editorial-measure text-muted-foreground leading-relaxed mb-10">{v.liv}</p>

        <p className="mb-12">
          <a
            href={dashboardDemoUrl}
            className="inline-flex items-center min-h-[44px] text-aurora-cyan hover:text-white font-medium transition-colors"
            data-testid="marketing-demo-link"
          >
            Try this vertical in the live demo →
          </a>
        </p>

        <div className="border-t border-white/10 pt-12">
          <h2 className="font-serif text-2xl mb-6">Join the beta</h2>
          <MarketingForm />
        </div>
      </EditorialArticle>
    </MarketingLayout>
  );
}
