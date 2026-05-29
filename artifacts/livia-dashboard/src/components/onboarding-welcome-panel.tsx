import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OnboardingVideoPlayer } from "@/components/onboarding-video-player";
import { getOnboardingVideoUrl, ONBOARDING_VIDEO_COPY } from "@/lib/onboarding-videos";
import { PlayCircle } from "lucide-react";

const WATCHED_KEY = "livia.onboarding.welcomeVideo.v1";

export function OnboardingWelcomePanel({ compact = false }: { compact?: boolean }) {
  const url = getOnboardingVideoUrl("welcome");
  const meta = ONBOARDING_VIDEO_COPY.welcome;

  if (!url) {
    return (
      <Card
        className="overflow-hidden border-primary/20 bg-gradient-to-br from-violet-500/10 via-background to-cyan-500/10 backdrop-blur-sm"
        data-testid="onboarding-welcome-panel"
      >
        <div
          className={
            compact
              ? "relative aspect-video max-h-36 w-full bg-gradient-to-br from-zinc-900 via-violet-950 to-cyan-950 flex items-center justify-center"
              : "relative aspect-[21/9] max-h-40 w-full bg-gradient-to-br from-zinc-900 via-violet-950 to-cyan-950 flex items-center justify-center"
          }
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(139,92,246,0.35),transparent_50%)]" />
          <div className="relative flex flex-col items-center gap-2 text-center px-6">
            <PlayCircle className="h-10 w-10 text-primary/90" />
            <span className="text-xs text-zinc-300 tracking-wide">Your first day with Liv</span>
          </div>
        </div>
        {compact ? (
          <CardContent className="py-3 text-center text-xs text-muted-foreground">
            ~15 min self-serve · no onboarding call
          </CardContent>
        ) : (
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-serif tracking-tight flex items-center gap-2">
              <PlayCircle className="h-4 w-4 text-primary" />
              Watch, then set up (~15 min)
            </CardTitle>
            <CardDescription>
              Phone quiet, calendar full — follow the chapters below. No onboarding call required.
            </CardDescription>
          </CardHeader>
        )}
      </Card>
    );
  }

  return (
    <Card
      className="overflow-hidden border-primary/20 bg-primary/5 shadow-md backdrop-blur-sm"
      data-testid="onboarding-welcome-panel"
    >
      {!compact ? (
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <PlayCircle className="h-4 w-4 text-primary" />
            {meta.title}
          </CardTitle>
          <CardDescription>
            {meta.caption} ({meta.duration})
          </CardDescription>
        </CardHeader>
      ) : null}
      <CardContent className={compact ? "p-3 pt-3" : "pt-0"}>
        <OnboardingVideoPlayer
          url={url}
          lazy={compact}
          testId="onboarding-welcome-video"
          className="border-primary/20 shadow-inner"
        />
        {!compact ? (
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
        ) : null}
      </CardContent>
    </Card>
  );
}
