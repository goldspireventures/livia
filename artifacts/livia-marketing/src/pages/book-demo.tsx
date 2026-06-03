import { MarketingLayout } from "@/components/marketing-layout";
import { ConstellationInnerPage } from "@/components/constellation/constellation-inner-page";
import { ConstellationGlassCard } from "@/components/constellation/constellation-spine";
import { MarketingForm } from "@/components/marketing-form";
import { editorialCopy } from "@/lib/marketing-editorial-i18n";

export default function BookDemoPage() {
  const copy = editorialCopy("en").bookDemoPage;

  return (
    <MarketingLayout active="Book a demo">
      <ConstellationInnerPage narrow>
        <header className="mb-10">
          <p className="cst-section-label">{copy.eyebrow}</p>
          <h1 className="cst-page-section__title font-serif text-4xl sm:text-5xl tracking-tight">
            {copy.titleLead}{" "}
            <em className="text-[#d9c39a] not-italic">{copy.titleAccent}</em>
          </h1>
          <p className="text-muted-foreground mt-4 max-w-xl leading-relaxed">{copy.subtitle}</p>
        </header>

        <ol className="mb-10 space-y-3 text-sm text-muted-foreground max-w-xl">
          {copy.steps.map((step, i) => (
            <li key={step} className="flex gap-3">
              <span className="font-mono text-[#d9c39a]/80 shrink-0">{String(i + 1).padStart(2, "0")}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>

        <ConstellationGlassCard className="p-6 sm:p-8 mb-8">
          <MarketingForm intent="demo" />
        </ConstellationGlassCard>

        <p className="text-sm text-muted-foreground max-w-xl">{copy.invitedLink}</p>
      </ConstellationInnerPage>
    </MarketingLayout>
  );
}
