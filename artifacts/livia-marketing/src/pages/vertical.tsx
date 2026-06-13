import { useRoute } from "wouter";
import { Link } from "wouter";
import { MarketingLayout } from "@/components/marketing-layout";
import { ConstellationPageHeader } from "@/components/constellation/constellation-page-header";
import { ConstellationInnerPage, ConstellationPainList } from "@/components/constellation/constellation-inner-page";
import { ConstellationGlassCard } from "@/components/constellation/constellation-spine";
import { MarketingForm } from "@/components/marketing-form";
import { marketingBookDemoUrl } from "@/lib/marketing-links";

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
    headline: "Lash, brow, and nail studios — calm ops, link-in-bio booking.",
    pains: [
      "DMs asking patch-test and fill dates",
      "Last-minute gaps in the chair plan",
      "Client lists split across notes and Instagram",
    ],
    liv: "Liv sorts your inbox, books with your durations and patch-test rules, and keeps your branded booking page in sync with your menu.",
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
    liv: "Liv books class sessions and 1:1 slots, respects capacity, and nudges active waitlists.",
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
    liv: "Calm, clinical tone; intake and consent workflows aligned with your counsel.",
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
      <ConstellationInnerPage narrow>
        <ConstellationPageHeader
          eyebrow="Vertical"
          title={v.title}
          subtitle={v.headline}
        />

        <section className="mt-10">
          <p className="cst-section-label">Today</p>
          <h2 className="text-lg font-medium mb-4">What hurts today</h2>
          <ConstellationPainList items={v.pains} />
        </section>

        <ConstellationGlassCard className="p-6 mb-10">
          <p className="cst-section-label">Liv</p>
          <h2 className="text-lg font-medium mb-3">How Liv helps</h2>
          <p className="text-muted-foreground leading-relaxed">{v.liv}</p>
        </ConstellationGlassCard>

        <p className="mb-12">
          <Link
            href={marketingBookDemoUrl(slug === "tattoo" ? "body-art" : slug)}
            className="cst-page-link"
            data-testid="marketing-demo-link"
          >
            Book a demo for this vertical →
          </Link>
        </p>

        <section className="cst-page-section pt-8">
          <h2 className="cst-waitlist__title">Join the beta</h2>
          <MarketingForm />
        </section>

        <p className="mt-8">
          <Link href="/verticals" className="cst-page-link cst-page-link--muted">
            All verticals
          </Link>
        </p>
      </ConstellationInnerPage>
    </MarketingLayout>
  );
}
