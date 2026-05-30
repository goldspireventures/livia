import { Link } from "wouter";
import { MarketingLayout } from "@/components/marketing-layout";
import { EditorialPageHeader } from "@/components/editorial-page-header";
import { EditorialArticle } from "@/components/editorial-article";
import { dashboardDemoUrl } from "@/lib/marketing-links";

const CHAPTERS = [
  {
    title: "Book",
    body: "Clients book on your branded page — no app download, no account. Phone and email are enough to start the thread.",
  },
  {
    title: "Inbox",
    body: "Every DM, text, and call lands in one calm inbox. Liv drafts replies; you take over any thread in one tap.",
  },
  {
    title: "Today",
    body: "The shop floor view — who's in, what's next, deposits and proofs waiting. Mobile-first for the team on their feet.",
  },
  {
    title: "Liv",
    body: "Your AI colleague — not a bolt-on chatbot. Liv knows your services, policies, and vertical pack. Warm, precise, EU-honest.",
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
