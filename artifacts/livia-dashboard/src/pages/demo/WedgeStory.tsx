import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { useSignIn, useClerk } from "@clerk/clerk-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  GatewayBusyOverlay,
  GatewayDemoEnterStage,
  GatewaySlideDots,
} from "@/components/gateway/gateway-demo-card-stage";
import { WedgeBeautyThread } from "@/components/gateway/wedge-beauty-thread";
import { WedgeStudioBrief } from "@/components/gateway/wedge-studio-brief";
import { isPresetWedgeThread } from "@/lib/wedge-beat-visuals";
import { DemoFlowShell } from "@/components/gateway/demo-flow-shell";
import {
  getWedgeDemoStory,
  type WedgeDemoStory,
} from "@workspace/policy";
import { fetchDemoCatalog, requestDemoQuickSignIn, requestDemoSignIn, demoOpenPersonaUrl, type DemoRosterEntry } from "@/lib/demo-portal";
import { DemoGuestClientShortcut } from "@/components/demo/demo-guest-client-shortcut";
import { useDemoWorldStatus } from "@/lib/demo/demo-world-status";
import { completeDemoPortalSignIn } from "@/lib/demo/complete-demo-portal-sign-in";
import { resolveG1WedgeWorld } from "@/lib/g1-wedge-worlds";
import { useToast } from "@/hooks/use-toast";
import { useGatewaySkinHandoffOptional } from "@/components/gateway/gateway-skin-handoff-provider";

type WedgeSlide = "story" | "enter";

export default function DemoWedgeStoryPage() {
  const { vertical = "" } = useParams<{ vertical: string }>();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const worldKey =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("world")
      : null;
  const story = getWedgeDemoStory(vertical as WedgeDemoStory["vertical"]);
  const world = story ? resolveG1WedgeWorld(story.vertical, worldKey) : null;
  const demoSlug = world?.demoSlug ?? story?.demoSlug ?? null;
  const { toast } = useToast();
  const { signIn, isLoaded: signInLoaded } = useSignIn();
  const { signOut, session, setActive } = useClerk();
  const [busy, setBusy] = useState<string | null>(null);
  const [devPassword, setDevPassword] = useState<string | undefined>();
  const { provisioned, tenants, loading: statusLoading, error: statusError, refresh } =
    useDemoWorldStatus();
  const [slide, setSlide] = useState<WedgeSlide>("story");
  const gatewayHandoff = useGatewaySkinHandoffOptional();

  const tenant = useMemo(() => {
    return (
      (demoSlug ? tenants.find((b) => b.slug === demoSlug) : null) ??
      tenants.find((b) => (b.vertical ?? "").toLowerCase() === vertical.toLowerCase()) ??
      null
    );
  }, [demoSlug, tenants, vertical]);

  useEffect(() => {
    void fetchDemoCatalog()
      .then((c) => {
        if (c.sharedPassword ?? c.devPassword) {
          setDevPassword(c.sharedPassword ?? c.devPassword);
        }
      })
      .catch(() => undefined);
  }, []);

  const completeTicketSignIn = useCallback(
    async (result: Parameters<typeof completeDemoPortalSignIn>[0]["result"]) => {
      if (!signInLoaded || !signIn) {
        toast({ title: "Clerk not ready", variant: "destructive" });
        return;
      }
      await completeDemoPortalSignIn({
        signIn,
        clerk: { signOut, setActive, sessionId: session?.id },
        result,
        password: devPassword,
        queryClient,
        navigate,
        gatewayHandoff,
        vertical: story?.vertical,
      });
    },
    [
      devPassword,
      gatewayHandoff,
      navigate,
      queryClient,
      session?.id,
      signIn,
      signInLoaded,
      setActive,
      signOut,
      story?.vertical,
      toast,
    ],
  );

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

  async function enterGuestClient() {
    setBusy("customer");
    try {
      const result = await requestDemoSignIn("customer");
      if (result.signInStrategy === "public") {
        navigate(result.landingPath);
        return;
      }
      await completeTicketSignIn(result);
    } catch (e: unknown) {
      toast({
        title: "Could not open My Livia",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setBusy(null);
    }
  }

  async function enterAsRole(email: string) {
    if (!provisioned) {
      toast({
        title: "Set up demo world first",
        description: "Open /demo and run Quick sync, then return here.",
        variant: "destructive",
      });
      return;
    }
    setBusy(email);
    try {
      const result = await requestDemoQuickSignIn(email);
      await completeTicketSignIn(result);
    } catch (e: unknown) {
      toast({
        title: "Could not enter demo",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setBusy(null);
    }
  }

  if (!story) {
    return (
      <DemoFlowShell>
        <p className="text-muted-foreground">Unknown vertical wedge.</p>
        <Link href="/demo" className="mt-4 text-[#d9b97a] underline-offset-4 hover:underline">
          Back to worlds
        </Link>
      </DemoFlowShell>
    );
  }

  const businessName = tenant?.name ?? world?.businessLabel ?? story.label;
  const enterMode = slide === "enter";

  return (
    <DemoFlowShell>
      {busy ? <GatewayBusyOverlay label="Signing in…" /> : null}

      {enterMode ? (
        <p className="mb-6 text-center font-serif text-xl tracking-tight text-[#e6d0a5]/90 sm:text-2xl">
          Walk in as your role
        </p>
      ) : null}

      {!provisioned && !statusLoading ? (
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
          <p className="font-medium text-amber-100">Demo world not ready yet</p>
          <p className="mt-1 text-amber-200/80">
            <Link href="/demo#demo-setup" className="underline underline-offset-2">
              Open /demo
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
        <>
          <DemoGuestClientShortcut
            busy={busy === "customer"}
            openHref={demoOpenPersonaUrl({ persona: "customer" })}
            onOpen={() => void enterGuestClient()}
          />
          <GatewayDemoEnterStage
            tradeLabel={story.label}
            businessName={businessName}
            roster={roster}
            busy={busy}
            disabled={!provisioned}
            backHref="/demo"
            backLabel="← Worlds"
            onSelectRole={(email) => void enterAsRole(email)}
            onBack={() => setSlide("story")}
          />
        </>
      ) : isPresetWedgeThread(story.vertical) ? (
        <WedgeBeautyThread
          vertical={story.vertical}
          world={world}
          beats={story.beats}
          tradeLabel={world?.businessLabel ?? story.label}
          continueLabel={
            provisioned ? "Walk into the live demo" : "Set up demo world first"
          }
          backHref="/demo"
          backLabel="← Worlds"
          onContinue={() => {
            if (!provisioned) {
              navigate("/demo#demo-setup");
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
          backHref="/demo"
          backLabel="← Worlds"
          onContinue={() => {
            if (!provisioned) {
              navigate("/demo#demo-setup");
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
