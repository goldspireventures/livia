import { MarketingLayout } from "@/components/marketing-layout";
import { EditorialPageHeader } from "@/components/editorial-page-header";
import { EditorialArticle, EditorialChapterLabel } from "@/components/editorial-article";

/**
 * Informational only — counsel review before Gate 3 (M-02).
 * Does not claim high-risk conformity assessment.
 */
export default function EuAiPage() {
  return (
    <MarketingLayout active="EU AI">
      <EditorialArticle>
        <EditorialChapterLabel>Compliance</EditorialChapterLabel>
        <EditorialPageHeader
          title="Liv and the EU AI Act"
          subtitle="Liv is an AI system that helps appointment-based businesses handle booking conversations. We design for transparency, human oversight, and EU data protection — not for replacing professional judgement in regulated domains."
        />

        <div className="space-y-10 text-sm text-muted-foreground mt-12">
          <section className="border-l border-white/10 pl-5 sm:pl-6">
            <h2 className="text-lg font-medium text-foreground mb-3">What Liv does today</h2>
            <ul className="space-y-2 leading-relaxed">
              <li>Books, reschedules, and answers routine questions within your policies.</li>
              <li>Discloses that the customer is interacting with AI on first contact per channel.</li>
              <li>Escalates to your team when confidence is low or your rules require a human.</li>
              <li>Records actions in an audit log your team can review.</li>
            </ul>
          </section>

          <section className="border-l border-white/10 pl-5 sm:pl-6">
            <h2 className="text-lg font-medium text-foreground mb-3">What Liv does not do</h2>
            <ul className="space-y-2 leading-relaxed">
              <li>Clinical diagnosis, triage, or employment decisions on your behalf.</li>
              <li>Impersonate a specific human without disclosure.</li>
              <li>Operate outside the policies you configure in Livia.</li>
            </ul>
          </section>

          <section className="border-l border-white/10 pl-5 sm:pl-6">
            <h2 className="text-lg font-medium text-foreground mb-3">Human oversight</h2>
            <p className="leading-relaxed">
              Owners and managers can take over any conversation, set refund caps, and review Liv&apos;s
              decisions. High-impact actions above your limits require human approval.
            </p>
          </section>

          <section className="border-l border-white/10 pl-5 sm:pl-6">
            <h2 className="text-lg font-medium text-foreground mb-3">Data</h2>
            <p className="leading-relaxed">
              Personal data is processed under our DPA with your business. Sub-processors and residency
              commitments are listed in our legal documentation at public launch.
            </p>
          </section>

          <p className="text-xs border-t border-white/10 pt-8 leading-relaxed">
            This page is informational and may be updated as regulation and product capabilities evolve.
            It is not legal advice.
          </p>
        </div>
      </EditorialArticle>
    </MarketingLayout>
  );
}
