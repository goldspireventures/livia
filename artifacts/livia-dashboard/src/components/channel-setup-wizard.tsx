import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  Facebook,
  Instagram,
  Loader2,
  MessageCircle,
} from "lucide-react";
import { Link } from "wouter";
import {
  channelConnectionStatus,
  META_PREREQUISITE_STEPS,
  POST_CONNECT_TIPS,
  resolveChannelPriorities,
  type MessagingChannelsSnapshot,
} from "@/lib/channel-setup-guide";
import { OnboardingVideoPlayer } from "@/components/onboarding-video-player";
import { getOnboardingVideoUrl, ONBOARDING_VIDEO_COPY } from "@/lib/onboarding-videos";

type CommsExt = {
  metaWebhookUrl?: string | null;
  messagingChannels?: MessagingChannelsSnapshot;
  metaConfigured?: boolean;
  metaDevSimulate?: boolean;
};

const baseUrl = (import.meta.env.BASE_URL || "/").replace(/\/$/, "") + "/api";

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${baseUrl}${path}`, {
    credentials: "include",
    ...init,
    headers: { "content-type": "application/json", ...(init.headers ?? {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`);
  return data as T;
}

const WIZARD_STEPS = [
  { id: "priorities", title: "Your channels" },
  { id: "meta", title: "Meta prerequisites" },
  { id: "webhook", title: "Platform webhook" },
  { id: "connect", title: "Connect IDs" },
  { id: "test", title: "Test & go live" },
] as const;

type WizardStepId = (typeof WIZARD_STEPS)[number]["id"];

