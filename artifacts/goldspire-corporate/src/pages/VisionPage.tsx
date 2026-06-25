import { PageHeader } from "@/components/PageHeader";
import { Vision2035Section } from "@/components/home/Vision2035Section";
import { MetricsSection } from "@/components/home/MetricsSection";

export function VisionPage() {
  return (
    <>
      <PageHeader
        label="VISION 2035"
        title="A portfolio built for global scale"
        description="Transformative companies serving millions across Africa and global markets."
      />
      <Vision2035Section />
      <MetricsSection />
    </>
  );
}
