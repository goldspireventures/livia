import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "wouter";
import { useSignIn, useClerk } from "@clerk/clerk-react";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  ClipboardCheck,
  ImageIcon,
  Inbox,
  Loader2,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { LiviaWordmark } from "@/components/brand/LiviaMark";
import {
  getWedgeDemoStory,
  listWedgeDemoVerticals,
  type WedgeDemoStory,
} from "@workspace/policy";
import {
  applyDemoSessionContext,
  fetchDemoCatalog,
  fetchDemoStatus,
  requestDemoQuickSignIn,
  type DemoBusinessTenant,
  type DemoSignInResult,
} from "@/lib/demo-portal";
import { completeDemoClerkSignIn } from "@/lib/demo-clerk-sign-in";
import { useToast } from "@/hooks/use-toast";
import { DemoFlowStepper } from "@/components/demo/demo-flow-stepper";

const CROP_META: Record<
  string,
  { label: string; icon: typeof Inbox; chip: string; ring: string }
> = {
  inbox: { label: "Inbox", icon: Inbox, chip: "bg-violet-500/15 text-violet-300", ring: "border-violet-500/25" },
  "public-book": { label: "Book", icon: Calendar, chip: "bg-cyan-500/15 text-cyan-300", ring: "border-cyan-500/25" },
  proof: { label: "Proof", icon: ImageIcon, chip: "bg-amber-500/15 text-amber-300", ring: "border-amber-500/25" },
  consent: { label: "Consent", icon: ClipboardCheck, chip: "bg-rose-500/15 text-rose-300", ring: "border-rose-500/25" },
  sms: { label: "SMS", icon: MessageSquare, chip: "bg-emerald-500/15 text-emerald-300", ring: "border-emerald-500/25" },
  today: { label: "Today", icon: Sparkles, chip: "bg-sky-500/15 text-sky-300", ring: "border-sky-500/25" },
};

