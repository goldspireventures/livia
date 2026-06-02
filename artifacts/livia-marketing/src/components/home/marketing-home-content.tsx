import { useRef } from "react";

import { ConstellationHero } from "@/components/home/constellation-hero";
import { ConstellationHomeFold } from "@/components/home/constellation-home-fold";
import { DeContactBand } from "@/components/marketing-shell";
import { editorialCopy, type MarketingLocale } from "@/lib/marketing-editorial-i18n";

type MarketingHomeContentProps = {
  locale: MarketingLocale;
};

/** M4 Constellation — hero + tight below-fold */
export function MarketingHomeContent({ locale }: MarketingHomeContentProps) {
  const formRef = useRef<HTMLDivElement>(null);

  const scrollToForm = (e: React.MouseEvent) => {
    e.preventDefault();
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <ConstellationHero locale={locale} onJoinBeta={scrollToForm} />
      <ConstellationHomeFold locale={locale} formRef={formRef} />
      {locale === "de" ? <DeContactBand locale={locale} /> : null}
    </>
  );
}
