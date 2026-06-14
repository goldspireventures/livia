import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useBusiness } from "@/lib/business-context";
import { legalUrl } from "@/lib/surface-urls";
import {
  useGetBusiness,
  getGetBusinessQueryKey,
  useUpdateBusiness,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings, Sparkles, Palette, UserCircle } from "lucide-react";
import { LivOutboundTemplatesSection } from "@/components/event-vendor/liv-outbound-templates-section";
import { QuoteTemplatesSection } from "@/components/event-vendor/quote-templates-section";
import { PublicBookLinkCard } from "@/components/settings/public-book-link-card";
import { GuestVaultOwnerCallout } from "@/components/customers/guest-vault-owner-callout";
import { useForm, Controller } from "react-hook-form";
import CommunicationsControls from "@/components/communications-controls";
import { NotificationPreferencesControls } from "@/components/notification-preferences-controls";
import { SettingsBillingTab } from "@/components/settings/settings-billing-tab";
import OperationalPolicyControls from "@/components/operational-policy-controls";
import { GuestCarePolicyControls } from "@/components/settings/guest-care-policy-controls";
import { BookingResourcesPanel } from "@/components/settings/booking-resources-panel";
import { WellnessIntegrationsPanel } from "@/components/settings/wellness-integrations-panel";
import { MessageSquare, CreditCard, Plug, Shield } from "lucide-react";
import { useMembership } from "@/lib/membership-context";
import { usePersona } from "@/lib/persona";
import {
  settingsTabsForPersona,
  SETTINGS_TAB_LABELS,
  canEditShop,
  canEditLiv,
  canViewComms,
  canViewBilling,
  type SettingsTabId,
} from "@/lib/settings-persona";

const SETTINGS_TAB_LEGACY: Record<string, SettingsTabId> = {
  general: "shop",
  ai: "liv",
  audit: "legal",
  policy: "legal",
  ownership: "legal",
  team: "shop",
  integrations: "billing",
  demo: "account",
};

function resolveSettingsTabFromUrl(visibleTabs: SettingsTabId[]): SettingsTabId {
  if (typeof window === "undefined") return visibleTabs[0] ?? "shop";
  const raw = new URLSearchParams(window.location.search).get("tab");
  const mapped = raw ? (SETTINGS_TAB_LEGACY[raw] ?? (raw as SettingsTabId)) : null;
  if (mapped && visibleTabs.includes(mapped)) return mapped;
  return visibleTabs[0] ?? "shop";
}
import { PersonaRitualHeader } from "@/components/ritual/persona-ritual-header";
import { PageFrame } from "@/components/ui/page-frame";
import { SettingsDisclosure } from "@/components/ui/settings-disclosure";
import { verticalPackUi } from "@/lib/vertical-pack-ui";
import { showBookingResourcesSettings } from "@workspace/policy";
import { OwnershipTransferPanel } from "@/components/lifecycle/ownership-transfer-panel";
import { GuestPoliciesPanel } from "@/components/settings/guest-policies-panel";
import { AccountSettingsPanel } from "@/components/settings/account-settings-panel";
import {
  StudioProfileForm,
  type StudioProfileFormValues,
} from "@/components/settings/studio-profile-form";
import { CrossSurfaceContinueCard } from "@/components/onboarding/cross-surface-continue-card";
import { PublicAppearancePanel } from "@/components/settings/public-appearance-panel";
import { LivSetupPanel } from "@/components/liv/liv-setup-panel";
import {
  SettingsAttentionStrip,
  useSettingsAttentionRows,
} from "@/components/settings/settings-attention-strip";
import { AuditLogPanel } from "@/components/audit/audit-log-panel";
import { Users, FileText } from "lucide-react";
import {
  scrollToSettingsAnchor,
  SETTINGS_URL_SYNC_EVENT,
} from "@/lib/commerce-fix-navigation";

interface AIForm {
  aiEnabled: boolean;
  aiCanBookDirectly: boolean;
  aiTone: string;
  aiGreeting: string;
  aiKnowledge: string;
}

