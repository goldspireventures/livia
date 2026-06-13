import { useMemo, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { GatewayDemoEnterStage, GatewaySlideDots } from "@/components/gateway/gateway-demo-card-stage";
import { WedgeBeautyThread } from "@/components/gateway/wedge-beauty-thread";
import { WedgeConsultFirstThread } from "@/components/gateway/wedge-consult-first-thread";
import { WedgeStudioBrief } from "@/components/gateway/wedge-studio-brief";
import { isPresetWedgeThread } from "@/lib/wedge-beat-visuals";
import { DemoFlowShell } from "@/components/gateway/demo-flow-shell";
import {
  getWedgeDemoStory,
  isConsultFirstVertical,
  type WedgeDemoStory,
} from "@workspace/policy";
import { publicEventVendorEnquireUrl } from "@/lib/surface-urls";
import { demoOpenPersonaUrl, type DemoRosterEntry } from "@/lib/demo-portal";
import { useDemoWorldStatus } from "@/lib/demo/demo-world-status";
import { resolveG1WedgeWorld } from "@/lib/g1-wedge-worlds";
import {
  FOUNDER_DEMO_LAUNCHER_PATH,
  demoWorldsBackUrl,
} from "@/lib/demo-routes";

type WedgeSlide = "story" | "enter";

export default function DemoWedgeStoryPage() {
  const { vertical = "" } = useParams<{ vertical: string }>();
  const [, navigate] = useLocation();
  const worldKey =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("world")
      : null;
  const story = getWedgeDemoStory(vertical as WedgeDemoStory["vertical"]);
  const world = story ? resolveG1WedgeWorld(story.vertical, worldKey) : null;
  const demoSlug = world?.demoSlug ?? story?.demoSlug ?? null;
  const { provisioned, tenants, loading: statusLoading, error: statusError, refresh } =
    useDemoWorldStatus();
  const [slide, setSlide] = useState<WedgeSlide>("story");

  const tenant = useMemo(() => {
    return (
      (demoSlug ? tenants.find((b) => b.slug === demoSlug) : null) ??
      tenants.find((b) => (b.vertical ?? "").toLowerCase() === vertical.toLowerCase()) ??
      null
    );
  }, [demoSlug, tenants, vertical]);

  const roster = useMemo((): DemoRosterEntry[] => {
    if (tenant?.roster?.length) return tenant.roster;
    const ownerEmail = tenant?.roster?.find((r) => r.role === "owner")?.email ?? tenant?.ownerEmail;
    if (!ownerEmail) return [];
    return [
      {
        email: ownerEmail,
        label: "Owner",
        role: "owner",
        personaId: "owner",
        landingPath: "/dashboard",
      },
    ];
  }, [tenant]);

  if (!story) {
    return (
      <DemoFlowShell>
        <p className="text-muted-foreground">Unknown vertical wedge.</p>
        <a href={demoWorldsBackUrl()} className="mt-4 text-[#d9b97a] underline-offset-4 hover:underline">
          Back to worlds
        </a>
      </DemoFlowShell>
    );
  }

  const businessName = tenant?.name ?? world?.businessLabel ?? story.label;
  const enterMode = slide === "enter";
  const consultFirst = isConsultFirstVertical(story.vertical);
  const guestOpenHref = consultFirst && demoSlug
    ? publicEventVendorEnquireUrl(demoSlug)
    : demoOpenPersonaUrl({ persona: "customer" });

  return (
    <DemoFlowShell>
      {enterMode ? (
        <p className="mb-6 text-center font-serif text-xl tracking-tight text-[#e6d0a5]/90 sm:text-2xl">
          Walk in as your role
        </p>
      ) : null}

      {!provisioned && !statusLoading ? (
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
          <p className="font-medium text-amber-100">Demo world not ready yet</p>
          <p className="mt-1 text-amber-200/80">
            <Link href={`${FOUNDER_DEMO_LAUNCHER_PATH}#demo-setup`} className="underline underline-offset-2">
              Open founder launcher
            </Link>{" "}
            and run <strong>Set up demo world</strong> once (~30–60s). Then return here — Enter live demo
            will sign you in as owner.
          </p>
          {statusError ? (
            <p className="mt-2 text-xs text-amber-200/70">
              Status check: {statusError}.{" "}
              <button
                type="button"
                onClick={() => void refresh()}
                className="underline underline-offset-2"
              >
                Retry
              </button>
            </p>
          ) : null}
        </div>
      ) : null}

      {enterMode ? (
        <GatewayDemoEnterStage
          tradeLabel={story.label}
          businessName={businessName}
          roster={roster}
          disabled={!provisioned}
          backHref={demoWorldsBackUrl()}
          backLabel="← Worlds"
          guestOpenHref={guestOpenHref}
          guestShortcut={consultFirst ? "public-enquire" : "my-livia"}
          onBack={() => setSlide("story")}
        />
      ) : consultFirst ? (
        <WedgeConsultFirstThread
          vertical={story.vertical}
          world={world}
          beats={story.beats}
          tradeLabel={world?.businessLabel ?? story.label}
          disabled={!provisioned}
          continueLabel={provisioned ? "Enter live demo" : "Set up demo world first"}
          backHref={demoWorldsBackUrl()}
          backLabel="← Worlds"
          onContinue={() => {
            if (!provisioned) {
              navigate(`${FOUNDER_DEMO_LAUNCHER_PATH}#demo-setup`);
              return;
            }
            setSlide("enter");
          }}
        />
      ) : isPresetWedgeThread(story.vertical) ? (
        <WedgeBeautyThread
          vertical={story.vertical}
          world={world}
          beats={story.beats}
          tradeLabel={world?.businessLabel ?? story.label}
          continueLabel={
            provisioned ? "Walk into the live demo" : "Set up demo world first"
          }
          backHref={demoWorldsBackUrl()}
          backLabel="← Worlds"
          onContinue={() => {
            if (!provisioned) {
              navigate(`${FOUNDER_DEMO_LAUNCHER_PATH}#demo-setup`);
              return;
            }
            setSlide("enter");
          }}
        />
      ) : (
        <WedgeStudioBrief
          beats={story.beats}
          tradeLabel={world?.businessLabel ?? story.label}
          vertical={story.vertical}
          world={world}
          continueLabel={provisioned ? "Enter live demo" : "Set up demo world first"}
          backHref={demoWorldsBackUrl()}
          backLabel="← Worlds"
          onContinue={() => {
            if (!provisioned) {
              navigate(`${FOUNDER_DEMO_LAUNCHER_PATH}#demo-setup`);
              return;
            }
            setSlide("enter");
          }}
        />
      )}

      <GatewaySlideDots slide={slide} className="mt-6" />
    </DemoFlowShell>
  );
}
