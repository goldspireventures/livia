import { Link } from "wouter";
import { ArrowRight, Lock } from "lucide-react";
import { getWedgeDemoStory } from "@workspace/policy";
import { isG1WedgeWorldUnlocked, listG1WedgeWorldsForDisplay } from "@/lib/g1-wedge-worlds";
import { cn } from "@/lib/utils";

/** G1 — six portrait trade cards (locked target: g1-wedge-web.target.png). */
export function DemoWedgeGrid({ className }: { className?: string }) {
  return (
    <section
      className={cn("gateway-g1-cards", className)}
      data-testid="demo-wedge-grid"
      aria-labelledby="demo-wedge-grid-title"
    >
      <h2 id="demo-wedge-grid-title" className="sr-only">
        Pick your world
      </h2>
      <div className="gateway-g1-cards-track">
        {listG1WedgeWorldsForDisplay().map((world) => {
          const story = getWedgeDemoStory(world.vertical);
          const unlocked = isG1WedgeWorldUnlocked(world.vertical);
          const href = unlocked ? `/demo/wedge/${world.vertical}` : "#";

          return (
            <Link
              key={world.key}
              href={href}
              onClick={(e) => {
                if (!unlocked) e.preventDefault();
              }}
              aria-disabled={!unlocked}
              data-testid={`demo-wedge-card-${world.vertical}`}
              data-world-key={world.key}
              className={cn(
                "gateway-g1-world-card group",
                unlocked && "gateway-g1-world-card--unlocked",
                !unlocked && "gateway-g1-world-card--locked",
              )}
            >
              <div className="gateway-g1-world-card__media" aria-hidden>
                <img
                  src={world.imageUrl}
                  alt=""
                  className="gateway-g1-world-card__photo"
                  style={
                    world.photoPosition
                      ? { objectPosition: world.photoPosition }
                      : undefined
                  }
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                />
                <div className="gateway-g1-world-card__scrim" />
              </div>
              <div className="gateway-g1-world-card__base" aria-hidden />
              <div className="gateway-g1-world-card__frame" aria-hidden />

              <div className="gateway-g1-world-card__icon" aria-hidden>
                <span className="gateway-g1-world-card__icon-ring" />
              </div>

              <div className="gateway-g1-world-card__copy">
                <p className="gateway-g1-world-card__title">{world.title}</p>
                <p className="gateway-g1-world-card__tagline">{world.tagline}</p>
                {story && unlocked ? (
                  <p className="gateway-g1-world-card__hook">{story.beats[0]?.headline}</p>
                ) : null}
              </div>

              <div className="gateway-g1-world-card__cta">
                {unlocked ? (
                  <>
                    Enter world
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </>
                ) : (
                  <>
                    <Lock className="h-3 w-3" aria-hidden />
                    Coming soon
                  </>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
