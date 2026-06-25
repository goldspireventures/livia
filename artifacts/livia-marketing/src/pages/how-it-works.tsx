import { Link } from "wouter";
import { MarketingLayout } from "@/components/marketing-layout";
import { ConstellationPageHeader } from "@/components/constellation/constellation-page-header";
import { ConstellationPageFooter } from "@/components/constellation/constellation-inner-page";
import { ConstellationSpine } from "@/components/constellation/constellation-spine";
import { marketingGetStartedPath } from "@/lib/marketing-links";

const CHAPTERS = [
  {
    title: "Book",
    body: "Clients book on your branded page — no app download, no account. Phone and email are enough to start the conversation.",
  },
  {
    title: "Inbox",
    body: "SMS, email, and your public booking chat land in one inbox today. Liv drafts replies; you take over any conversation in one tap. More channels (e.g. Instagram, WhatsApp) roll out with pilot shops.",
  },
  {
    title: "Today",
    body: "Your shop-floor view — who's in, what's next, and photos or forms still needed. Mobile-first for your team on their feet.",
  },
  {
    title: "Liv",
    body: "Replies after hours in your tone. Knows your services and booking rules. Customers are told when they're talking to AI.",
  },
] as const;

export default function HowItWorksPage() {
  return (
    <MarketingLayout active="How it works">
      <ConstellationPageHeader
        eyebrow="How Livia works"
        title={
          <>
            How it <em>works</em>
          </>
        }
        subtitle="Book, inbox, today, and Liv — four parts of the same product."
      />

      <ConstellationSpine steps={[...CHAPTERS]} />

      <ConstellationPageFooter>
        <p>Every trade shares the same basics — your calendar, client history, booking rules, and messages in one place.</p>
        <Link href={marketingGetStartedPath} data-testid="marketing-get-started-link" className="cst-page-link">
          Get started →
        </Link>
        <Link href="/pricing" className="cst-page-link cst-page-link--muted">
          View pricing
        </Link>
        <Link href="/" className="cst-page-link cst-page-link--muted">
          Back to home
        </Link>
      </ConstellationPageFooter>
    </MarketingLayout>
  );
}
