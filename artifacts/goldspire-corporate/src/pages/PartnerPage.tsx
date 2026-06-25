import { PageHeader } from "@/components/PageHeader";
import { PartnershipSection } from "@/components/home/PartnershipSection";

export function PartnerPage() {
  return (
    <>
      <PageHeader
        label="PARTNERSHIP"
        title="Partner with Goldspire"
        description="We collaborate with ambitious organizations solving meaningful problems."
      />
      <PartnershipSection />
    </>
  );
}
