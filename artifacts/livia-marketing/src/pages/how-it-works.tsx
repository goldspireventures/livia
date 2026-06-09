import { Link } from "wouter";
import { MarketingLayout } from "@/components/marketing-layout";
import { ConstellationPageHeader } from "@/components/constellation/constellation-page-header";
import { ConstellationPageFooter } from "@/components/constellation/constellation-inner-page";
import { ConstellationSpine } from "@/components/constellation/constellation-spine";
import { marketingDemoPath } from "@/lib/marketing-links";

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
    body: "Your AI colleague — built into Livia, not a bolt-on widget. Liv knows your services, booking rules, and trade. Warm, precise, and honest with customers about AI.",
  },
] as const;

export default function HowItWorksPage() {
  return (
    <MarketingLayout active="How it works">
      <ConstellationPageHeader
        eyebrow="One OS · four chapters"
        title={
          <>
            How it <em>works</em>
          </>
        }
        subtitle="Livia is your platform. Liv works the inbox. Not a marketplace."
      />

      <ConstellationSpine steps={[...CHAPTERS]} />

      <ConstellationPageFooter>
        <p>Every trade shares the same basics — your calendar, client history, booking rules, and messages in one place.</p>
        <Link href={marketingDemoPath} data-testid="marketing-demo-link" className="cst-page-link">
          Book a demo →
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
