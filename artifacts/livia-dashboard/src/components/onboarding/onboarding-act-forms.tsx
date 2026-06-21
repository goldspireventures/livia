import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-fetch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Check } from "lucide-react";
import { ChannelSetupWizard } from "@/components/channel-setup-wizard";
import { UniversalImportPanel } from "@/components/settings/universal-import-panel";
import { OnboardingLivReplyStep } from "@/components/onboarding/onboarding-liv-reply-step";
import type { OnboardingActId } from "@/lib/onboarding-acts";
import type { OnboardingStatePayload } from "./onboarding-wizard";
import { getVerticalOnboardingExtras, isOwnerConfiguredChannelId } from "@workspace/policy";
import { ONBOARDING_PREVIEW_SHOP_NAME } from "@/lib/onboarding-preview-fixtures";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type AvailRule = { dayOfWeek: number; startTime: string; endTime: string };

const CHECKLIST_ITEMS: { key: keyof NonNullable<OnboardingStatePayload["checklist"]>; label: string }[] = [
  { key: "testBooking", label: "Test booking on public page" },
  { key: "livEnabled", label: "Liv enabled with greeting" },
  { key: "servicesConfirmed", label: "Services confirmed" },
  { key: "hoursConfirmed", label: "Opening hours set" },
  { key: "smsOrVoiceConnected", label: "SMS or voice connected (or planned)" },
  { key: "socialChannelsStarted", label: "WhatsApp or Instagram connected (or simulated in dev)" },
  { key: "publicLinkShared", label: "Booking link shared with team" },
  { key: "teamInvited", label: "Team invited (if not solo)" },
  { key: "billingStarted", label: "Billing plan viewed" },
];

