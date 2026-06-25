import { HeroSection } from "@/components/home/HeroSection";
import { PortfolioTeaser } from "@/components/home/PortfolioTeaser";
import { ExploreSection } from "@/components/home/ExploreSection";

export function HomePage() {
  return (
    <>
      <HeroSection />
      <PortfolioTeaser />
      <ExploreSection />
    </>
  );
}
