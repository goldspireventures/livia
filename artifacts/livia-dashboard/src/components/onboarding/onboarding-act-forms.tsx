import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-fetch";
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
import { ChannelSetupWizard } from "@/components/channel-setup-wizard";
import { MigrationSwitchPanel } from "@/components/onboarding/migration-switch-panel";
import type { MigrationSourceId } from "@workspace/policy";
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

export type OnboardingActSaveHandler = () => Promise<boolean>;

export function OnboardingActForms({
  act,
  businessId,
  businessSlug,
  checklist,
  onChecklistChange,
  onSaved,
  onRegisterSave,
  previewMode = false,
}: {
  act: OnboardingActId;
  businessId: string;
  businessSlug?: string | null;
  checklist?: OnboardingStatePayload["checklist"];
  onChecklistChange: (next: OnboardingStatePayload["checklist"]) => void;
  onSaved?: () => void;
  onRegisterSave?: (act: OnboardingActId, handler: OnboardingActSaveHandler | null) => void;
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
  const [ownerStaffId, setOwnerStaffId] = useState<string | null>(null);
  const [hoursByDay, setHoursByDay] = useState<Map<number, { startTime: string; endTime: string }>>(
    new Map(),
  );
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
    if (!businessId || !["a2_shop_profile", "a6_liv", "a11_migration", "a12_go_live"].includes(act)) return;
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
    if (act !== "a12_go_live" || !businessId || previewMode) return;
    const poll = () => {
      void apiFetch<{ onboardingState?: OnboardingStatePayload }>(`/businesses/${businessId}`)
        .then((b) => {
          const cl = b.onboardingState?.checklist;
          if (cl?.testBooking && !checklist?.testBooking) {
            onChecklistChange({ ...checklist, ...cl });
          }
        })
        .catch(() => {});
    };
    poll();
    const id = window.setInterval(poll, 4000);
    return () => window.clearInterval(id);
  }, [act, businessId, previewMode, checklist, onChecklistChange]);

  useEffect(() => {
    if (act !== "a5_hours" || !businessId) return;
    if (previewMode) {
      setHoursByDay(
        new Map([
          [1, { startTime: "09:00", endTime: "18:00" }],
          [2, { startTime: "09:00", endTime: "18:00" }],
          [3, { startTime: "09:00", endTime: "18:00" }],
          [4, { startTime: "09:00", endTime: "18:00" }],
          [5, { startTime: "09:00", endTime: "18:00" }],
        ]),
      );
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      apiFetch<{ id: string }[]>(`/businesses/${businessId}/staff`),
    ])
      .then(async ([staff]) => {
        const primaryStaffId = staff[0]?.id ?? null;
        setOwnerStaffId(primaryStaffId);
        const rules = await apiFetch<AvailRule[]>(
          primaryStaffId
            ? `/businesses/${businessId}/availability?staffId=${encodeURIComponent(primaryStaffId)}`
            : `/businesses/${businessId}/availability`,
        );
        const byDay = new Map<number, { startTime: string; endTime: string }>();
        for (const rule of rules) {
          if (!byDay.has(rule.dayOfWeek)) {
            byDay.set(rule.dayOfWeek, { startTime: rule.startTime, endTime: rule.endTime });
          }
        }
        if (byDay.size === 0) {
          for (let day = 1; day <= 5; day++) {
            byDay.set(day, { startTime: "09:00", endTime: "17:00" });
          }
        }
        setHoursByDay(byDay);
      })
      .catch(() => {
        const fallback = new Map<number, { startTime: string; endTime: string }>();
        for (let day = 1; day <= 5; day++) {
          fallback.set(day, { startTime: "09:00", endTime: "17:00" });
        }
        setHoursByDay(fallback);
      })
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

  const saveShop = useCallback(async (): Promise<boolean> => {
    if (previewMode) {
      toast({ title: "Preview only", description: "Shop profile was not saved." });
      return true;
    }
    if (!name.trim()) {
      toast({ title: "Location name required", variant: "destructive" });
      return false;
    }
    setSaving(true);
    try {
      await apiFetch(`/businesses/${businessId}`, {
        method: "PATCH",
        body: JSON.stringify({ name: name.trim(), phone, city, description }),
      });
      onSaved?.();
      return true;
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
      return false;
    } finally {
      setSaving(false);
    }
  }, [previewMode, name, phone, city, description, businessId, onSaved, toast]);

  const saveHours = useCallback(async (): Promise<boolean> => {
    if (previewMode) return true;
    if (hoursByDay.size === 0) {
      toast({ title: "Pick at least one open day", variant: "destructive" });
      return false;
    }
    setSaving(true);
    try {
      const rules = Array.from(hoursByDay.entries()).map(([dayOfWeek, { startTime, endTime }]) => ({
        dayOfWeek,
        startTime,
        endTime,
      }));
      await apiFetch(`/businesses/${businessId}/availability`, {
        method: "PUT",
        body: JSON.stringify({ rules, staffId: ownerStaffId ?? undefined }),
      });
      onChecklistChange({ ...checklist, hoursConfirmed: true });
      onSaved?.();
      return true;
    } catch {
      toast({ title: "Could not save hours", variant: "destructive" });
      return false;
    } finally {
      setSaving(false);
    }
  }, [previewMode, hoursByDay, businessId, ownerStaffId, checklist, onChecklistChange, onSaved, toast]);

  const saveLiv = useCallback(async (): Promise<boolean> => {
    if (previewMode) {
      toast({ title: "Preview only", description: "Liv settings were not saved." });
      return true;
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
      onChecklistChange({ ...checklist, livEnabled: aiEnabled });
      onSaved?.();
      return true;
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
      return false;
    } finally {
      setSaving(false);
    }
  }, [previewMode, aiEnabled, aiTone, aiGreeting, businessId, checklist, onChecklistChange, onSaved, toast]);

  useEffect(() => {
    if (!onRegisterSave) return;
    if (act === "a2_shop_profile") {
      onRegisterSave(act, () => saveShop());
      return () => onRegisterSave(act, null);
    }
    if (act === "a5_hours") {
      onRegisterSave(act, () => saveHours());
      return () => onRegisterSave(act, null);
    }
    if (act === "a6_liv") {
      onRegisterSave(act, () => saveLiv());
      return () => onRegisterSave(act, null);
    }
    onRegisterSave(act, null);
    return undefined;
  }, [act, onRegisterSave, saveShop, saveHours, saveLiv]);

  function toggleHourDay(day: number) {
    const next = new Map(hoursByDay);
    if (next.has(day)) {
      next.delete(day);
    } else {
      next.set(day, { startTime: "09:00", endTime: "17:00" });
    }
    setHoursByDay(next);
  }

  function updateHourTime(day: number, field: "startTime" | "endTime", value: string) {
    const next = new Map(hoursByDay);
    const cur = next.get(day) ?? { startTime: "09:00", endTime: "17:00" };
    next.set(day, { ...cur, [field]: value });
    setHoursByDay(next);
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
            Use your brand plus area or street — not an unrelated trading name.
          </p>
        </div>
        <div className="space-y-2">
          <Label>Phone</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+353 …" />
        </div>
        <div className="space-y-2">
          <Label>City</Label>
          <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Dublin" />
        </div>
        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What you offer — shown on your booking page."
            rows={3}
          />
          <p className="text-xs text-muted-foreground">Public. Keep it short.</p>
        </div>
        {saving ? <p className="text-xs text-muted-foreground">Saving…</p> : null}
      </div>
    );
  }

  if (act === "a5_hours") {
    return (
      <div className="rounded-lg border bg-muted/30 p-4 space-y-3" data-testid="onboarding-hours-form">
        <p className="text-sm text-muted-foreground">
          When you&apos;re open for bookings. You can fine-tune per team member later in Staff.
        </p>
        {DAYS.map((label, day) => {
          const hasDay = hoursByDay.has(day);
          const rule = hoursByDay.get(day);
          return (
            <div
              key={label}
              className={`flex flex-wrap items-center gap-3 rounded-md border p-3 ${
                hasDay ? "border-primary/20 bg-primary/5" : "border-border"
              }`}
            >
              <Switch checked={hasDay} onCheckedChange={() => toggleHourDay(day)} />
              <span className="w-8 text-sm font-medium">{label}</span>
              {hasDay && rule ? (
                <div className="flex flex-1 items-center gap-2">
                  <Input
                    type="time"
                    value={rule.startTime}
                    onChange={(e) => updateHourTime(day, "startTime", e.target.value)}
                    className="h-8 w-28"
                  />
                  <span className="text-sm text-muted-foreground">to</span>
                  <Input
                    type="time"
                    value={rule.endTime}
                    onChange={(e) => updateHourTime(day, "endTime", e.target.value)}
                    className="h-8 w-28"
                  />
                </div>
              ) : null}
            </div>
          );
        })}
        {saving ? <p className="text-xs text-muted-foreground">Saving…</p> : null}
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
        hideSaveButton
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
        <MigrationSwitchPanel
          businessId={businessId}
          businessVertical={businessVertical}
          migrationSource={(checklist as { migrationSource?: string } | undefined)?.migrationSource}
          migrationBookingUrl={checklist?.migrationBookingUrl}
          migrationExternalId={checklist?.migrationExternalId}
          onSourceChange={(sourceId: MigrationSourceId) => {
            onChecklistChange({
              ...checklist,
              migrationIntent: "switching",
              migrationSource: sourceId,
            });
          }}
          onConnectionChange={(fields) => {
            onChecklistChange({
              ...checklist,
              migrationIntent: "switching",
              ...fields,
            });
          }}
          onImported={(total) => {
            onChecklistChange({
              ...checklist,
              migrationImported: true,
              migrationIntent: "switching",
              servicesConfirmed: total > 0 ? true : checklist?.servicesConfirmed,
            });
            if (total > 0) onSaved?.();
          }}
          onSkip={undefined}
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
        {CHECKLIST_ITEMS.map((item) => {
          const isTestBooking = item.key === "testBooking";
          const checked = Boolean(cl[item.key]);
          return (
            <div key={item.key} className="flex items-start gap-2">
              <Checkbox
                id={item.key}
                checked={checked}
                disabled={isTestBooking}
                onCheckedChange={(v) => {
                  if (isTestBooking) return;
                  onChecklistChange({ ...cl, [item.key]: v === true });
                }}
              />
              <div className="space-y-1">
                <label
                  htmlFor={item.key}
                  className={`text-sm leading-snug ${isTestBooking ? "" : "cursor-pointer"}`}
                >
                  {item.label}
                </label>
                {isTestBooking && !checked && businessSlug ? (
                  <a
                    href={`/book/${businessSlug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary underline-offset-2 hover:underline block"
                  >
                    Open your book page and complete a test booking →
                  </a>
                ) : null}
                {isTestBooking && checked ? (
                  <p className="text-[11px] text-muted-foreground">Verified from a real booking.</p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return null;
}
