import { Link } from "wouter";
import { MarketingLayout } from "@/components/marketing-layout";
import { EditorialPageHeader } from "@/components/editorial-page-header";
import { EditorialArticle } from "@/components/editorial-article";
import { INBOX_CHANNELS_DETAIL } from "@/lib/marketing-copy";
import { dashboardDemoUrl } from "@/lib/marketing-links";

const CHAPTERS = [
  {
    title: "Liv answers",
    body: `${INBOX_CHANNELS_DETAIL} Voice when telephony is configured.`,
  },
  {
    title: "One calendar",
    body: "Bookings, clients, team. Staff invites by email.",
  },
  {
    title: "You stay in control",
    body: "Take over any thread. Refunds. Hash-chained audit log.",
  },
  {
    title: "Europe",
    body: "GDPR-first. IE, UK, EU. Only what we ship.",
  },
] as const;

export default function HowItWorksPage() {
  return (
    <MarketingLayout active="How it works">
      <EditorialArticle className="pb-8">
        <EditorialPageHeader
          title="How it works"
          subtitle="Livia is the OS. Liv works the inbox. Not a marketplace."
        />
      </EditorialArticle>

      <div className="px-4 sm:px-6 pb-20 max-w-3xl mx-auto space-y-14 sm:space-y-16">
        {CHAPTERS.map((ch) => (
          <article key={ch.title} className="border-l border-white/10 pl-6 sm:pl-8">
            <h2 className="font-serif text-2xl sm:text-3xl tracking-tight mb-3">{ch.title}</h2>
            <p className="text-muted-foreground leading-relaxed">{ch.body}</p>
          </article>
        ))}

        <p className="pt-4 flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-4 text-sm">
          <a
            href={dashboardDemoUrl}
            data-testid="marketing-demo-link"
            className="inline-flex items-center min-h-[44px] text-aurora-cyan hover:text-white transition-colors"
          >
            See the live demo →
          </a>
          <Link href="/pricing" className="inline-flex items-center min-h-[44px] text-muted-foreground hover:text-white">
            View pricing
          </Link>
          <Link href="/" className="inline-flex items-center min-h-[44px] text-muted-foreground hover:text-white">
            Back to home
          </Link>
        </p>
      </div>
    </MarketingLayout>
  );
}
