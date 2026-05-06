import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Phone, Mail, Send, Trash2, MessageSquare } from "lucide-react";

interface CommsConfig {
  twilioPhoneNumber: string | null;
  twilioPhoneSid: string | null;
  resendFromAddress: string | null;
  smsWebhookUrl: string | null;
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

  async function refresh() {
    try {
      const c = await api<CommsConfig>(`/businesses/${businessId}/communications`);
      setConfig(c);
      setFromAddress(c.resendFromAddress ?? "");
    } catch (e) {
      toast({ title: "Could not load communications config", description: String(e), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

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
      toast({ title: `Test ${testChannel} ${r.status}`, description: r.status === "SENT" ? "Check your inbox/phone." : "Logged as PENDING/FAILED — see notification logs." });
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
  if (!config) return null;

  const sms = config.providerStatus.smsProvider;
  const email = config.providerStatus.emailProvider;

  return (
    <div className="space-y-6">
      <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground space-y-1">
        <div>
          <b>SMS provider:</b>{" "}
          {sms === "twilio"
            ? "Twilio (live)"
            : "Not configured — outbound SMS will be queued only until TWILIO_ACCOUNT_SID is set."}
        </div>
        <div>
          <b>Email provider:</b>{" "}
          {email === "resend"
            ? `Resend (live · default from ${config.providerStatus.emailDefaultFrom})`
            : "Not configured — outbound email will be queued only until RESEND_API_KEY is set."}
        </div>
        {config.smsWebhookUrl && (
          <div className="break-all">
            <b>Inbound SMS webhook:</b> {config.smsWebhookUrl}
          </div>
        )}
      </div>

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
          <div className="space-y-3">
            <div className="text-xs text-muted-foreground">
              Pick a local number for your shop. Customers can text it to book or ask
              questions; Liv answers automatically with the EU AI Act disclosure prefix.
            </div>
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
              placeholder={config.providerStatus.emailDefaultFrom ?? "Acme Salon <hi@acme.salon>"}
            />
            <Button onClick={saveFrom} disabled={savingFrom} variant="secondary">
              {savingFrom ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Format: <code>Display Name &lt;email@domain&gt;</code>. Domain must be verified in Resend.
            Leave blank to use the platform default ({config.providerStatus.emailDefaultFrom ?? "not set"}).
          </p>
        </div>
      </section>

      {/* Test send */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Send className="h-4 w-4" /> Test send
        </h3>
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
      </section>
    </div>
  );
}