export function ChannelSetupWizard({
  businessId,
  comms,
  jurisdiction,
  onRefresh,
  compact = false,
}: {
  businessId: string;
  comms: CommsExt | null;
  jurisdiction?: string | null;
  onRefresh: () => void;
  /** Shorter copy for onboarding act A7 */
  compact?: boolean;
}) {
  const { toast } = useToast();
  const [stepIndex, setStepIndex] = useState(0);
  const [waId, setWaId] = useState("");
  const [waDisplay, setWaDisplay] = useState("");
  const [igPage, setIgPage] = useState("");
  const [fbPage, setFbPage] = useState("");
  const [saving, setSaving] = useState(false);
  const [simText, setSimText] = useState("Hi, can I book tomorrow afternoon?");
  const [simChannel, setSimChannel] = useState<"WHATSAPP" | "INSTAGRAM">("WHATSAPP");
  const [simulating, setSimulating] = useState(false);

  const step = WIZARD_STEPS[stepIndex]!.id;
  const priorities = useMemo(() => resolveChannelPriorities(jurisdiction), [jurisdiction]);
  const status = channelConnectionStatus(comms?.messagingChannels);
  const showSim = import.meta.env.DEV || comms?.metaDevSimulate;

  useEffect(() => {
    const ch = comms?.messagingChannels;
    setWaId(ch?.whatsapp?.phoneNumberId ?? "");
    setWaDisplay(ch?.whatsapp?.displayPhone ?? "");
    setIgPage(ch?.instagram?.pageId ?? "");
    setFbPage(ch?.messenger?.pageId ?? ch?.instagram?.pageId ?? "");
  }, [comms]);

  useEffect(() => {
    if (status.anySocial) {
      setStepIndex(WIZARD_STEPS.findIndex((s) => s.id === "test"));
    }
  }, [comms?.messagingChannels]);

  async function save() {
    setSaving(true);
    try {
      await api(`/businesses/${businessId}/communications/messaging-channels`, {
        method: "PUT",
        body: JSON.stringify({
          whatsapp: waId.trim()
            ? { phoneNumberId: waId.trim(), displayPhone: waDisplay.trim() || undefined }
            : undefined,
          instagram: igPage.trim() ? { pageId: igPage.trim() } : undefined,
          messenger: fbPage.trim() ? { pageId: fbPage.trim() } : undefined,
        }),
      });
      toast({ title: "Channels saved", description: "Liv can route WhatsApp and Instagram into one inbox." });
      onRefresh();
    } catch (e) {
      toast({ title: "Save failed", description: String(e), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function simulateInbound() {
    setSimulating(true);
    try {
      const result = await api<{
        conversationId?: string;
        aiReplySkipped?: boolean;
        aiReplySkipReason?: string;
      }>(`/dev/meta/inbound`, {
        method: "POST",
        body: JSON.stringify({
          businessId,
          channel: simChannel,
          from: simChannel === "WHATSAPP" ? "+353871234567" : "ig_demo_customer_001",
          text: simText,
          displayName: "Test Customer",
        }),
      });
      toast({
        title: "Test message sent — open Inbox",
        description: result.aiReplySkipped
          ? (result.aiReplySkipReason ?? "Set ANTHROPIC_API_KEY on the API server for Liv to reply.")
          : "You should see Liv's reply with AI disclosure on the thread.",
      });
    } catch (e) {
      toast({ title: "Test failed", description: String(e), variant: "destructive" });
    } finally {
      setSimulating(false);
    }
  }

  function copyWebhook() {
    const url = comms?.metaWebhookUrl;
    if (!url) {
      toast({ title: "Webhook URL not available", description: "Set PUBLIC_BASE_URL on the API server.", variant: "destructive" });
      return;
    }
    void navigator.clipboard.writeText(url);
    toast({ title: "Webhook URL copied" });
  }

  function goNext() {
    setStepIndex((i) => Math.min(i + 1, WIZARD_STEPS.length - 1));
  }
  function goBack() {
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  return (
    <div className="space-y-4" data-testid="channel-setup-wizard">
      <div className="flex flex-wrap gap-1.5">
        {WIZARD_STEPS.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setStepIndex(i)}
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
              i === stepIndex
                ? "bg-primary text-primary-foreground"
                : i < stepIndex || (s.id === "connect" && status.anySocial)
                  ? "bg-primary/15 text-primary"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            {i + 1}. {s.title}
          </button>
        ))}
      </div>

      {step === "priorities" && (
        <div className="space-y-3 text-sm">
          {getOnboardingVideoUrl("channels") ? (
            <OnboardingVideoPlayer
              url={getOnboardingVideoUrl("channels")!}
              title={`${ONBOARDING_VIDEO_COPY.channels.title} (${ONBOARDING_VIDEO_COPY.channels.duration})`}
              testId="channel-setup-video"
            />
          ) : null}
          <p className="text-muted-foreground">
            {compact
              ? "Customers message you where they already are. Liv answers in one inbox — no tab hopping."
              : "Connect the channels your market actually uses. Liv keeps one thread per customer across WhatsApp, Instagram, SMS, and your booking page."}
          </p>
          <ul className="space-y-2">
            {priorities.map((p) => (
              <li key={p.id} className="flex gap-2 rounded-md border bg-card/50 p-3">
                <span className="font-medium shrink-0">{p.label}</span>
                <span className="text-muted-foreground text-xs">{p.hint}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">
            Calendar imports (Booksy, CSV) live under Settings → Integrations — separate from messaging.
          </p>
        </div>
      )}

      {step === "meta" && (
        <ol className="space-y-3 text-sm list-decimal list-inside">
          {META_PREREQUISITE_STEPS.map((s) => (
            <li key={s.title} className="pl-1">
              <span className="font-medium">{s.title}</span>
              <span className="text-muted-foreground block ml-5 mt-0.5 text-xs">{s.body}</span>
            </li>
          ))}
        </ol>
      )}

      {step === "webhook" && (
        <div className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            Meta sends customer messages to Livia once per environment. Your Livia contact usually registers this URL in the Meta Developer app — you only paste <strong>your</strong> shop IDs in the next step.
          </p>
          {comms?.metaWebhookUrl ? (
            <div className="rounded-md bg-muted/50 p-3 font-mono text-xs break-all space-y-2">
              <span className="text-muted-foreground block">Webhook URL</span>
              {comms.metaWebhookUrl}
              <Button type="button" variant="secondary" size="sm" onClick={() => copyWebhook()}>
                <Copy className="h-3.5 w-3.5 mr-1" />
                Copy URL
              </Button>
            </div>
          ) : (
            <p className="text-amber-600 text-xs">
              Set <code>PUBLIC_BASE_URL</code> on the API server (e.g. your ngrok or production URL) to show the webhook here.
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Verify token is configured on the Livia server — support will share it when connecting live Meta.
          </p>
        </div>
      )}

      {step === "connect" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label className="flex items-center gap-2">
              <MessageCircle className="h-3.5 w-3.5" />
              WhatsApp Phone number ID
              {status.whatsapp ? <Check className="h-3.5 w-3.5 text-primary" /> : null}
            </Label>
            <Input
              value={waId}
              onChange={(e) => setWaId(e.target.value)}
              placeholder="Meta → WhatsApp → API setup → Phone number ID"
              data-testid="input-wa-phone-id"
            />
            <Input
              value={waDisplay}
              onChange={(e) => setWaDisplay(e.target.value)}
              placeholder="Display number +353… (shown on booking page)"
            />
            <p className="text-xs text-muted-foreground">
              Meta Business Suite → WhatsApp Manager → API setup. Use the <strong>Phone number ID</strong>, not the customer-facing number alone.
            </p>
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Instagram className="h-3.5 w-3.5" />
              Instagram / Facebook Page ID
              {status.instagram ? <Check className="h-3.5 w-3.5 text-primary" /> : null}
            </Label>
            <Input
              value={igPage}
              onChange={(e) => setIgPage(e.target.value)}
              placeholder="Page ID linked to professional IG"
              data-testid="input-ig-page-id"
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Facebook className="h-3.5 w-3.5" />
              Messenger Page ID
              {status.messenger ? <Check className="h-3.5 w-3.5 text-primary" /> : null}
            </Label>
            <Input
              value={fbPage}
              onChange={(e) => setFbPage(e.target.value)}
              placeholder="Usually same as Instagram page"
            />
          </div>
          <div className="sm:col-span-2">
            <Button onClick={() => void save()} disabled={saving} data-testid="button-save-social-channels">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save channel IDs
            </Button>
          </div>
        </div>
      )}

      {step === "test" && (
        <div className="space-y-4 text-sm">
          <div className="flex flex-wrap gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${status.whatsapp ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}
            >
              WhatsApp {status.whatsapp ? "connected" : "optional"}
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${status.instagram ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}
            >
              Instagram {status.instagram ? "connected" : "optional"}
            </span>
          </div>

          {showSim ? (
            <div className="rounded-lg border border-dashed p-4 space-y-3" data-testid="social-simulate-block">
              <p className="text-xs font-medium">Dev: test without Meta</p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={simChannel === "WHATSAPP" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSimChannel("WHATSAPP")}
                >
                  WhatsApp
                </Button>
                <Button
                  type="button"
                  variant={simChannel === "INSTAGRAM" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSimChannel("INSTAGRAM")}
                >
                  Instagram
                </Button>
              </div>
              <Input value={simText} onChange={(e) => setSimText(e.target.value)} />
              <Button variant="secondary" size="sm" onClick={() => void simulateInbound()} disabled={simulating}>
                {simulating ? "Sending…" : "Simulate customer message → check Inbox"}
              </Button>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Message your business WhatsApp or Instagram from a personal account. Threads appear in{" "}
              <Link href="/inbox" className="text-primary underline">
                Inbox
              </Link>{" "}
              with Liv's first-reply disclosure.
            </p>
          )}

          {!comms?.metaConfigured ? (
            <p className="text-xs text-amber-600">
              Live outbound requires <code>META_ACCESS_TOKEN</code> on the API server. Inbound still works once IDs are saved.
            </p>
          ) : null}

          <ul className="space-y-1.5 text-xs text-muted-foreground">
            {POST_CONNECT_TIPS.map((tip) => (
              <li key={tip} className="flex gap-2">
                <Check className="h-3.5 w-3.5 shrink-0 text-primary mt-0.5" />
                {tip}
              </li>
            ))}
          </ul>

          <Button variant="outline" size="sm" asChild>
            <Link href="/inbox">
              Open Inbox
              <ExternalLink className="h-3.5 w-3.5 ml-1" />
            </Link>
          </Button>
        </div>
      )}

      <div className="flex justify-between pt-2 border-t">
        <Button type="button" variant="ghost" size="sm" onClick={goBack} disabled={stepIndex === 0}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        {stepIndex < WIZARD_STEPS.length - 1 ? (
          <Button type="button" size="sm" onClick={goNext}>
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button type="button" size="sm" variant="secondary" asChild>
            <Link href="/inbox">Done — go to Inbox</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
