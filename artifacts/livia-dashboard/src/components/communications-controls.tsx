import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Phone, Mail, Send, Trash2, MessageSquare } from "lucide-react";
import { SocialChannelsControls } from "@/components/social-channels-controls";
import { SettingsDisclosure } from "@/components/ui/settings-disclosure";

interface CommsConfig {
  twilioPhoneNumber: string | null;
  twilioPhoneSid: string | null;
  resendFromAddress: string | null;
  smsWebhookUrl: string | null;
  metaWebhookUrl?: string | null;
  messagingChannels?: Record<string, unknown>;
  metaConfigured?: boolean;
  metaDevSimulate?: boolean;
  jurisdiction?: string;
  jurisdictionLabel?: string;
  channelPack?: {
    sms: boolean;
    webChat: boolean;
    whatsapp: boolean;
    instagram: boolean;
    messenger: boolean;
    voice: boolean;
  };
  providerStatus: {
    smsProvider: "twilio" | "noop";
    emailProvider: "resend" | "noop";
    emailDefaultFrom: string | null;
  };
}

interface AvailableNumber {
  phoneNumber: string;
  friendlyName: string;
  isoCountry: string;
}

const baseUrl = (import.meta.env.BASE_URL || "/").replace(/\/$/, "") + "/api";

async function api<T = unknown>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${baseUrl}${path}`, {
    credentials: "include",
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`);
  return data as T;
}

