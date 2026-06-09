import { MarketingLayout } from "@/components/marketing-layout";
import { ConstellationPageHeader } from "@/components/constellation/constellation-page-header";
import { ConstellationInnerPage } from "@/components/constellation/constellation-inner-page";

/**
 * Informational only — counsel review before Gate 3 (M-02).
 * Does not claim high-risk conformity assessment.
 */
export default function EuAiPage() {
  return (
    <MarketingLayout active="EU AI">
      <ConstellationInnerPage narrow>
        <ConstellationPageHeader
          eyebrow="Compliance"
          title={
            <>
              Liv and the <em>EU AI Act</em>
            </>
          }
          subtitle="Liv is an AI system that helps appointment-based businesses handle booking conversations. We design for transparency, human oversight, and EU data protection — not for replacing professional judgement in regulated domains."
        />

        <div className="space-y-10 mt-12">
          <section className="cst-prose-section">
            <h2 className="cst-prose-section__title">What Liv does today</h2>
            <ul className="cst-prose-section__body space-y-2">
              <li>Books, reschedules, and answers routine questions within your policies.</li>
              <li>Discloses that the customer is interacting with AI on first contact per channel.</li>
              <li>Escalates to your team when Liv isn&apos;t sure, or your rules require a person.</li>
              <li>Records actions in an activity history your team can review.</li>
            </ul>
          </section>

          <section className="cst-prose-section">
            <h2 className="cst-prose-section__title">What Liv does not do</h2>
            <ul className="cst-prose-section__body space-y-2">
              <li>Clinical diagnosis, triage, or employment decisions on your behalf.</li>
              <li>Impersonate a specific human without disclosure.</li>
              <li>Operate outside the policies you configure in Livia.</li>
            </ul>
          </section>

          <section className="cst-prose-section">
            <h2 className="cst-prose-section__title">Human oversight</h2>
            <p className="cst-prose-section__body">
              Owners and managers can take over any conversation, set refund caps, and read what Liv
              sent. Big refunds or exceptions need your approval.
            </p>
          </section>

          <section className="cst-prose-section">
            <h2 className="cst-prose-section__title">Data</h2>
            <p className="cst-prose-section__body">
              Personal data is handled under our data agreement with your business. Who we use and where
              data is stored is listed in our legal docs at launch.
            </p>
          </section>

          <p className="text-xs border-t border-white/10 pt-8 leading-relaxed text-muted-foreground">
            This page is informational and may be updated as regulation and product capabilities evolve.
            It is not legal advice.
          </p>
        </div>
      </ConstellationInnerPage>
    </MarketingLayout>
  );
}