export function OnboardingActForms({
  act,
  businessId,
  checklist,
  onChecklistChange,
  onSaved,
  previewMode = false,
}: {
  act: OnboardingActId;
  businessId: string;
  checklist?: OnboardingStatePayload["checklist"];
  onChecklistChange: (next: OnboardingStatePayload["checklist"]) => void;
  onSaved?: () => void;
  previewMode?: boolean;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [description, setDescription] = useState("");
  const [aiEnabled, setAiEnabled] = useState(true);
  const [aiTone, setAiTone] = useState("FRIENDLY");
  const [aiGreeting, setAiGreeting] = useState("");
  const [avail, setAvail] = useState<AvailRule[] | null>(null);
  const [commsPhone, setCommsPhone] = useState<string | null>(null);
  const [commsFull, setCommsFull] = useState<{
    twilioPhoneNumber?: string | null;
    metaWebhookUrl?: string | null;
    messagingChannels?: Record<string, unknown>;
    metaConfigured?: boolean;
    metaDevSimulate?: boolean;
  } | null>(null);
  const [businessJurisdiction, setBusinessJurisdiction] = useState<string | undefined>();
  const [businessVertical, setBusinessVertical] = useState<string | undefined>();

  useEffect(() => {
    if (!businessId || !["a2_shop_profile", "a6_liv"].includes(act)) return;
    if (previewMode) {
      setName(ONBOARDING_PREVIEW_SHOP_NAME);
      setPhone("+353 1 234 5678");
      setCity("Dublin");
      setDescription("Hair, colour, and spa — preview data.");
      setAiEnabled(true);
      setAiTone("FRIENDLY");
      setAiGreeting("Hi! I'm Liv at Luxe Salon — how can I help you book today?");
      setLoading(false);
      return;
    }
    setLoading(true);
    apiFetch<Record<string, unknown>>(`/businesses/${businessId}`)
      .then((b) => {
        setName(String(b.name ?? ""));
        setPhone(String(b.phone ?? ""));
        setCity(String(b.city ?? ""));
        setDescription(String(b.description ?? ""));
        setAiEnabled(String(b.aiEnabled ?? "true") !== "false");
        setAiTone(String(b.aiTone ?? "FRIENDLY").toUpperCase());
        setAiGreeting(String(b.aiGreeting ?? ""));
        if ("vertical" in b) setBusinessVertical(String(b.vertical ?? ""));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [businessId, act, previewMode]);

  useEffect(() => {
    if (act !== "a5_hours" || !businessId) return;
    if (previewMode) {
      setAvail([
        { dayOfWeek: 1, startTime: "09:00", endTime: "18:00" },
        { dayOfWeek: 2, startTime: "09:00", endTime: "18:00" },
        { dayOfWeek: 3, startTime: "09:00", endTime: "18:00" },
      ]);
      setLoading(false);
      return;
    }
    setLoading(true);
    apiFetch<AvailRule[]>(`/businesses/${businessId}/availability`)
      .then(setAvail)
      .catch(() => setAvail([]))
      .finally(() => setLoading(false));
  }, [act, businessId, previewMode]);

  useEffect(() => {
    if (act !== "a7_channels" || !businessId) return;
    if (previewMode) {
      setCommsPhone("+353 …");
      setCommsFull({ metaDevSimulate: true });
      return;
    }
    apiFetch<{
      twilioPhoneNumber?: string | null;
      metaWebhookUrl?: string | null;
      messagingChannels?: Record<string, unknown>;
      metaConfigured?: boolean;
      metaDevSimulate?: boolean;
    }>(`/businesses/${businessId}/communications`)
      .then((c) => {
        setCommsPhone(c.twilioPhoneNumber ?? null);
        setCommsFull(c);
        const ch = c.messagingChannels as { whatsapp?: { phoneNumberId?: string }; instagram?: { pageId?: string } } | undefined;
        if (
          isOwnerConfiguredChannelId(ch?.whatsapp?.phoneNumberId) ||
          isOwnerConfiguredChannelId(ch?.instagram?.pageId)
        ) {
          onChecklistChange({ ...checklist, socialChannelsStarted: true });
        }
      })
      .catch(() => {
        setCommsPhone(null);
        setCommsFull(null);
      });
    apiFetch<{ jurisdiction?: string }>(`/businesses/${businessId}`)
      .then((b) => setBusinessJurisdiction(b.jurisdiction))
      .catch(() => setBusinessJurisdiction(undefined));
  }, [act, businessId]);

  async function saveShop() {
    if (previewMode) {
      toast({ title: "Preview only", description: "Shop profile was not saved." });
      return;
    }
    setSaving(true);
    try {
      await apiFetch(`/businesses/${businessId}`, {
        method: "PATCH",
        body: JSON.stringify({ name: name.trim() || undefined, phone, city, description }),
      });
      toast({ title: "Shop profile saved" });
      onSaved?.();
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function saveLiv() {
    if (previewMode) {
      toast({ title: "Preview only", description: "Liv settings were not saved." });
      return;
    }
    setSaving(true);
    try {
      await apiFetch(`/businesses/${businessId}`, {
        method: "PATCH",
        body: JSON.stringify({
          aiEnabled: aiEnabled ? "true" : "false",
          aiTone,
          aiGreeting: aiGreeting || undefined,
        }),
      });
      toast({ title: "Liv settings saved" });
      onChecklistChange({ ...checklist, livEnabled: aiEnabled });
      onSaved?.();
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  if (loading && ["a2_shop_profile", "a5_hours"].includes(act)) {
    return <Skeleton className="h-32 w-full" />;
  }

  if (act === "a2_shop_profile") {
    return (
      <div className="space-y-4 rounded-lg border bg-muted/30 p-4" data-testid="onboarding-shop-form">
        <div className="space-y-2">
          <Label>Location name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Aurora Studio — Dundrum"
            required
          />
          <p className="text-xs text-muted-foreground">
            Use your brand plus area or street — not a unrelated trading name.
          </p>
        </div>
        <div className="space-y-2">
          <Label>Phone</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+353 …" />
        </div>
        <div className="space-y-2">
          <Label>City</Label>
          <Input value={city} onChange={(e) => setCity(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What makes your shop special?"
            rows={3}
          />
        </div>
        <Button onClick={() => void saveShop()} disabled={saving}>
          Save shop profile
        </Button>
      </div>
    );
  }

  if (act === "a5_hours") {
    const byDay = new Map<number, AvailRule[]>();
    for (const r of avail ?? []) {
      const list = byDay.get(r.dayOfWeek) ?? [];
      list.push(r);
      byDay.set(r.dayOfWeek, list);
    }
    return (
      <div className="rounded-lg border bg-muted/30 p-4 space-y-3" data-testid="onboarding-hours-preview">
        <p className="text-sm font-medium">Weekly hours ({avail?.length ?? 0} rules)</p>
        {avail && avail.length > 0 ? (
          <ul className="text-sm text-muted-foreground grid grid-cols-2 gap-1">
            {DAYS.map((label, i) => {
              const rules = byDay.get(i);
              if (!rules?.length) return null;
              return (
                <li key={label}>
                  <Check className="inline h-3 w-3 text-primary mr-1" />
                  {label}: {rules.map((r) => `${r.startTime}–${r.endTime}`).join(", ")}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-amber-600">No hours yet — set them on a staff member.</p>
        )}
        <p className="text-xs text-muted-foreground">
          Default seed may have added hours for the owner. Adjust per team member under Staff → Availability.
        </p>
      </div>
    );
  }

  if (act === "a6_liv") {
    return (
      <OnboardingLivReplyStep
        businessName={name}
        aiEnabled={aiEnabled}
        aiTone={aiTone}
        aiGreeting={aiGreeting}
        saving={saving}
        onEnabledChange={setAiEnabled}
        onToneChange={setAiTone}
        onGreetingChange={setAiGreeting}
        onSave={() => void saveLiv()}
      />
    );
  }

  if (act === "a7_channels" && previewMode) {
    return (
      <p className="text-sm text-muted-foreground rounded-lg border bg-muted/30 p-4" data-testid="onboarding-channels-preview">
        Channel setup needs the real app. Use{" "}
        <a href="/onboarding" className="text-primary underline">
          signed-in onboarding
        </a>{" "}
        or preview A6 / A8 here.
      </p>
    );
  }

  if (act === "a7_channels") {
    return (
      <div className="space-y-4" data-testid="onboarding-channels-status">
        <p className="text-xs text-muted-foreground">
          Business SMS: <strong>{commsPhone ?? "Provision in Settings → Communications after this step"}</strong>
        </p>
        <ChannelSetupWizard
          businessId={businessId}
          comms={commsFull}
          jurisdiction={businessJurisdiction}
          compact
          onRefresh={() => {
            apiFetch<{
              twilioPhoneNumber?: string | null;
              messagingChannels?: Record<string, unknown>;
              metaWebhookUrl?: string | null;
              metaConfigured?: boolean;
              metaDevSimulate?: boolean;
            }>(`/businesses/${businessId}/communications`)
              .then((c) => {
                setCommsFull(c);
                setCommsPhone(c.twilioPhoneNumber ?? null);
                const ch = c.messagingChannels as {
                  whatsapp?: { phoneNumberId?: string };
                  instagram?: { pageId?: string };
                };
                if (
                  isOwnerConfiguredChannelId(ch?.whatsapp?.phoneNumberId) ||
                  isOwnerConfiguredChannelId(ch?.instagram?.pageId)
                ) {
                  onChecklistChange({ ...checklist, socialChannelsStarted: true });
                }
              })
              .catch(() => {});
          }}
        />
      </div>
    );
  }

  if (act === "a11_migration") {
    return (
      <div data-testid="onboarding-migration-step">
        <UniversalImportPanel
          businessId={businessId}
          compact
          onImported={() => {
            onChecklistChange({ ...checklist, migrationImported: true });
            onSaved?.();
          }}
        />
      </div>
    );
  }

  if (act === "a12_go_live") {
    const cl = checklist ?? {};
    const doneCount = CHECKLIST_ITEMS.filter((i) => cl[i.key]).length;
    const verticalExtras = getVerticalOnboardingExtras(businessVertical).goLiveExtras;
    return (
      <div className="space-y-3" data-testid="onboarding-go-live-checklist">
        <p className="text-sm text-muted-foreground">
          {doneCount} of {CHECKLIST_ITEMS.length} ready — honest checklist before customers arrive.
        </p>
        {verticalExtras.length > 0 ? (
          <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1 border border-border/60 rounded-lg p-3 bg-muted/30">
            {verticalExtras.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        ) : null}
        {CHECKLIST_ITEMS.map((item) => (
          <div key={item.key} className="flex items-start gap-2">
            <Checkbox
              id={item.key}
              checked={Boolean(cl[item.key])}
              onCheckedChange={(v) =>
                onChecklistChange({ ...cl, [item.key]: v === true })
              }
            />
            <label htmlFor={item.key} className="text-sm leading-snug cursor-pointer">
              {item.label}
            </label>
          </div>
        ))}
      </div>
    );
  }

  return null;
}
