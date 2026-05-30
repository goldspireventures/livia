import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import { useAuth, useSignIn, useClerk } from "@clerk/clerk-react";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { LiviaWordmark } from "@/components/brand/LiviaMark";
import {
  getWedgeDemoStory,
  listWedgeDemoVerticals,
  type WedgeDemoStory,
} from "@workspace/policy";
import {
  applyDemoSessionContext,
  fetchDemoStatus,
  requestDemoSignInAsBusiness,
  type DemoSignInResult,
} from "@/lib/demo-portal";
import { useToast } from "@/hooks/use-toast";

const CROP_LABEL: Record<string, string> = {
  inbox: "Inbox",
  "public-book": "Book",
  proof: "Proof",
  consent: "Consent",
  sms: "SMS",
  today: "Today",
};

export default function DemoWedgeStoryPage() {
  const { vertical = "" } = useParams<{ vertical: string }>();
  const story = getWedgeDemoStory(vertical as WedgeDemoStory["vertical"]);
  const { toast } = useToast();
  const { signIn, isLoaded: signInLoaded } = useSignIn();
  const { isSignedIn, signOut, session, setActive } = useClerk();
  const [busy, setBusy] = useState(false);
  const [resolvedSlug, setResolvedSlug] = useState<string | null>(story?.demoSlug ?? null);

  useEffect(() => {
    if (story?.demoSlug) {
      setResolvedSlug(story.demoSlug);
      return;
    }
    void fetchDemoStatus().then((st) => {
      const match = st.businesses?.find(
        (b) => (b.vertical ?? "").toLowerCase() === vertical.toLowerCase(),
      );
      if (match) setResolvedSlug(match.slug);
    });
  }, [story?.demoSlug, vertical]);

  const completeTicketSignIn = useCallback(
    async (result: DemoSignInResult) => {
      if (!signInLoaded || !signIn) {
        toast({ title: "Clerk not ready", variant: "destructive" });
        return;
      }
      if (isSignedIn && session?.id) {
        await signOut({ sessionId: session.id });
      }
      const attempt = await signIn.create({
        strategy: "ticket",
        ticket: result.token!,
      });
      if (attempt.status === "complete" && attempt.createdSessionId) {
        await setActive({ session: attempt.createdSessionId });
        applyDemoSessionContext(result);
        window.location.href = result.landingPath;
      } else {
        toast({
          title: "Sign-in incomplete",
          description: "Try the demo launcher with provisioned world.",
          variant: "destructive",
        });
      }
    },
    [isSignedIn, session?.id, signIn, signInLoaded, setActive, signOut, toast],
  );

  async function enterDemo() {
    if (!resolvedSlug) {
      toast({
        title: "Demo shop not ready",
        description: "Provision demo world from /demo first.",
        variant: "destructive",
      });
      return;
    }
    setBusy(true);
    try {
      const result = await requestDemoSignInAsBusiness(resolvedSlug);
      await completeTicketSignIn(result);
    } catch (e: unknown) {
      toast({
        title: "Could not enter demo",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  if (!story) {
    return (
      <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-muted-foreground">Unknown vertical wedge.</p>
        <Link href="/demo" className="text-primary underline-offset-4 hover:underline">
          Back to demo grid
        </Link>
      </div>
    );
  }

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
          All trades
        </Link>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-lg flex-1 px-6 pb-16 pt-4">
        <p className="text-xs uppercase tracking-widest text-aurora-cyan/80">{story.tier.replace("-", " ")}</p>
        <h1 className="mt-2 font-serif text-3xl font-normal tracking-tight md:text-4xl">{story.label}</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Four beats — how Liv runs this trade on Livia. Same clarity on web and mobile.
        </p>

        <ol className="mt-10 space-y-6">
          {story.beats.map((beat, i) => (
            <li
              key={beat.headline}
              className="rounded-2xl border border-border/60 bg-card/40 p-5 backdrop-blur-sm"
            >
              <div className="flex items-start gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 font-serif text-sm text-primary">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium leading-snug">{beat.headline}</p>
                  <p className="mt-1.5 text-sm text-muted-foreground">{beat.detail}</p>
                  <span className="mt-3 inline-block rounded-md bg-muted/60 px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                    {CROP_LABEL[beat.cropHint] ?? beat.cropHint}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ol>

        <button
          type="button"
          disabled={busy}
          onClick={() => void enterDemo()}
          className="mt-10 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Enter demo
          {!busy ? <ArrowRight className="h-4 w-4" /> : null}
        </button>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Opens seeded {story.label.toLowerCase()} tenant — owner view on web; same OS on mobile.
        </p>

        <div className="mt-12 flex flex-wrap gap-2 border-t border-border/40 pt-8">
          {listWedgeDemoVerticals()
            .filter((v) => v !== story.vertical)
            .slice(0, 5)
            .map((v) => (
              <Link
                key={v}
                href={`/demo/wedge/${v}`}
                className="rounded-full border border-border/60 px-3 py-1 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground"
              >
                {v.replace("-", " ")}
              </Link>
            ))}
        </div>
      </main>
    </div>
  );
}
