import { PageHeader } from "@/components/PageHeader";
import { PortfolioSection } from "@/components/home/PortfolioSection";

export function PortfolioPage() {
  return (
    <>
      <PageHeader
        label="PORTFOLIO"
        title="Companies under the Goldspire umbrella"
        description="Each venture stands alone — with its own narrative, team, and trajectory."
      />
      <PortfolioSection />
    </>
  );
}
