import { PageHeader } from "@/components/PageHeader";
import { PhilosophySection } from "@/components/home/PhilosophySection";
import { FounderSection } from "@/components/home/FounderSection";

export function PhilosophyPage() {
  return (
    <>
      <PageHeader
        label="PHILOSOPHY"
        title="Most companies build products. We build ecosystems."
        description="How Goldspire identifies large-scale problems and creates companies capable of solving them."
      />
      <PhilosophySection />
      <FounderSection />
    </>
  );
}
