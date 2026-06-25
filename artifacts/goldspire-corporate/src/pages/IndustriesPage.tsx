import { PageHeader } from "@/components/PageHeader";
import { IndustriesSection } from "@/components/home/IndustriesSection";

export function IndustriesPage() {
  return (
    <>
      <PageHeader
        label="INDUSTRIES"
        title="Where we build"
        description="From financial infrastructure to intelligent platforms — the sectors where we originate and scale ventures."
      />
      <IndustriesSection />
    </>
  );
}
