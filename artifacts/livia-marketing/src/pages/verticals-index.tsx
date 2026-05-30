import { Link } from "wouter";
import { MarketingLayout } from "@/components/marketing-layout";
import { EditorialPageHeader } from "@/components/editorial-page-header";
import { EditorialArticle, EditorialChapterLabel } from "@/components/editorial-article";
import { MARKETING_VERTICAL_LINKS } from "@/lib/marketing-verticals";

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
          {MARKETING_VERTICAL_LINKS.map((v) => (
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