export default function SettingsPage() {
  const { business } = useBusiness();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { effectiveRole } = useMembership();
  const { kind: persona } = usePersona();
  const visibleTabs = useMemo(() => settingsTabsForPersona(persona), [persona]);
  const shopEditable = canEditShop(persona);
  const livEditable = canEditLiv(persona);
  const showComms = canViewComms(persona);
  const showBilling = canViewBilling(persona);
  const canTransferOwnership = effectiveRole === "OWNER";
  const [brandFields, setBrandFields] = useState({ logoUrl: "", coverImageUrl: "" });

  const [, setLocation] = useLocation();
  const [settingsTab, setSettingsTab] = useState<SettingsTabId>(() =>
    resolveSettingsTabFromUrl(visibleTabs),
  );

  const syncSettingsFromUrl = useCallback(
    (scrollToHash = true) => {
      const tab = resolveSettingsTabFromUrl(visibleTabs);
      setSettingsTab(tab);
      if (!scrollToHash || typeof window === "undefined") return;
      const hash = window.location.hash.replace("#", "");
      if (!hash) return;
      window.setTimeout(() => {
        scrollToSettingsAnchor(
          `${window.location.pathname}${window.location.search}#${hash}`,
        );
      }, 200);
    },
    [visibleTabs],
  );

  useEffect(() => {
    syncSettingsFromUrl(true);
    const onUrlChange = () => syncSettingsFromUrl(true);
    window.addEventListener("popstate", onUrlChange);
    window.addEventListener(SETTINGS_URL_SYNC_EVENT, onUrlChange);
    return () => {
      window.removeEventListener("popstate", onUrlChange);
      window.removeEventListener(SETTINGS_URL_SYNC_EVENT, onUrlChange);
    };
  }, [syncSettingsFromUrl]);

  const onSettingsTabChange = useCallback(
    (tab: SettingsTabId) => {
      setSettingsTab(tab);
      const params = new URLSearchParams(window.location.search);
      params.set("tab", tab);
      const hash = window.location.hash;
      setLocation(`/settings?${params.toString()}${hash}`);
    },
    [setLocation],
  );

  const bid = business?.id ?? "";
  const { tabsWithAttention } = useSettingsAttentionRows();
  const businessVertical = (business as { vertical?: string } | null)?.vertical;
  const isEventVendor = businessVertical === "event-vendors";
  const vocab = verticalPackUi(businessVertical, business?.category);
  const showBookingResources = showBookingResourcesSettings(businessVertical);

  const { data: biz, isLoading } = useGetBusiness(
    bid,
    { query: { enabled: !!bid } as any },
  );

  const updateBusiness = useUpdateBusiness();
  const generalForm = useForm<StudioProfileFormValues>();
  const aiForm = useForm<AIForm>({
    defaultValues: {
      aiEnabled: true,
      aiCanBookDirectly: true,
      aiTone: "friendly",
      aiGreeting: "",
      aiKnowledge: "",
    },
  });

  useEffect(() => {
    if (biz) {
      const b = biz as any;
      generalForm.reset({
        name: b.name ?? "",
        slug: b.slug ?? "",
        timezone: b.timezone ?? "Europe/London",
        phone: b.phone ?? "",
        city: b.city ?? "",
        country: b.country ?? "",
        description: b.description ?? "",
        instagramHandle: b.instagramHandle ?? "",
        logoUrl: b.logoUrl ?? "",
      });
      setBrandFields({
        logoUrl: b.logoUrl ?? "",
        coverImageUrl: b.coverImageUrl ?? "",
      });
      aiForm.reset({
        aiEnabled: (b.aiEnabled ?? "true") !== "false",
        aiCanBookDirectly: (b.aiCanBookDirectly ?? "true") !== "false",
        aiTone: b.aiTone || "friendly",
        aiGreeting: b.aiGreeting ?? "",
        aiKnowledge: b.aiKnowledge ?? "",
      });
    }
  }, [biz, generalForm, aiForm]);

  function onSubmitGeneral(vals: StudioProfileFormValues) {
    if (!bid) return;
    updateBusiness.mutate(
      { businessId: bid, data: vals },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getGetBusinessQueryKey(bid) });
          toast({ title: "Settings saved" });
        },
        onError: () =>
          toast({ title: "Failed to save settings", variant: "destructive" }),
      },
    );
  }

  function onSubmitAI(vals: AIForm) {
    if (!bid) return;
    updateBusiness.mutate(
      {
        businessId: bid,
        data: {
          aiEnabled: vals.aiEnabled ? "true" : "false",
          aiCanBookDirectly: vals.aiCanBookDirectly ? "true" : "false",
          aiTone: vals.aiTone,
          aiGreeting: vals.aiGreeting,
          aiKnowledge: vals.aiKnowledge,
        } as any,
      },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getGetBusinessQueryKey(bid) });
          toast({ title: "Liv booking-page settings saved" });
        },
        onError: () =>
          toast({ title: "Failed to save AI settings", variant: "destructive" }),
      },
    );
  }

  const b = biz as any;
  const bookingSlug = b?.slug as string | undefined;

  return (
    <PageFrame width="md" data-testid="settings-page">
      <PersonaRitualHeader
        variant="page"
        title="Settings"
        subtitle={
          persona === "owner" || persona === "org_admin"
            ? "Your login, studio profile, guest look, Liv, channels, billing, and legal policies."
            : persona === "manager"
              ? "Your login, Liv tone, and channels — calendar stays on Bookings."
              : "Your login, notifications, and shop basics."
        }
      />

      <SettingsAttentionStrip />

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-96" />
        </div>
      ) : (
        <Tabs
          value={settingsTab}
          onValueChange={(v) => onSettingsTabChange(v as SettingsTabId)}
          className="space-y-4"
        >
          <TabsList className="flex h-auto w-full max-w-full flex-nowrap gap-1 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {visibleTabs.map((tab) => {
              const icons: Partial<Record<SettingsTabId, ReactNode>> = {
                account: <UserCircle className="h-4 w-4 mr-1.5 shrink-0" />,
                shop: <Settings className="h-4 w-4 mr-1.5 shrink-0" />,
                appearance: <Palette className="h-4 w-4 mr-1.5 shrink-0" />,
                policy: <Shield className="h-4 w-4 mr-1.5 shrink-0" />,
                liv: <Sparkles className="h-4 w-4 mr-1.5 shrink-0" />,
                comms: <MessageSquare className="h-4 w-4 mr-1.5 shrink-0" />,
                team: <Users className="h-4 w-4 mr-1.5 shrink-0" />,
                billing: <CreditCard className="h-4 w-4 mr-1.5 shrink-0" />,
                integrations: <Plug className="h-4 w-4 mr-1.5 shrink-0" />,
                legal: <FileText className="h-4 w-4 mr-1.5 shrink-0" />,
              };
              const label =
                tab === "shop" ? vocab.locationNoun : SETTINGS_TAB_LABELS[tab];
              if (tab === "billing" && !showBilling) return null;
              if (tab === "comms" && !showComms) return null;
              return (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  data-testid={`tab-${tab}`}
                  data-attention={tabsWithAttention.has(tab) ? "true" : undefined}
                  className="text-xs sm:text-sm relative"
                >
                  {icons[tab]}
                  {label}
                  {tabsWithAttention.has(tab) ? (
                    <span
                      className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-semibold text-amber-950"
                      aria-hidden
                    >
                      !
                    </span>
                  ) : null}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {visibleTabs.includes("account") && (
            <TabsContent value="account" className="space-y-4 mt-0">
              <AccountSettingsPanel />
            </TabsContent>
          )}

          {/* ===== Shop tab ===== */}
          <TabsContent value="shop" className="space-y-4 mt-0">
            {!shopEditable && (
              <p className="text-sm text-muted-foreground rounded-lg border border-border p-3">
                View-only for your role — ask the owner to change {vocab.locationNoun.toLowerCase()} details.
              </p>
            )}
            {bookingSlug ? (
              <>
                <PublicBookLinkCard
                  slug={bookingSlug}
                  businessName={b?.name as string | undefined}
                  vertical={businessVertical}
                  compact
                  onCopy={() =>
                    toast({
                      title: businessVertical === "event-vendors" ? "Website link copied" : "Booking link copied",
                    })
                  }
                />
                <GuestVaultOwnerCallout
                  slug={bookingSlug}
                  businessName={b?.name as string | undefined}
                  compact
                />
              </>
            ) : null}

            <SettingsDisclosure
              title={`${vocab.locationNoun} profile`}
              defaultOpen={shopEditable}
            >
              <StudioProfileForm
                form={generalForm}
                vertical={businessVertical}
                category={business?.category}
                locationNoun={vocab.locationNoun}
                shopEditable={shopEditable}
                saving={updateBusiness.isPending}
                onSubmit={onSubmitGeneral}
              />
            </SettingsDisclosure>

            {businessVertical === "wellness" && (persona === "owner" || persona === "org_admin") ? (
              <SettingsDisclosure
                title="Wellness integrations"
                description="Broker sync and depth tools for spa operations."
                defaultOpen={false}
              >
                <WellnessIntegrationsPanel />
              </SettingsDisclosure>
            ) : null}
            {(persona === "owner" || persona === "org_admin" || persona === "manager") && (
              <p className="text-sm text-muted-foreground rounded-lg border border-border/80 bg-muted/20 px-3 py-2.5">
                Booking terms, deposits, and cancellation rules live in{" "}
                <button
                  type="button"
                  className="text-primary font-medium hover:underline"
                  onClick={() => onSettingsTabChange("legal")}
                >
                  Legal &amp; trust
                </button>
                .
              </p>
            )}
          </TabsContent>

          {visibleTabs.includes("appearance") && (
            <TabsContent
              value="appearance"
              forceMount
              hidden={settingsTab !== "appearance"}
              className="space-y-4 mt-0 data-[state=inactive]:hidden"
            >
              {!shopEditable && (
                <p className="text-sm text-muted-foreground rounded-lg border border-border p-3">
                  View-only — ask the owner to change store appearance.
                </p>
              )}
              <PublicAppearancePanel
                editable={shopEditable}
                brandFields={brandFields}
                onBrandFieldsChange={setBrandFields}
                appearanceTabActive={settingsTab === "appearance"}
              />
              {shopEditable ? <CrossSurfaceContinueCard variant="appearance" /> : null}
            </TabsContent>
          )}

          {/* ===== Liv tab ===== */}
          {visibleTabs.includes("liv") && (
          <TabsContent value="liv" className="space-y-4 mt-0">
            <LivSetupPanel compact />
            {!livEditable && (
              <p className="text-sm text-muted-foreground">You do not have permission to edit Liv settings.</p>
            )}
            <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-[hsl(var(--chart-1))]/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="h-4 w-4 text-primary" />
                  {isEventVendor ? "Liv for your studio" : "Liv on your booking page"}
                </CardTitle>
                <CardDescription>
                  {isEventVendor
                    ? "Tone and behaviour for inbox replies and operator tools."
                    : "How Liv greets guests on `/b`, answers questions, and books when you allow it."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={aiForm.handleSubmit(onSubmitAI)} className="space-y-6">
                  <fieldset disabled={!livEditable} className="space-y-6 disabled:opacity-80">
                  {!isEventVendor ? (
                  <Controller
                    control={aiForm.control}
                    name="aiEnabled"
                    render={({ field }) => (
                      <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
                        <div className="space-y-0.5">
                          <Label className="text-sm font-medium">Liv on your booking page</Label>
                          <p className="text-xs text-muted-foreground">
                            Show Liv on `/b` so guests can ask questions and book when you allow it.
                          </p>
                        </div>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-ai-enabled"
                        />
                      </div>
                    )}
                  />
                  ) : null}

                  {!isEventVendor ? (
                  <Controller
                    control={aiForm.control}
                    name="aiCanBookDirectly"
                    render={({ field }) => (
                      <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
                        <div className="space-y-0.5">
                          <Label className="text-sm font-medium">Let Liv confirm bookings</Label>
                          <p className="text-xs text-muted-foreground">
                            Liv can lock in a slot on the spot. Off means she gathers details and you confirm.
                          </p>
                        </div>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-ai-autobook"
                        />
                      </div>
                    )}
                  />
                  ) : null}

                  <Controller
                    control={aiForm.control}
                    name="aiTone"
                    render={({ field }) => (
                      <div className="space-y-2">
                        <Label>Tone of voice</Label>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger
                            aria-label={isEventVendor ? "Liv tone on website" : "Liv tone on booking page"}
                            data-testid="select-ai-tone"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="professional">
                              Professional — concise and respectful
                            </SelectItem>
                            <SelectItem value="friendly">
                              Friendly — warm and conversational
                            </SelectItem>
                            <SelectItem value="playful">
                              Playful — casual with personality
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  />

                  <SettingsDisclosure
                    title="Greeting & optional chat notes"
                    description={
                      isEventVendor
                        ? "Fine-tune copy on your public site — most studios only touch the switches above."
                        : "Fine-tune copy on `/b` — most teams only touch the switches above."
                    }
                    defaultOpen={false}
                  >
                    <div className="space-y-4 pt-1">
                      <div className="space-y-2">
                        <Label>Greeting message</Label>
                        <Textarea
                          {...aiForm.register("aiGreeting")}
                          placeholder={
                            isEventVendor
                              ? "Hi — I'm Liv. Tell me about your event and I'll help you enquire."
                              : "Hi — I'm Liv. Ask about services, hours, or pick a time to visit."
                          }
                          rows={2}
                          data-testid="input-ai-greeting"
                        />
                        <p className="text-xs text-muted-foreground">
                          First line shown when a customer opens the chat. Leave blank for a default.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>Extra chat notes</Label>
                        <Textarea
                          {...aiForm.register("aiKnowledge")}
                          placeholder="Optional extras only — house rules and policies belong in Legal & trust."
                          rows={4}
                          data-testid="input-ai-knowledge"
                        />
                        <p className="text-xs text-muted-foreground">
                          Booking terms and house rules are in{" "}
                          <button
                            type="button"
                            className="text-primary hover:underline"
                            onClick={() => onSettingsTabChange("legal")}
                          >
                            Legal &amp; trust
                          </button>
                          . Use this field only for optional tone or one-off chat hints.
                        </p>
                      </div>
                    </div>
                  </SettingsDisclosure>

                  {livEditable && (
                  <Button
                    type="submit"
                    disabled={updateBusiness.isPending}
                    className="w-full"
                    data-testid="button-save-ai"
                  >
                    {updateBusiness.isPending ? "Saving..." : "Save Liv settings"}
                  </Button>
                  )}
                  </fieldset>
                </form>
              </CardContent>
            </Card>
            {isEventVendor && livEditable && bid ? <QuoteTemplatesSection /> : null}
            <p className="text-sm text-muted-foreground rounded-lg border border-border/80 bg-muted/20 px-3 py-2.5">
              Day-to-day rules and inbox behaviour live in{" "}
              <Link href="/toolkit" className="text-primary font-medium hover:underline">
                Advanced Liv
              </Link>
              . Outbound message templates live in{" "}
              <button
                type="button"
                className="text-primary font-medium hover:underline"
                onClick={() => onSettingsTabChange("comms")}
              >
                Channels
              </button>
              .
            </p>
          </TabsContent>
          )}

          {visibleTabs.includes("comms") && showComms && (
            <TabsContent value="comms" className="space-y-3 mt-0" data-testid="settings-comms-tab">
              {bid ? (
                <>
                  {livEditable ? <LivOutboundTemplatesSection businessId={bid} /> : null}
                  <SettingsDisclosure
                    title="Notifications"
                    description="Push and email alerts for you and your team."
                    defaultOpen={false}
                    data-testid="settings-notifications-disclosure"
                  >
                    <div className="pt-2">
                      <NotificationPreferencesControls />
                    </div>
                  </SettingsDisclosure>
                  <SettingsDisclosure
                    title="SMS, email & social"
                    description="Shop number, WhatsApp, and Instagram — Liv replies from one inbox."
                    defaultOpen={false}
                  >
                    <CommunicationsControls businessId={bid} />
                  </SettingsDisclosure>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Select a business first.</p>
              )}
            </TabsContent>
          )}

          {visibleTabs.includes("legal") && (
            <TabsContent value="legal" className="space-y-4 mt-0">
              <SettingsDisclosure
                title="Guest-facing policies"
                description="Terms, privacy, and care copy guests see on `/b` and `/my`."
                defaultOpen={shopEditable || livEditable}
              >
                <GuestPoliciesPanel editable={shopEditable || livEditable} />
              </SettingsDisclosure>

              {(persona === "owner" || persona === "org_admin" || persona === "manager") && (
                <SettingsDisclosure
                  id="booking-policies-legal"
                  title="Booking rules"
                  description="Deposits, buffers, and cancellation windows — Liv uses these with your terms above."
                  defaultOpen={false}
                  className="scroll-mt-24"
                >
                  <div className="space-y-4 pt-1">
                    <OperationalPolicyControls />
                    <GuestCarePolicyControls />
                    {showBookingResources ? <BookingResourcesPanel /> : null}
                  </div>
                </SettingsDisclosure>
              )}

              {canTransferOwnership ? (
                <SettingsDisclosure
                  id="ownership-succession"
                  title="Ownership succession"
                  description="Business succession when you sell or step back."
                  defaultOpen={false}
                  className="scroll-mt-24"
                >
                  <div className="pt-2">
                    <OwnershipTransferPanel />
                  </div>
                </SettingsDisclosure>
              ) : null}

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Livia platform agreements</CardTitle>
                  <CardDescription>
                    Your contract with Livia as the software provider — separate from guest-facing
                    policies above.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <a
                    href={legalUrl("privacy")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline block"
                  >
                    Livia privacy policy
                  </a>
                  <a
                    href={legalUrl("tos")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline block"
                  >
                    Livia terms of service
                  </a>
                  <a
                    href={legalUrl("dpa")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline block"
                  >
                    Data processing agreement (DPA)
                  </a>
                </CardContent>
              </Card>

              {(persona === "owner" || persona === "org_admin") && bid ? (
                <SettingsDisclosure
                  title="Activity log"
                  defaultOpen={false}
                >
                  <AuditLogPanel businessId={bid} embedded />
                </SettingsDisclosure>
              ) : null}
            </TabsContent>
          )}

          {visibleTabs.includes("billing") && (
            <TabsContent value="billing" className="mt-0">
              <SettingsBillingTab />
            </TabsContent>
          )}

        </Tabs>
      )}
    </PageFrame>
  );
}
