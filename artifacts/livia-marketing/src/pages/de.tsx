import { MarketingShell } from "@/components/marketing-shell";
import { MarketingHomeContent } from "@/components/home/marketing-home-content";

export default function DeHomePage() {
  return (
    <MarketingShell locale="de">
      <MarketingHomeContent locale="de" />
    </MarketingShell>
  );
}
