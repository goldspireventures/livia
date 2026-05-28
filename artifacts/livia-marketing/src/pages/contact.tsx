import { MarketingLayout } from "@/components/marketing-layout";
import { EditorialPageHeader } from "@/components/editorial-page-header";
import { MarketingForm } from "@/components/marketing-form";

export default function ContactPage() {
  return (
    <MarketingLayout active="Contact">
      <div className="max-w-xl mx-auto px-4 sm:px-6 pb-20">
        <EditorialPageHeader
          title="Contact"
          subtitle="We read every message. Onboarded? Help is in the app."
        />
        <p className="text-sm text-muted-foreground mb-10 -mt-6">
          <a
            href="mailto:hello@livia.io"
            className="text-aurora-cyan hover:text-white min-h-[44px] inline-flex items-center"
          >
            hello@livia.io
          </a>
        </p>
        <MarketingForm />
      </div>
    </MarketingLayout>
  );
}
