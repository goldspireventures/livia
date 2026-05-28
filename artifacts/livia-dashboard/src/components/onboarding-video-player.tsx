import { useState } from "react";
import ReactPlayer from "react-player";
import { Play, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  url: string;
  title?: string;
  className?: string;
  testId?: string;
  /** Lazy-load until user clicks play (saves bandwidth on onboarding). */
  lazy?: boolean;
};

export function OnboardingVideoPlayer({ url, title, className, testId, lazy = true }: Props) {
  const [playing, setPlaying] = useState(!lazy);

  if (!url.trim()) return null;

  return (
    <div
      className={cn("rounded-lg overflow-hidden border bg-black/90", className)}
      data-testid={testId ?? "onboarding-video-player"}
    >
      {title ? (
        <p className="text-xs text-white/80 px-3 py-2 border-b border-white/10">{title}</p>
      ) : null}
      <div className="relative aspect-video w-full bg-black">
        {playing ? (
          <ReactPlayer
            src={url}
            controls
            width="100%"
            height="100%"
            style={{ position: "absolute", top: 0, left: 0 }}
            config={{
              youtube: { rel: 0 },
            }}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <Video className="h-10 w-10 text-white/60" />
            <Button type="button" variant="secondary" size="sm" onClick={() => setPlaying(true)}>
              <Play className="h-4 w-4 mr-1" />
              Play video
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
