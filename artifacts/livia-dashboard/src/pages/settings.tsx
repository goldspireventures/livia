import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "wouter";
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
import {
  Settings,
  Copy,
  ExternalLink,
  Globe,
  Sparkles,
  KeyRound,
  Palette,
  UserCircle,
} from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import CommunicationsControls from "@/components/communications-controls";
import { NotificationPreferencesControls } from "@/components/notification-preferences-controls";
import BillingControls from "@/components/billing-controls";
import PeerInsightsControls from "@/components/peer-insights-controls";
import IntegrationsControls from "@/components/integrations-controls";
import OperationalPolicyControls from "@/components/operational-policy-controls";
import { BookingResourcesPanel } from "@/components/settings/booking-resources-panel";
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
import { PersonaRitualHeader } from "@/components/ritual/persona-ritual-header";
import { PageFrame } from "@/components/ui/page-frame";
import { SettingsDisclosure } from "@/components/ui/settings-disclosure";
import { verticalPackUi } from "@/lib/vertical-pack-ui";
import {
  showBookingResourcesSettings,
  showPeerInsightsForTenant,
} from "@workspace/policy";
import { OwnershipTransferPanel } from "@/components/lifecycle/ownership-transfer-panel";
import { AccountSettingsPanel } from "@/components/settings/account-settings-panel";
import {
  StudioProfileForm,
  type StudioProfileFormValues,
} from "@/components/settings/studio-profile-form";
import { PublicAppearancePanel } from "@/components/settings/public-appearance-panel";
import { AuditLogPanel } from "@/components/audit/audit-log-panel";
import { Users, FileText } from "lucide-react";

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

  const resolvedDefaultTab = useMemo((): SettingsTabId => {
    if (typeof window === "undefined") return visibleTabs[0] ?? "shop";
    const raw = new URLSearchParams(window.location.search).get("tab");
    const legacy: Record<string, SettingsTabId> = {
      general: "shop",
      ai: "liv",
      audit: "legal",
      policy: "shop",
      team: "shop",
      integrations: "billing",
      demo: "account",
    };
    const mapped = raw ? (legacy[raw] ?? (raw as SettingsTabId)) : null;
    if (mapped && visibleTabs.includes(mapped)) return mapped;
    return visibleTabs[0] ?? "shop";
  }, [visibleTabs]);

  const [settingsTab, setSettingsTab] = useState<SettingsTabId>(resolvedDefaultTab);
  useEffect(() => {
    setSettingsTab(resolvedDefaultTab);
  }, [resolvedDefaultTab]);

  const bid = business?.id ?? "";
  const businessVertical = (business as { vertical?: string } | null)?.vertical;
  const vocab = verticalPackUi(businessVertical, business?.category);
  const showPeerInsights = showPeerInsightsForTenant(businessVertical);
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
          toast({ title: "AI assistant updated" });
        },
        onError: () =>
          toast({ title: "Failed to save AI settings", variant: "destructive" }),
      },
    );
  }

  const b = biz as any;
  const bookingUrl = b ? `${window.location.origin}/b/${b.slug}` : "";

  function copyLink() {
    if (!bookingUrl) return;
    navigator.clipboard.writeText(bookingUrl);
    toast({ title: "Booking link copied" });
  }

  return (
    <PageFrame width="md" data-testid="settings-page">
      <PersonaRitualHeader
        variant="page"
        title="Settings"
        subtitle={
          persona === "owner" || persona === "org_admin"
            ? "Your login, studio profile, guest look, Liv, channels, and billing."
            : persona === "manager"
              ? "Your login, Liv tone, and channels — calendar stays on Bookings."
              : "Your login, notifications, and shop basics."
        }
      />

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-96" />
        </div>
      ) : (
        <Tabs
          value={settingsTab}
          onValueChange={(v) => setSettingsTab(v as SettingsTabId)}
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
                ownership: <KeyRound className="h-4 w-4 mr-1.5 shrink-0" />,
                integrations: <Plug className="h-4 w-4 mr-1.5 shrink-0" />,
                legal: <FileText className="h-4 w-4 mr-1.5 shrink-0" />,
              };
              const label =
                tab === "shop" ? vocab.locationNoun : SETTINGS_TAB_LABELS[tab];
              if (tab === "billing" && !showBilling) return null;
              if (tab === "ownership" && !canTransferOwnership) return null;
              if (tab === "comms" && !showComms) return null;
              return (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  data-testid={`tab-${tab}`}
                  className="text-xs sm:text-sm"
                >
                  {icons[tab]}
                  {label}
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
            {b ? (
              <div
                className="flex items-center gap-2 rounded-lg border border-border/80 bg-muted/30 px-3 py-2.5"
                data-testid="settings-booking-link-strip"
              >
                <Globe className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                <span
                  className="flex-1 text-xs font-mono truncate text-muted-foreground"
                  data-testid="text-booking-url"
                  title={bookingUrl}
                >
                  Public booking · /b/{b?.slug}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  aria-label="Copy booking link"
                  onClick={copyLink}
                  data-testid="button-copy-link"
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <a href={bookingUrl} target="_blank" rel="noopener noreferrer">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    aria-label="Open booking link"
                    data-testid="button-open-link"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                </a>
              </div>
            ) : null}

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Settings className="h-4 w-4" />
                  {vocab.locationNoun} profile
                </CardTitle>
              </CardHeader>
              <CardContent>
                <StudioProfileForm
                  form={generalForm}
                  vertical={businessVertical}
                  category={business?.category}
                  locationNoun={vocab.locationNoun}
                  shopEditable={shopEditable}
                  saving={updateBusiness.isPending}
                  onSubmit={onSubmitGeneral}
                />
              </CardContent>
            </Card>

            {(persona === "owner" || persona === "org_admin" || persona === "manager") && (
              <SettingsDisclosure
                title="Booking policies"
                description="Deposits, buffers, and resources Liv uses when confirming."
                defaultOpen={false}
              >
                <div className="space-y-4 pt-1">
                  <OperationalPolicyControls />
                  {showBookingResources ? <BookingResourcesPanel /> : null}
                </div>
              </SettingsDisclosure>
            )}
          </TabsContent>

          {visibleTabs.includes("appearance") && (
            <TabsContent value="appearance" className="space-y-4 mt-0">
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
            </TabsContent>
          )}

          {/* ===== Liv tab ===== */}
          {visibleTabs.includes("liv") && (
          <TabsContent value="liv" className="space-y-4 mt-0">
            {!livEditable && (
              <p className="text-sm text-muted-foreground">You do not have permission to edit Liv settings.</p>
            )}
            <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-[hsl(var(--chart-1))]/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Liv on your booking page
                </CardTitle>
                <CardDescription>
                  How Liv greets guests on `/b`, answers questions, and books when you allow it.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={aiForm.handleSubmit(onSubmitAI)} className="space-y-6">
                  <fieldset disabled={!livEditable} className="space-y-6 disabled:opacity-80">
                  <Controller
                    control={aiForm.control}
                    name="aiEnabled"
                    render={({ field }) => (
                      <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
                        <div className="space-y-0.5">
                          <Label className="text-sm font-medium">Enable AI assistant</Label>
                          <p className="text-xs text-muted-foreground">
                            Show the &quot;Chat with Liv&quot; button on your public booking page.
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

                  <Controller
                    control={aiForm.control}
                    name="aiCanBookDirectly"
                    render={({ field }) => (
                      <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
                        <div className="space-y-0.5">
                          <Label className="text-sm font-medium">Allow auto-booking</Label>
                          <p className="text-xs text-muted-foreground">
                            Let the AI confirm bookings directly. Otherwise it will collect
                            details and you confirm manually.
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

                  <Controller
                    control={aiForm.control}
                    name="aiTone"
                    render={({ field }) => (
                      <div className="space-y-2">
                        <Label>Tone of voice</Label>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger aria-label="Liv AI tone" data-testid="select-ai-tone">
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

                  <div className="space-y-2">
                    <Label>Greeting message</Label>
                    <Textarea
                      {...aiForm.register("aiGreeting")}
                      placeholder="Hi! I'm Liv, your booking assistant. How can I help?"
                      rows={2}
                      data-testid="input-ai-greeting"
                    />
                    <p className="text-xs text-muted-foreground">
                      First line shown when a customer opens the chat. Leave blank for a default.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Knowledge & house rules</Label>
                    <Textarea
                      {...aiForm.register("aiKnowledge")}
                      placeholder="e.g. We don't do bleaching after 5pm. Walk-ins welcome on Sundays. Parking on Elm Street."
                      rows={5}
                      data-testid="input-ai-knowledge"
                    />
                    <p className="text-xs text-muted-foreground">
                      Free-form notes the AI will use to answer questions. Mention policies,
                      preferences, location quirks, anything you'd tell a new receptionist.
                    </p>
                  </div>

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
            <p className="text-sm text-muted-foreground rounded-lg border border-border/80 bg-muted/20 px-3 py-2.5">
              Day-to-day rules and inbox behaviour are in{" "}
              <Link href="/toolkit" className="text-primary font-medium hover:underline">
                Liv hub
              </Link>
              . This tab is only tone and guest-facing chat on `/b`.
            </p>
          </TabsContent>
          )}

          {visibleTabs.includes("comms") && showComms && (
            <TabsContent value="comms" className="space-y-3 mt-0" data-testid="settings-comms-tab">
              {bid ? (
                <>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Notifications</CardTitle>
                      <CardDescription>Push and email alerts for you and your team.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <NotificationPreferencesControls />
                    </CardContent>
                  </Card>
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
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Legal & trust</CardTitle>
                  <CardDescription>Policies your guests and team can rely on.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <Link href="/guides">
                    <Button variant="outline" size="sm">
                      Help & setup guides
                    </Button>
                  </Link>
                  <a
                    href={legalUrl("privacy")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline block"
                  >
                    Privacy policy
                  </a>
                  <a
                    href={legalUrl("tos")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline block"
                  >
                    Terms of service
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
                  description="Who changed what — expand to review recent actions."
                  defaultOpen={false}
                >
                  <AuditLogPanel businessId={bid} embedded />
                </SettingsDisclosure>
              ) : null}
            </TabsContent>
          )}

          {canTransferOwnership && (
            <TabsContent value="ownership" className="space-y-6 mt-0">
              <OwnershipTransferPanel />
            </TabsContent>
          )}

          {showBilling && visibleTabs.includes("billing") && (
            <TabsContent value="billing" className="space-y-6 mt-0">
              <BillingControls />
              {showPeerInsights ? <PeerInsightsControls /> : null}
              <SettingsDisclosure
                title="Imports & integrations"
                description="Calendar sync, CSV clients, and third-party tools."
                defaultOpen={false}
              >
                <IntegrationsControls />
              </SettingsDisclosure>
            </TabsContent>
          )}

        </Tabs>
      )}
    </PageFrame>
  );
}
