import { Link } from "wouter";
import { MarketingLayout } from "@/components/marketing-layout";
import { ConstellationPageHeader } from "@/components/constellation/constellation-page-header";
import { ConstellationPageFooter } from "@/components/constellation/constellation-inner-page";
import { ConstellationSpine } from "@/components/constellation/constellation-spine";
import { marketingDemoPath } from "@/lib/marketing-links";

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
    body: "Your shop-floor view — who's in, what's next, and proofs waiting. Mobile-first for your team on their feet.",
  },
  {
    title: "Liv",
    body: "Your AI colleague — not a bolt-on chatbot. Liv knows your services, policies, and vertical pack. Warm, precise, EU-honest.",
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
        subtitle="Livia is the OS. Liv works the inbox. Not a marketplace."
      />

      <ConstellationSpine steps={[...CHAPTERS]} />

      <ConstellationPageFooter>
        <p>Same physics on every floor — time, memory, policy, channels.</p>
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
