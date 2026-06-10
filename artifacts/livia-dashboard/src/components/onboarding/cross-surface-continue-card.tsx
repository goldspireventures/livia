import { ExternalLink, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CROSS_SURFACE_WEB_COPY,
  mobileOnboardingSetupUrl,
  mobileSettingsUrl,
} from "@/lib/cross-surface-urls";

type Variant = "onboarding" | "appearance";

type Props = {
  className?: string;
  variant?: Variant;
};

/** Onboarding / settings — hand off to native app without losing business row progress. */
export function CrossSurfaceContinueCard({ className, variant = "onboarding" }: Props) {
  const deepLink =
    variant === "appearance" ? mobileSettingsUrl("shop") : mobileOnboardingSetupUrl();
  const title =
    variant === "appearance"
      ? "Preset & floor flows on mobile"
      : CROSS_SURFACE_WEB_COPY.continueOnMobileTitle;
  const body =
    variant === "appearance"
      ? "Same skin and brand — pick presets with haptics on your phone; changes sync to this dashboard instantly."
      : CROSS_SURFACE_WEB_COPY.continueOnMobileBody;

  return (
    <Card className={className} data-testid="cross-surface-continue-mobile">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Smartphone className="h-4 w-4 text-primary" aria-hidden />
          {title}
        </CardTitle>
        <CardDescription>{body}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button variant="outline" size="sm" asChild>
          <a href={deepLink}>
            Open Livia app
            <ExternalLink className="ml-2 h-3.5 w-3.5" aria-hidden />
          </a>
        </Button>
        <p className="text-xs text-muted-foreground font-mono">{deepLink}</p>
      </CardContent>
    </Card>
  );
}
