import { Link } from "wouter";
import { MarketingLayout } from "@/components/marketing-layout";
import { EditorialPageHeader } from "@/components/editorial-page-header";
import { EditorialArticle, EditorialChapterLabel } from "@/components/editorial-article";

const VERTICAL_LINKS = [
  { slug: "hair", label: "Hair & barbering" },
  { slug: "beauty", label: "Beauty & nails" },
  { slug: "wellness", label: "Wellness & therapy" },
  { slug: "fitness", label: "Fitness & studios" },
  { slug: "body-art", label: "Body art & piercing" },
  { slug: "pet-grooming", label: "Pet grooming" },
  { slug: "allied-health", label: "Allied health" },
  { slug: "medspa", label: "Medspa & aesthetics" },
  { slug: "automotive-detailing", label: "Automotive detailing" },
] as const;

export default function VerticalsIndexPage() {
  return (
    <MarketingLayout active="Verticals">
      <EditorialArticle wide>
        <EditorialChapterLabel>Verticals</EditorialChapterLabel>
        <EditorialPageHeader
          title="Verticals"
          subtitle="One platform. Vertical packs for language, policies, booking flows."
        />

        <ul className="grid sm:grid-cols-2 gap-3 mt-10">
          {VERTICAL_LINKS.map((v) => (
            <li key={v.slug}>
              <Link
                href={`/verticals/${v.slug}`}
                className="block rounded-sm border border-white/10 bg-white/[0.03] px-4 py-4 min-h-[52px] flex items-center hover:border-aurora-cyan/40 transition-colors"
              >
                {v.label}
              </Link>
            </li>
          ))}
        </ul>
      </EditorialArticle>
    </MarketingLayout>
  );
}