export default function DemoWedgeStoryPage() {
  const { vertical = "" } = useParams<{ vertical: string }>();
  const story = getWedgeDemoStory(vertical as WedgeDemoStory["vertical"]);
  const { toast } = useToast();
  const { signIn, isLoaded: signInLoaded } = useSignIn();
  const { signOut, session, setActive } = useClerk();
  const [busy, setBusy] = useState<string | null>(null);
  const [devPassword, setDevPassword] = useState("LiviaDemo2026!");
  const [provisioned, setProvisioned] = useState(false);
  const [tenant, setTenant] = useState<DemoBusinessTenant | null>(null);

  useEffect(() => {
    void fetchDemoCatalog()
      .then((c) => {
        if (c.sharedPassword ?? c.devPassword) setDevPassword(c.sharedPassword ?? c.devPassword ?? "LiviaDemo2026!");
      })
      .catch(() => undefined);
    void fetchDemoStatus()
      .then((st) => {
        setProvisioned(st.provisioned);
        const slug = story?.demoSlug;
        const match =
          (slug ? st.businesses?.find((b) => b.slug === slug) : null) ??
          st.businesses?.find((b) => (b.vertical ?? "").toLowerCase() === vertical.toLowerCase());
        setTenant(match ?? null);
      })
      .catch(() => undefined);
  }, [story?.demoSlug, vertical]);

  const completeTicketSignIn = useCallback(
    async (result: DemoSignInResult) => {
      if (!signInLoaded || !signIn) {
        toast({ title: "Clerk not ready", variant: "destructive" });
        return;
      }
      await completeDemoClerkSignIn(
        signIn,
        { signOut, setActive, sessionId: session?.id },
        result,
        devPassword,
      );
      applyDemoSessionContext(result);
      window.location.href = result.landingPath;
    },
    [devPassword, session?.id, signIn, signInLoaded, setActive, signOut, toast],
  );

  async function enterAsRole(email: string, busyKey: string) {
    if (!provisioned) {
      toast({
        title: "Set up demo world first",
        description: "Go to /demo → step 1 Quick sync, then return here.",
        variant: "destructive",
      });
      return;
    }
    setBusy(busyKey);
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

  const ownerEmail = useMemo(
    () => tenant?.roster?.find((r) => r.role === "owner")?.email ?? tenant?.ownerEmail,
    [tenant],
  );

  if (!story) {
    return (
      <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-muted-foreground">Unknown vertical wedge.</p>
        <Link href="/demo" className="text-primary underline-offset-4 hover:underline">
          Back to demo gateway
        </Link>
      </div>
    );
  }

  const hook = story.beats[0]?.headline ?? story.label;

  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-aurora-cyan/10 blur-[120px]" />
      </div>

      <header className="relative z-10 flex items-center justify-between px-6 py-5">
        <LiviaWordmark size="md" />
        <Link
          href="/demo"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Demo gateway
        </Link>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-lg flex-1 px-6 pb-16 pt-4">
        <DemoFlowStepper current="role" provisioned={provisioned} scenarioSelected />

        <p className="text-xs uppercase tracking-widest text-aurora-cyan/80">{story.vertical.replace("-", " ")}</p>
        <h1 className="mt-2 font-serif text-3xl font-normal tracking-tight md:text-4xl">{story.label}</h1>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{hook}</p>

        {!provisioned ? (
          <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
            <p className="font-medium text-amber-100">Step 1 required</p>
            <p className="mt-1 text-amber-200/80">
              Demo data isn&apos;t seeded yet.{" "}
              <Link href="/demo" className="underline underline-offset-2">
                Open /demo
              </Link>{" "}
              and run <strong>Quick sync</strong> first.
            </p>
          </div>
        ) : null}

        <ol className="mt-8 space-y-4">
          {story.beats.map((beat, i) => {
            const meta = CROP_META[beat.cropHint] ?? CROP_META.inbox;
            const Icon = meta.icon;
            return (
              <li
                key={`${beat.cropHint}-${beat.headline}`}
                className={`rounded-2xl border bg-card/40 p-4 backdrop-blur-sm ${meta.ring}`}
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 font-serif text-sm text-primary">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium leading-snug">{beat.headline}</p>
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] uppercase tracking-wide ${meta.chip}`}
                      >
                        <Icon className="h-3 w-3" />
                        {meta.label}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm text-muted-foreground">{beat.detail}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>

        <section className="mt-8">
          <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
            Enter as role
          </h2>
          {tenant?.roster?.length ? (
            <div className="grid grid-cols-2 gap-2">
              {tenant.roster.map((entry) => {
                const loading = busy === entry.email;
                return (
                  <button
                    key={entry.email}
                    type="button"
                    disabled={!!busy || !provisioned}
                    onClick={() => void enterAsRole(entry.email, entry.email)}
                    className="rounded-xl border border-border/60 bg-card/30 px-3 py-3 text-left hover:border-primary/40 disabled:opacity-60"
                  >
                    <span className="text-sm font-medium">
                      {loading ? "Signing in…" : entry.label.split(" · ").pop()}
                    </span>
                    <span className="mt-1 block text-[9px] font-mono text-muted-foreground truncate">
                      {entry.email}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : ownerEmail ? (
            <button
              type="button"
              disabled={!!busy || !provisioned}
              onClick={() => void enterAsRole(ownerEmail, ownerEmail)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Enter as owner
              {!busy ? <ArrowRight className="h-4 w-4" /> : null}
            </button>
          ) : (
            <p className="text-sm text-muted-foreground">
              Tenant not found — run quick sync on{" "}
              <Link href="/demo" className="text-primary underline">
                /demo
              </Link>
              .
            </p>
          )}
        </section>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Password <code className="text-[10px]">{devPassword}</code> · applied automatically on quick login
        </p>

        <nav className="mt-10 flex flex-wrap gap-2 border-t border-border/40 pt-6" aria-label="Other trades">
          {listWedgeDemoVerticals()
            .filter((v) => v !== story.vertical)
            .map((v) => {
              const s = getWedgeDemoStory(v);
              return (
                <Link
                  key={v}
                  href={`/demo/wedge/${v}`}
                  className="rounded-full border border-border/60 px-3 py-1 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground"
                >
                  {s?.label ?? v}
                </Link>
              );
            })}
        </nav>
      </main>
    </div>
  );
}
