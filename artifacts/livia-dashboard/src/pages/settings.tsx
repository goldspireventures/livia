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
  FlaskConical,
  KeyRound,
  Palette,
} from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import DemoDataControls from "@/components/demo-data-controls";
import CommunicationsControls from "@/components/communications-controls";
import { NotificationPreferencesControls } from "@/components/notification-preferences-controls";
import BillingControls from "@/components/billing-controls";
import PeerInsightsControls from "@/components/peer-insights-controls";
import IntegrationsControls from "@/components/integrations-controls";
import OperationalPolicyControls from "@/components/operational-policy-controls";
import { BookingResourcesPanel } from "@/components/settings/booking-resources-panel";
import LivPromptControls from "@/components/liv-prompt-controls";
import LivMandateControls from "@/components/liv-mandate-controls";
import { LivToolCatalogControls } from "@/components/liv/liv-tool-catalog-controls";
import { MessageSquare, CreditCard, Plug, Shield } from "lucide-react";
import { useMembership } from "@/lib/membership-context";
import { usePersona } from "@/lib/persona";
import {
  settingsTabsForPersona,
  SETTINGS_TAB_LABELS,
  canEditShop,
  canEditLiv,
  canViewComms,
  canViewTeam,
  canViewBilling,
  type SettingsTabId,
} from "@/lib/settings-persona";
import { PersonaSettingsBanner } from "@/components/ritual/persona-settings-banner";
import { PersonaRitualHeader } from "@/components/ritual/persona-ritual-header";
import { PageFrame } from "@/components/ui/page-frame";
import { SettingsDisclosure } from "@/components/ui/settings-disclosure";
import { EU_TIMEZONES } from "@/lib/eu-timezones";
import { verticalPackUi } from "@/lib/vertical-pack-ui";
import { SETTINGS_SHOP_SECONDARY_DEFAULT_OPEN, showPeerInsightsForTenant } from "@workspace/policy";
import { OwnershipTransferPanel } from "@/components/lifecycle/ownership-transfer-panel";
import { PublicAppearancePanel } from "@/components/settings/public-appearance-panel";
import { Users, FileText } from "lucide-react";

