import { useEffect } from "react";
import { useBusiness } from "@/lib/business-context";
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
} from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import DemoDataControls from "@/components/demo-data-controls";
import CommunicationsControls from "@/components/communications-controls";
import { MessageSquare } from "lucide-react";

interface SettingsForm {
  name: string;
  slug: string;
  timezone: string;
  phone: string;
  city: string;
  country: string;
  description: string;
  instagramHandle: string;
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

  const bid = business?.id ?? "";

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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your business profile and AI assistant</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-96" />
        </div>
      ) : (
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList>
            <TabsTrigger value="general" data-testid="tab-general">
              <Settings className="h-4 w-4 mr-2" />
              General
            </TabsTrigger>
            <TabsTrigger value="ai" data-testid="tab-ai">
              <Sparkles className="h-4 w-4 mr-2" />
              AI Assistant
            </TabsTrigger>
            <TabsTrigger value="demo" data-testid="tab-demo">
              <FlaskConical className="h-4 w-4 mr-2" />
              Demo & Data
            </TabsTrigger>
          </TabsList>

          {/* ===== General tab ===== */}
          <TabsContent value="general" className="space-y-6 mt-0">
            {b && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Globe className="h-4 w-4" />
                    Public Booking Link
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <div
                      className="flex-1 bg-muted rounded-md px-3 py-2 text-sm font-mono truncate"
                      data-testid="text-booking-url"
                    >
                      {bookingUrl}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={copyLink}
                      data-testid="button-copy-link"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <a href={bookingUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="icon" data-testid="button-open-link">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </a>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Settings className="h-4 w-4" />
                  Business Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={generalForm.handleSubmit(onSubmitGeneral)}
                  className="space-y-4"
                >
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
                    <Input
                      {...generalForm.register("timezone")}
                      placeholder="e.g. America/New_York"
                      data-testid="input-timezone"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={updateBusiness.isPending}
                    className="w-full"
                    data-testid="button-save-settings"
                  >
                    {updateBusiness.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== AI Assistant tab ===== */}
          <TabsContent value="ai" className="space-y-6 mt-0">
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
                  <Controller
                    control={aiForm.control}
                    name="aiEnabled"
                    render={({ field }) => (
                      <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
                        <div className="space-y-0.5">
                          <Label className="text-sm font-medium">Enable AI assistant</Label>
                          <p className="text-xs text-muted-foreground">
                            Show the "Chat with AI" button on your public booking page.
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
                          <SelectTrigger data-testid="select-ai-tone">
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

                  <Button
                    type="submit"
                    disabled={updateBusiness.isPending}
                    className="w-full"
                    data-testid="button-save-ai"
                  >
                    {updateBusiness.isPending ? "Saving..." : "Save AI Settings"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <MessageSquare className="h-4 w-4" />
                  Communications
                </CardTitle>
                <CardDescription>
                  Per-shop SMS number and email sender. Liv uses these to confirm
                  bookings, send reminders, and reply to customer texts.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {bid ? (
                  <CommunicationsControls businessId={bid} />
                ) : (
                  <p className="text-sm text-muted-foreground">Select a business to manage communications.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

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
    </div>
  );
}
