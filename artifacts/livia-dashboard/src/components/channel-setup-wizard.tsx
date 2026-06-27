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
import { ownerChannelIdForForm } from "@workspace/policy";
import {
  channelConnectionStatus,
  META_PREREQUISITE_STEPS,
  POST_CONNECT_TIPS,
  resolveChannelPriorities,
  type ChannelPriority,
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
  { id: "meta", title: "Meta setup" },
  { id: "webhook", title: "Webhook" },
  { id: "connect", title: "Connect" },
  { id: "test", title: "Test" },
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
  const [activeChannel, setActiveChannel] = useState<ChannelPriority["id"] | null>(null);
  const [channelSearch, setChannelSearch] = useState("");
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
    const waIdSaved = ownerChannelIdForForm(ch?.whatsapp?.phoneNumberId);
    setWaId(waIdSaved);
    setWaDisplay(waIdSaved ? (ch?.whatsapp?.displayPhone?.trim() ?? "") : "");
    setIgPage(ownerChannelIdForForm(ch?.instagram?.pageId));
    setFbPage(
      ownerChannelIdForForm(ch?.messenger?.pageId) ||
        ownerChannelIdForForm(ch?.instagram?.pageId),
    );
  }, [comms]);

  const filteredPriorities = useMemo(() => {
    const q = channelSearch.trim().toLowerCase();
    if (!q) return priorities;
    return priorities.filter(
      (p) => p.label.toLowerCase().includes(q) || p.hint.toLowerCase().includes(q),
    );
  }, [priorities, channelSearch]);

  function isChannelConnected(id: ChannelPriority["id"]): boolean {
    if (id === "whatsapp") return status.whatsapp;
    if (id === "instagram") return status.instagram;
    if (id === "messenger") return status.messenger;
    return false;
  }

  function openChannel(id: ChannelPriority["id"]) {
    if (id === "sms") {
      toast({
        title: "SMS reminders",
        description: "Livia provisions SMS on your account — ask support to enable, or use Settings → Integrations.",
      });
      return;
    }
    setActiveChannel(id);
    setStepIndex(WIZARD_STEPS.findIndex((s) => s.id === "connect"));
  }

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
      const label =
        priorities.find((p) => p.id === activeChannel)?.label ?? "Channel";
      toast({
        title: `${label} saved`,
        description: "Liv routes new messages into your inbox. Connect another channel or run a test.",
      });
      onRefresh();
      setActiveChannel(null);
      setStepIndex(0);
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
          : "You should see Liv's reply on the thread — customers are told they're chatting with AI.",
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
    if (step === "connect" && activeChannel) {
      setActiveChannel(null);
      setStepIndex(0);
      return;
    }
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  return (
    <div className="space-y-5 pb-2" data-testid="channel-setup-wizard">
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
        <div className="space-y-4 text-sm">
          {getOnboardingVideoUrl("channels") ? (
            <OnboardingVideoPlayer
              url={getOnboardingVideoUrl("channels")!}
              title={`${ONBOARDING_VIDEO_COPY.channels.title} (${ONBOARDING_VIDEO_COPY.channels.duration})`}
              testId="channel-setup-video"
            />
          ) : null}
          <p className="text-muted-foreground">
            {compact
              ? "Tap a channel to connect it. Liv answers in one inbox — no tab hopping."
              : "Tap each channel you use. Paste one ID from Meta — Livia handles webhooks and routing on our servers."}
          </p>
          {priorities.length >= 3 ? (
            <Input
              placeholder="Search channels…"
              value={channelSearch}
              onChange={(e) => setChannelSearch(e.target.value)}
              data-testid="channel-setup-search"
            />
          ) : null}
          <ul className="space-y-2">
            {filteredPriorities.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  data-testid={`channel-pick-${p.id}`}
                  onClick={() => openChannel(p.id)}
                  className="w-full flex items-start gap-3 rounded-lg border border-border/80 bg-card/50 p-3 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
                >
                  <span className="font-medium shrink-0">{p.label}</span>
                  <span className="text-muted-foreground text-xs flex-1">{p.hint}</span>
                  {isChannelConnected(p.id) ? (
                    <Check className="h-4 w-4 shrink-0 text-primary mt-0.5" aria-label="Connected" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" aria-hidden />
                  )}
                </button>
              </li>
            ))}
          </ul>
          {status.anySocial ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setStepIndex(WIZARD_STEPS.findIndex((s) => s.id === "test"))}
            >
              Test messages → Inbox
            </Button>
          ) : null}
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
          <div className="rounded-lg border border-primary/25 bg-primary/5 px-3 py-3 space-y-1">
            <p className="font-medium text-foreground">Nothing for you to do here</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Livia registers the Meta webhook on our servers when your shop goes live. Your only step is pasting{" "}
              <strong>your</strong> WhatsApp / Page IDs on the next screen — not configuring URLs.
            </p>
          </div>
          {comms?.metaWebhookUrl ? (
            <details className="rounded-md border border-border/80 bg-muted/30 px-3 py-2">
              <summary className="cursor-pointer text-xs font-medium text-muted-foreground list-none [&::-webkit-details-marker]:hidden">
                For your developer or Livia support (optional)
              </summary>
              <div className="pt-2 font-mono text-xs break-all space-y-2">
                <span className="text-muted-foreground block">Webhook URL</span>
                {comms.metaWebhookUrl}
                <Button type="button" variant="secondary" size="sm" onClick={() => copyWebhook()}>
                  <Copy className="h-3.5 w-3.5 mr-1" />
                  Copy URL
                </Button>
              </div>
            </details>
          ) : (
            <p className="text-xs text-muted-foreground">
              The webhook URL appears here on production — local setup uses the test step instead. Tap{" "}
              <strong>Next</strong> to connect your Meta IDs.
            </p>
          )}
        </div>
      )}

      {step === "connect" && (
        <div className="livia-form-stack space-y-5 text-sm">
          <p className="text-muted-foreground">
            {activeChannel === "whatsapp"
              ? "Paste your WhatsApp Phone number ID from Meta. Livia registers webhooks and delivers DMs to Inbox."
              : activeChannel === "instagram"
                ? "Paste the Facebook Page ID linked to your professional Instagram account."
                : activeChannel === "messenger"
                  ? "Paste your Facebook Page ID for Messenger (often the same as Instagram)."
                  : "Choose a channel from step 1, or use the advanced fields below."}
          </p>
          {(activeChannel === "whatsapp" || !activeChannel) && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MessageCircle className="h-3.5 w-3.5" />
                WhatsApp Phone number ID
                {status.whatsapp ? <Check className="h-3.5 w-3.5 text-primary" /> : null}
              </Label>
              <Input
                value={waId}
                onChange={(e) => setWaId(e.target.value)}
                placeholder="From Meta → WhatsApp → API setup"
                data-testid="input-wa-phone-id"
              />
              <Input
                value={waDisplay}
                onChange={(e) => setWaDisplay(e.target.value)}
                placeholder="Display number guests see (optional)"
              />
              <p className="text-xs text-muted-foreground">
                Use the <strong>Phone number ID</strong> from WhatsApp Manager — not the display number alone.
                Leave both fields blank until you have them from Meta; we do not pre-fill shop phone numbers.
              </p>
            </div>
          )}
          {(activeChannel === "instagram" || activeChannel === "messenger" || !activeChannel) && (
            <div className="space-y-2 pt-1">
              <Label className="flex items-center gap-2">
                <Instagram className="h-3.5 w-3.5" />
                Instagram / Facebook Page ID
                {status.instagram ? <Check className="h-3.5 w-3.5 text-primary" /> : null}
              </Label>
              <Input
                value={igPage}
                onChange={(e) => setIgPage(e.target.value)}
                placeholder="Page ID from Meta Business Suite"
                data-testid="input-ig-page-id"
              />
            </div>
          )}
          {(activeChannel === "messenger" || !activeChannel) && (
            <div className="space-y-2 pt-1">
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
          )}
          <Button onClick={() => void save()} disabled={saving} data-testid="button-save-social-channels">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save & return to channels
          </Button>
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
              Live outbound replies need Meta credentials configured on your Livia account. Inbound still works once channel IDs are saved.
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
            {step === "webhook" ? "Next — connect IDs" : "Next"}
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