interface SettingsForm {
  name: string;
  slug: string;
  timezone: string;
  phone: string;
  city: string;
  country: string;
  description: string;
  instagramHandle: string;
  logoUrl: string;
}

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
  const showDemo = import.meta.env.DEV;
  const visibleTabs = useMemo(
    () => settingsTabsForPersona(persona, { showDemo }),
    [persona, showDemo],
  );
  const shopEditable = canEditShop(persona);
  const livEditable = canEditLiv(persona);
  const showComms = canViewComms(persona);
  const showTeam = canViewTeam(persona);
  const showBilling = canViewBilling(persona);
  const canTransferOwnership = effectiveRole === "OWNER";
  const [brandFields, setBrandFields] = useState({ logoUrl: "", coverImageUrl: "" });

  const defaultTab = useMemo((): SettingsTabId => {
    if (typeof window === "undefined") return visibleTabs[0] ?? "shop";
    const raw = new URLSearchParams(window.location.search).get("tab");
    const mapped =
      raw === "general" ? "shop" : raw === "ai" ? "liv" : (raw as SettingsTabId | null);
    if (mapped && visibleTabs.includes(mapped)) return mapped;
    return visibleTabs[0] ?? "shop";
  }, [visibleTabs]);

  const bid = business?.id ?? "";
  const businessVertical = (business as { vertical?: string } | null)?.vertical;
  const vocab = verticalPackUi(businessVertical, business?.category);
  const showPeerInsights = showPeerInsightsForTenant(businessVertical);

  const { data: biz, isLoading } = useGetBusiness(
    bid,
    { query: { enabled: !!bid } as any },
  );

  const updateBusiness = useUpdateBusiness();
  const generalForm = useForm<SettingsForm>();
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

  function onSubmitGeneral(vals: SettingsForm) {
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
    <PageFrame width="md">
      <PersonaRitualHeader
        variant="page"
        title="Settings"
        subtitle="Shop profile, Liv, channels, and plan — grouped by what you configure most."
      />
      <PersonaSettingsBanner />

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-96" />
        </div>
      ) : (
        <Tabs defaultValue={defaultTab} className="space-y-4">
          <TabsList className="flex flex-wrap h-auto gap-1">
            {visibleTabs.map((tab) => {
              const icons: Partial<Record<SettingsTabId, ReactNode>> = {
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
                demo: <FlaskConical className="h-4 w-4 mr-1.5 shrink-0" />,
              };
              const label =
                tab === "shop" ? vocab.locationNoun : SETTINGS_TAB_LABELS[tab];
              if (tab === "billing" && !showBilling) return null;
              if (tab === "integrations" && !showBilling) return null;
              if (tab === "ownership" && !canTransferOwnership) return null;
              if (tab === "team" && !showTeam) return null;
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
                >
                  {bookingUrl}
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
                  Business details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={generalForm.handleSubmit(onSubmitGeneral)}
                  className="space-y-4"
                >
                  <fieldset disabled={!shopEditable} className="space-y-4 disabled:opacity-80">
                  <div className="space-y-2">
                    <Label>Business Name *</Label>
                    <Input
                      {...generalForm.register("name", { required: true })}
                      data-testid="input-business-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>URL Slug *</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground whitespace-nowrap">/b/</span>
                      <Input
                        {...generalForm.register("slug", { required: true })}
                        data-testid="input-slug"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Your public booking URL identifier
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      {...generalForm.register("description")}
                      data-testid="input-description"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Logo image URL</Label>
                    <Input
                      {...generalForm.register("logoUrl")}
                      placeholder="https://… (HTTPS image for booking page)"
                      data-testid="input-logo-url"
                    />
                    <p className="text-xs text-muted-foreground">
                      Shown on your public booking page. Upload to your CDN or storage, then paste the URL here.
                    </p>
                    {generalForm.watch("logoUrl") ? (
                      <img
                        src={generalForm.watch("logoUrl")}
                        alt=""
                        className="h-12 w-12 rounded-lg object-cover border"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : null}
                  </div>
                  <SettingsDisclosure
                    title="Contact & location"
                    description="Phone, socials, city, and timezone."
                    defaultOpen={SETTINGS_SHOP_SECONDARY_DEFAULT_OPEN}
                  >
                    <div className="space-y-4 pt-1">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Phone</Label>
                          <Input {...generalForm.register("phone")} data-testid="input-phone" />
                        </div>
                        <div className="space-y-2">
                          <Label>Instagram</Label>
                          <Input
                            {...generalForm.register("instagramHandle")}
                            placeholder="@handle"
                            data-testid="input-instagram"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>City</Label>
                          <Input {...generalForm.register("city")} data-testid="input-city" />
                        </div>
                        <div className="space-y-2">
                          <Label>Country</Label>
                          <Input
                            {...generalForm.register("country")}
                            data-testid="input-country"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Timezone</Label>
                        <Controller
                          control={generalForm.control}
                          name="timezone"
                          render={({ field }) => (
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger aria-label="Time zone" data-testid="input-timezone">
                                <SelectValue placeholder="Select timezone" />
                              </SelectTrigger>
                              <SelectContent>
                                {EU_TIMEZONES.map((tz) => (
                                  <SelectItem key={tz.value} value={tz.value}>
                                    {tz.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                    </div>
                  </SettingsDisclosure>
                  {shopEditable && (
                  <Button
                    type="submit"
                    disabled={updateBusiness.isPending}
                    className="w-full"
                    data-testid="button-save-settings"
                  >
                    {updateBusiness.isPending ? "Saving..." : "Save shop details"}
                  </Button>
                  )}
                  </fieldset>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {visibleTabs.includes("appearance") && (
            <TabsContent value="appearance" className="space-y-4 mt-0">
              {!shopEditable && (
                <p className="text-sm text-muted-foreground rounded-lg border border-border p-3">
                  View-only — ask the owner to change public appearance.
                </p>
              )}
              <PublicAppearancePanel
                editable={shopEditable}
                brandFields={brandFields}
                onBrandFieldsChange={setBrandFields}
              />
            </TabsContent>
          )}

          {visibleTabs.includes("policy") && (
            <TabsContent value="policy" className="space-y-4 mt-0">
              <OperationalPolicyControls />
              <BookingResourcesPanel />
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
                  AI Booking Assistant
                </CardTitle>
                <CardDescription>
                  Customers can chat with an AI on your booking page that answers questions
                  and books appointments on your behalf.
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
            {livEditable ? <LivMandateControls /> : null}
            {livEditable ? (
              <SettingsDisclosure
                title="Prompt overrides"
                description="Advanced — custom system prompts per workflow."
              >
                <LivPromptControls />
              </SettingsDisclosure>
            ) : null}
            {livEditable ? (
              <SettingsDisclosure
                title="Tool catalog"
                description="Which actions Liv can take on your behalf."
              >
                <LivToolCatalogControls />
              </SettingsDisclosure>
            ) : null}
          </TabsContent>
          )}

          {visibleTabs.includes("comms") && showComms && (
            <TabsContent value="comms" className="space-y-4 mt-0">
              {bid ? (
                <>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Notifications</CardTitle>
                      <CardDescription>Push and email alerts for you and your team.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <NotificationPreferencesControls />
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <MessageSquare className="h-4 w-4" />
                        SMS, email & social
                      </CardTitle>
                      <CardDescription>
                        Your shop number, WhatsApp, and Instagram — Liv replies from one inbox.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <CommunicationsControls businessId={bid} />
                    </CardContent>
                  </Card>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Select a business first.</p>
              )}
            </TabsContent>
          )}

          {visibleTabs.includes("team") && showTeam && (
            <TabsContent value="team" className="space-y-4 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Team & services</CardTitle>
                  <CardDescription>
                    Roster, service assignments, and schedules live on the Team page.
                    {persona === "manager" ? " You can view; owners invite and edit profiles." : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-3">
                  <a href="/staff">
                    <Button variant="default">Open team roster</Button>
                  </a>
                  <a href="/services">
                    <Button variant="outline">Manage services</Button>
                  </a>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {visibleTabs.includes("legal") && (
            <TabsContent value="legal" className="space-y-4 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Legal & trust</CardTitle>
                  <CardDescription>Published policies for customers and design partners.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="rounded-lg border border-border p-3 space-y-2">
                    <p className="font-medium text-foreground">Operator ready pack</p>
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      Starter policies, leave procedure, running late, and team invite copy — ready for your
                      practice (adapt with your solicitor). In-repo:{" "}
                      <code className="text-[11px]">docs/business/OPERATOR-READY-PACK.md</code>
                    </p>
                    <Link href="/guides">
                      <Button variant="outline" size="sm">
                        Open guides & vertical demos
                      </Button>
                    </Link>
                  </div>
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
            </TabsContent>
          )}

          {showBilling && visibleTabs.includes("integrations") && (
            <TabsContent value="integrations" className="space-y-6 mt-0">
              <IntegrationsControls />
            </TabsContent>
          )}

          {/* ===== Demo & Data tab ===== */}
          <TabsContent value="demo" className="space-y-6 mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FlaskConical className="h-4 w-4" />
                  Demo data
                </CardTitle>
                <CardDescription>
                  Reload sample data or wipe your workspace to start fresh. Demo data
                  creates 3 example businesses with staff, services, customers, and bookings.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <DemoDataControls variant="settings" />
                <p className="text-xs text-muted-foreground">
                  Note: "Reload demo data" will skip if you already have businesses. Wipe
                  first if you want a fresh seed.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </PageFrame>
  );
}
