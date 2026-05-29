import { MarketingLayout } from "@/components/marketing-layout";
import { EditorialArticle } from "@/components/editorial-article";
import { EditorialPageHeader } from "@/components/editorial-page-header";
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
      <EditorialArticle>
        <EditorialPageHeader title={TITLES[kind]} />
        <div className="prose prose-invert max-w-none text-sm text-muted-foreground space-y-4 mt-8">
          <p>
            <strong className="text-foreground">{LEGAL_ENTITY_NAME}</strong> operates Livia for EU appointment
            businesses. This page is a <strong className="text-foreground">beta scaffold</strong> — counsel-reviewed
            versions ship before general availability.
          </p>
          <p>
            For product access:{" "}
            <a href={dashboardSignUpUrl} className="text-aurora-cyan hover:text-white">
              create an account
            </a>{" "}
            or{" "}
            <a href={dashboardSignInUrl} className="text-aurora-cyan hover:text-white">
              sign in
            </a>{" "}
            at {marketingOrigin.replace(/^https?:\/\//, "")}.
          </p>
          <p>
            Questions:{" "}
            <a href="mailto:hello@livia-hq.com" className="text-aurora-cyan hover:text-white">
              hello@livia-hq.com
            </a>
          </p>
        </div>
      </EditorialArticle>
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