export default function CommunicationsControls({ businessId }: { businessId: string }) {
  const { toast } = useToast();
  const [config, setConfig] = useState<CommsConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<"auth" | "generic" | null>(null);

  // Provisioning UI state
  const [country, setCountry] = useState("IE");
  const [areaCode, setAreaCode] = useState("");
  const [available, setAvailable] = useState<AvailableNumber[]>([]);
  const [searching, setSearching] = useState(false);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [releasing, setReleasing] = useState(false);

  // Email from-address
  const [fromAddress, setFromAddress] = useState("");
  const [savingFrom, setSavingFrom] = useState(false);

  // Test send
  const [testChannel, setTestChannel] = useState<"SMS" | "EMAIL">("EMAIL");
  const [testTo, setTestTo] = useState("");
  const [testMessage, setTestMessage] = useState(
    "Hi — this is a Livia test message. Reply OK if you received it.",
  );
  const [sending, setSending] = useState(false);
  const [lastResult, setLastResult] = useState<{ status: string; body: string } | null>(null);
  const [voiceStatus, setVoiceStatus] = useState<{
    ingressReady?: boolean;
    message?: string;
    outcomeShareRate?: number;
    usage?: { usedMinutes: number; capMinutes: number; remainingMinutes: number; atCap: boolean };
  } | null>(null);
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [voiceCalls, setVoiceCalls] = useState<
    Array<{ callSid: string; customerPhone: string; turnCount: number; createdAt: string; conversationId: string }>
  >([]);

  async function refresh() {
    setLoadError(null);
    try {
      const c = await api<CommsConfig>(`/businesses/${businessId}/communications`);
      setConfig(c);
      setFromAddress(c.resendFromAddress ?? "");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("401") || /unauthorized/i.test(msg)) {
        setLoadError("auth");
        setConfig(null);
      } else {
        setLoadError("generic");
        toast({
          title: "Could not load communications",
          description: msg,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

  useEffect(() => {
    if (!config?.channelPack?.voice) return;
    void loadVoiceStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config?.channelPack?.voice, businessId]);

  async function loadVoiceStatus() {
    setVoiceLoading(true);
    try {
      const v = await api<{
        ingressReady?: boolean;
        message?: string;
        outcomeShareRate?: number;
        usage?: { usedMinutes: number; capMinutes: number; remainingMinutes: number; atCap: boolean };
      }>(`/businesses/${businessId}/voice/status`);
      setVoiceStatus(v);
      const calls = await api<{
        calls: Array<{
          callSid: string;
          customerPhone: string;
          turnCount: number;
          createdAt: string;
          conversationId: string;
        }>;
      }>(`/businesses/${businessId}/voice/calls`);
      setVoiceCalls(calls.calls ?? []);
    } catch {
      setVoiceStatus(null);
      setVoiceCalls([]);
    } finally {
      setVoiceLoading(false);
    }
  }

  async function searchNumbers() {
    setSearching(true);
    setAvailable([]);
    try {
      const qs = new URLSearchParams({ countryCode: country });
      if (areaCode.trim()) qs.set("areaCode", areaCode.trim());
      const r = await api<{ numbers: AvailableNumber[] }>(
        `/businesses/${businessId}/communications/sms/available-numbers?${qs.toString()}`,
      );
      setAvailable(r.numbers);
      if (r.numbers.length === 0) {
        toast({ title: "No numbers found", description: "Try a different country or area code." });
      }
    } catch (e) {
      toast({ title: "Could not search numbers", description: String(e), variant: "destructive" });
    } finally {
      setSearching(false);
    }
  }

  async function purchase(num: string) {
    setPurchasing(num);
    try {
      await api(`/businesses/${businessId}/communications/sms/provision-number`, {
        method: "POST",
        body: JSON.stringify({ phoneNumber: num }),
      });
      toast({ title: "Number provisioned", description: num });
      setAvailable([]);
      await refresh();
    } catch (e) {
      toast({ title: "Provisioning failed", description: String(e), variant: "destructive" });
    } finally {
      setPurchasing(null);
    }
  }

  async function release() {
    if (!confirm("Release this number back to Twilio? Your shop will stop receiving SMS replies.")) return;
    setReleasing(true);
    try {
      await api(`/businesses/${businessId}/communications/sms/number`, { method: "DELETE" });
      toast({ title: "Number released" });
      await refresh();
    } catch (e) {
      toast({ title: "Release failed", description: String(e), variant: "destructive" });
    } finally {
      setReleasing(false);
    }
  }

  async function saveFrom() {
    setSavingFrom(true);
    try {
      await api(`/businesses/${businessId}/communications/email/from`, {
        method: "PUT",
        body: JSON.stringify({ fromAddress: fromAddress.trim() || null }),
      });
      toast({ title: "Email sender saved" });
      await refresh();
    } catch (e) {
      toast({ title: "Could not save sender", description: String(e), variant: "destructive" });
    } finally {
      setSavingFrom(false);
    }
  }

  async function testSend() {
    if (!testTo.trim()) {
      toast({ title: "Add a recipient first", variant: "destructive" });
      return;
    }
    setSending(true);
    setLastResult(null);
    try {
      const r = await api<{ status: string; body: string }>(
        `/businesses/${businessId}/communications/test-send`,
        {
          method: "POST",
          body: JSON.stringify({ channel: testChannel, to: testTo.trim(), message: testMessage }),
        },
      );
      setLastResult(r);
      toast({ title: `Test ${testChannel} ${r.status}`, description: r.status === "SENT" ? "Check your inbox/phone." : "Logged as FAILED — see notification logs (transport not configured or send rejected)." });
    } catch (e) {
      toast({ title: "Test send failed", description: String(e), variant: "destructive" });
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="text-sm text-muted-foreground flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading communications…
      </div>
    );
  }

  if (loadError === "auth") {
    return (
      <div
        className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm space-y-2"
        data-testid="comms-auth-error"
      >
        <p className="font-medium text-destructive">Session expired or not signed in</p>
        <p className="text-muted-foreground">
          Refresh the page and sign in again to manage SMS, email, and social channels.
        </p>
      </div>
    );
  }

  if (loadError === "generic" || !config) {
    return (
      <div
        className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground space-y-2"
        data-testid="comms-load-error"
      >
        <p>Communications settings could not be loaded for this shop.</p>
        <Button type="button" variant="outline" size="sm" onClick={() => void refresh()}>
          Retry
        </Button>
      </div>
    );
  }

  const sms = config.providerStatus.smsProvider;
  const email = config.providerStatus.emailProvider;
  const pack = config.channelPack;

  return (
    <div className="space-y-6">
      <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground space-y-1">
        {config.jurisdictionLabel ? (
          <div>
            <b>Market:</b> {config.jurisdictionLabel}
            {pack ? (
              <span className="ml-1">
                ·{" "}
                {[
                  pack.sms && "SMS",
                  pack.whatsapp && "WhatsApp",
                  pack.instagram && "Instagram",
                  pack.messenger && "Messenger",
                  pack.voice && "Phone",
                ]
                  .filter(Boolean)
                  .join(", ") || "web only"}
              </span>
            ) : null}
          </div>
        ) : null}
        <div>
          <b>Text messages:</b>{" "}
          {sms === "twilio"
            ? "Ready to send"
            : "Not set up yet — ask your Livia contact to enable SMS for this environment."}
        </div>
        <div>
          <b>Email:</b>{" "}
          {email === "resend"
            ? `Ready to send${config.providerStatus.emailDefaultFrom ? ` (default: ${config.providerStatus.emailDefaultFrom})` : ""}`
            : "Not set up yet — transactional email needs platform configuration."}
        </div>
      </div>

      <SocialChannelsControls businessId={businessId} comms={config} onRefresh={() => void refresh()} />

      {/* SMS number block */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Phone className="h-4 w-4" /> SMS number
        </h3>
        {config.twilioPhoneNumber ? (
          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <div className="font-mono text-sm">{config.twilioPhoneNumber}</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Customers can text this number — Liv replies automatically.
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={release} disabled={releasing}>
              {releasing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Release
            </Button>
          </div>
        ) : (
          <SettingsDisclosure
            title="Get a shop SMS number"
            description="Pick a local number — Liv replies to guests and can answer calls on the same line."
          >
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Country</Label>
                  <Input value={country} onChange={(e) => setCountry(e.target.value.toUpperCase())} maxLength={2} placeholder="IE" />
                </div>
                <div className="space-y-1 col-span-2">
                  <Label className="text-xs">Area code (optional)</Label>
                  <Input value={areaCode} onChange={(e) => setAreaCode(e.target.value)} placeholder="e.g. 1 for Dublin" />
                </div>
              </div>
              <Button onClick={searchNumbers} disabled={searching} variant="secondary">
                {searching ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <MessageSquare className="h-4 w-4 mr-2" />}
                Search available numbers
              </Button>
              {available.length > 0 && (
                <ul className="space-y-2">
                  {available.map((n) => (
                    <li key={n.phoneNumber} className="flex items-center justify-between rounded-md border p-2 text-sm">
                      <div>
                        <span className="font-mono">{n.phoneNumber}</span>
                        <span className="text-xs text-muted-foreground ml-2">{n.friendlyName} · {n.isoCountry}</span>
                      </div>
                      <Button size="sm" onClick={() => purchase(n.phoneNumber)} disabled={purchasing !== null}>
                        {purchasing === n.phoneNumber ? <Loader2 className="h-4 w-4 animate-spin" /> : "Get this number"}
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </SettingsDisclosure>
        )}
      </section>

      {/* Email from-address */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Mail className="h-4 w-4" /> Email sender
        </h3>
        <div className="space-y-1">
          <Label className="text-xs">From address</Label>
          <div className="flex items-center gap-2">
            <Input
              value={fromAddress}
              onChange={(e) => setFromAddress(e.target.value)}
              placeholder={config.providerStatus.emailDefaultFrom ?? "Acme Studio <hi@acme.studio>"}
            />
            <Button onClick={saveFrom} disabled={savingFrom} variant="secondary">
              {savingFrom ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Format: <code>Display Name &lt;email@domain&gt;</code>. Your domain must be verified with your email provider.
            Leave blank to use the platform default ({config.providerStatus.emailDefaultFrom ?? "not set"}).
          </p>
        </div>
      </section>

      <section className="space-y-2 rounded-md border p-4 bg-muted/30">
        <h3 className="text-sm font-semibold">Phone receptionist</h3>
        <p className="text-xs text-muted-foreground">
          Inbound calls for IE/UK shops. Uses the same shop number as SMS above.
          Callers hear the required disclosure before any recording.
        </p>
        {config?.channelPack?.voice ? (
          <div className="text-xs space-y-2">
            {voiceLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : voiceStatus ? (
              <>
                <p>
                  <b>Status:</b>{" "}
                  {voiceStatus.ingressReady
                    ? config.twilioPhoneNumber
                      ? "Live — calls route to Liv on your shop number"
                      : "Platform ready — provision your shop number above"
                    : "Setting up — your Livia contact can enable phone receptionist"}
                </p>
                {voiceStatus.usage ? (
                  <p className="text-muted-foreground">
                    Minutes this month: {voiceStatus.usage.usedMinutes} / {voiceStatus.usage.capMinutes}
                    {voiceStatus.usage.atCap ? " (cap reached — callers asked to text instead)" : ""}
                  </p>
                ) : null}
                {voiceStatus.message ? (
                  <p className="text-muted-foreground">{voiceStatus.message}</p>
                ) : null}
                {voiceCalls.length > 0 ? (
                  <ul className="space-y-1 border-t border-border/60 pt-2">
                    {voiceCalls.slice(0, 5).map((c) => (
                      <li key={c.callSid}>
                        {c.customerPhone} · {c.turnCount} turn{c.turnCount === 1 ? "" : "s"}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">No voice calls yet this period.</p>
                )}
              </>
            ) : (
              <p className="text-muted-foreground">
                Voice add-on active on your plan — provision a number in the SMS section above.
              </p>
            )}
            <Button type="button" size="sm" variant="outline" disabled={voiceLoading} onClick={() => void loadVoiceStatus()}>
              Refresh voice status
            </Button>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Phone receptionist is included on Solo and Studio — upgrade your plan to turn it on.
          </p>
        )}
      </section>

      <SettingsDisclosure title="Test SMS or email" description="Verify delivery before you go live.">
        <div className="space-y-3 pt-2">
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Channel</Label>
              <select
                className="border rounded-md h-9 px-2 text-sm w-full bg-background"
                value={testChannel}
                onChange={(e) => setTestChannel(e.target.value as "SMS" | "EMAIL")}
              >
                <option value="EMAIL">Email</option>
                <option value="SMS">SMS</option>
              </select>
            </div>
            <div className="space-y-1 col-span-2">
              <Label className="text-xs">{testChannel === "SMS" ? "Phone (E.164)" : "Email address"}</Label>
              <Input
                value={testTo}
                onChange={(e) => setTestTo(e.target.value)}
                placeholder={testChannel === "SMS" ? "+35315551234" : "you@example.com"}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Message</Label>
            <Input value={testMessage} onChange={(e) => setTestMessage(e.target.value)} />
          </div>
          <Button onClick={testSend} disabled={sending}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
            Send test
          </Button>
          {lastResult && (
            <div className="rounded-md border p-3 text-xs space-y-1">
              <div>
                <b>Status:</b> {lastResult.status}
              </div>
              <pre className="whitespace-pre-wrap text-muted-foreground">{lastResult.body}</pre>
            </div>
          )}
        </div>
      </SettingsDisclosure>
    </div>
  );
}
