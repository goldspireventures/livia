import { MarketingLayout } from "@/components/marketing-layout";
import { ConstellationPageHeader } from "@/components/constellation/constellation-page-header";
import { ConstellationInnerPage } from "@/components/constellation/constellation-inner-page";
import { ConstellationGlassCard } from "@/components/constellation/constellation-spine";
import { dashboardSignInUrl, dashboardSignUpUrl, marketingOrigin } from "@/lib/marketing-links";
import { LEGAL_ENTITY_NAME } from "@/lib/company";

type LegalKind = "privacy" | "tos" | "dpa";

const TITLES: Record<LegalKind, string> = {
  privacy: "Privacy policy",
  tos: "Terms of service",
  dpa: "Data processing agreement",
};

export function LegalPage({ kind }: { kind: LegalKind }) {
  return (
    <MarketingLayout active="Legal">
      <ConstellationInnerPage narrow>
        <ConstellationPageHeader
          eyebrow="Legal"
          title={TITLES[kind]}
          subtitle={`${LEGAL_ENTITY_NAME} operates Livia for EU appointment businesses.`}
        />
        <ConstellationGlassCard className="p-6 sm:p-8 mt-8">
          <div className="prose prose-invert max-w-none text-sm text-muted-foreground space-y-4">
            <p>
              This page is a <strong className="text-foreground">beta scaffold</strong> — counsel-reviewed
              versions ship before general availability.
            </p>
            <p>
              For product access:{" "}
              <a href={dashboardSignUpUrl} className="cst-page-link">
                create an account
              </a>{" "}
              or{" "}
              <a href={dashboardSignInUrl} className="cst-page-link">
                sign in
              </a>{" "}
              at {marketingOrigin.replace(/^https?:\/\//, "")}.
            </p>
            <p>
              Questions:{" "}
              <a href="mailto:hello@livia-hq.com" className="cst-page-link">
                hello@livia-hq.com
              </a>
            </p>
          </div>
        </ConstellationGlassCard>
      </ConstellationInnerPage>
    </MarketingLayout>
  );
}

export function LegalPrivacyPage() {
  return <LegalPage kind="privacy" />;
}

export function LegalTosPage() {
  return <LegalPage kind="tos" />;
}

export function LegalDpaPage() {
  return <LegalPage kind="dpa" />;
}
