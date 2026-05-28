import { MarketingShell } from "@/components/marketing-shell";
import { MarketingHomeContent } from "@/components/home/marketing-home-content";

export default function Home() {
  return (
    <MarketingShell locale="en">
      <MarketingHomeContent locale="en" />
    </MarketingShell>
  );
}
