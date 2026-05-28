import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OnboardingVideoPlayer } from "@/components/onboarding-video-player";
import { getOnboardingVideoUrl, ONBOARDING_VIDEO_COPY } from "@/lib/onboarding-videos";
import { PlayCircle } from "lucide-react";

const WATCHED_KEY = "livia.onboarding.welcomeVideo.v1";

export function OnboardingWelcomePanel() {
  const url = getOnboardingVideoUrl("welcome");
  const meta = ONBOARDING_VIDEO_COPY.welcome;

  if (!url) {
    return (
      <Card className="border-dashed bg-muted/20" data-testid="onboarding-welcome-panel">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <PlayCircle className="h-4 w-4 text-primary" />
            Self-serve setup (~15 min)
          </CardTitle>
          <CardDescription>
            Follow each step below — no call required. Paste your shop details, connect WhatsApp or
            Instagram, and run one test booking.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-primary/5" data-testid="onboarding-welcome-panel">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <PlayCircle className="h-4 w-4 text-primary" />
          {meta.title}
        </CardTitle>
        <CardDescription>
          {meta.caption} ({meta.duration})
        </CardDescription>
      </CardHeader>
      <CardContent>
        <OnboardingVideoPlayer url={url} lazy={false} testId="onboarding-welcome-video" />
        <p className="text-xs text-muted-foreground mt-3">
          You can replay this anytime from Settings → Communications. Mark watched:{" "}
          <button
            type="button"
            className="underline text-primary"
            onClick={() => {
              try {
                localStorage.setItem(WATCHED_KEY, "1");
              } catch {
                /* ignore */
              }
            }}
          >
            I&apos;ve watched this
          </button>
        </p>
      </CardContent>
    </Card>
  );
}
