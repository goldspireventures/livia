import { MarketingLayout } from "@/components/marketing-layout";
import { ConstellationPageHeader } from "@/components/constellation/constellation-page-header";
import { ConstellationInnerPage } from "@/components/constellation/constellation-inner-page";
import { ConstellationGlassCard } from "@/components/constellation/constellation-spine";
import { MarketingForm } from "@/components/marketing-form";

export default function ContactPage() {
  return (
    <MarketingLayout active="Contact">
      <ConstellationInnerPage narrow>
        <ConstellationPageHeader
          eyebrow="We read every message"
          title={
            <>
              Get in <em>touch</em>
            </>
          }
          subtitle="Onboarded? Help is in the app. Otherwise — email or the form below."
        />
        <p className="text-sm text-muted-foreground mb-8 -mt-4">
          <a href="mailto:hello@livia-hq.com" className="cst-page-link">
            hello@livia-hq.com
          </a>
        </p>
        <ConstellationGlassCard className="p-6 sm:p-8">
          <MarketingForm />
        </ConstellationGlassCard>
      </ConstellationInnerPage>
    </MarketingLayout>
  );
}
