import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api-fetch";
import { publicBookingSlugPrefix } from "@/lib/surface-urls";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { TIER_OPTIONS } from "@/lib/onboarding-labels";
import { getVerticalOnboardingExtras, getVerticalPlaybook } from "@workspace/policy";
import { verticalPackUi } from "@/lib/vertical-pack-ui";

const EU_TIMEZONES = [
  { value: "Europe/Dublin", label: "Dublin" },
  { value: "Europe/London", label: "London" },
  { value: "Europe/Berlin", label: "Berlin" },
  { value: "Europe/Madrid", label: "Madrid" },
  { value: "Europe/Rome", label: "Rome" },
  { value: "Europe/Amsterdam", label: "Amsterdam" },
  { value: "Europe/Warsaw", label: "Warsaw" },
  { value: "Europe/Paris", label: "Paris" },
] as const;

const formSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  jurisdiction: z.enum(["IE", "GB", "DE", "ES", "IT", "NL", "PL", "SE", "DK", "NO", "FI"]),
  vertical: z.enum([
    "hair",
    "beauty",
    "body-art",
    "wellness",
    "fitness",
    "medspa",
    "allied-health",
    "pet-grooming",
    "automotive-detailing",
  ]),
  tier: z.enum(["solo", "studio", "chain", "chair-host", "white-label"]),
  timezone: z.string().min(1),
  structureKind: z.enum(["standalone", "location", "brand_entity"]).optional(),
  entityKind: z.enum(["sole_trader", "partnership", "limited_company", "other"]),
  vatNumber: z.string().max(32).optional(),
});

type FormValues = z.infer<typeof formSchema>;

type Catalog = {
  jurisdictions: { jurisdiction: string; label: string; defaultTimezone: string }[];
  verticals: { vertical: string; label: string }[];
  tiers: string[];
};

type OnboardingPreview = {
  services: { name: string; durationMinutes: number; priceMinor: number }[];
  aiGreeting: string;
  vertical: string;
};

type Props = {
  onCreated: (businessId: string, slug: string) => void;
  onVerticalPreview?: (vertical: string | null) => void;
  parentBusinessId?: string;
  defaultStructureKind?: "standalone" | "location" | "brand_entity";
};

export function OnboardingCreateBusinessStep({
  onCreated,
  onVerticalPreview,
  parentBusinessId,
  defaultStructureKind = "standalone",
}: Props) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [businessAttested, setBusinessAttested] = useState(false);
  const [preview, setPreview] = useState<OnboardingPreview | null>(null);

  useEffect(() => {
    apiFetch<Catalog>("/onboarding/catalog")
      .then(setCatalog)
      .catch(() => {
        setCatalog({
          jurisdictions: [
            { jurisdiction: "IE", label: "Ireland", defaultTimezone: "Europe/Dublin" },
            { jurisdiction: "GB", label: "United Kingdom", defaultTimezone: "Europe/London" },
          ],
          verticals: [{ vertical: "hair", label: "Hair & barbering" }],
          tiers: ["solo", "studio", "chain"],
        });
      });
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema as never),
    defaultValues: {
      name: "",
      slug: "",
      jurisdiction: "IE",
      vertical: "hair",
      tier: "solo",
      timezone: "Europe/Dublin",
      structureKind: defaultStructureKind,
      entityKind: "sole_trader",
      vatNumber: "",
    },
  });

  const watchVertical = form.watch("vertical");
  const watchName = form.watch("name");
  const watchJurisdiction = form.watch("jurisdiction");
  const verticalHint = getVerticalOnboardingExtras(watchVertical).createBusinessHint;
  const packUi = verticalPackUi(watchVertical);
  const playbook = getVerticalPlaybook(watchVertical);

  useEffect(() => {
    onVerticalPreview?.(watchVertical ?? null);
  }, [watchVertical, onVerticalPreview]);

  useEffect(() => {
    const name = watchName?.trim();
    if (!name || name.length < 2) {
      setPreview(null);
      return;
    }
    const t = window.setTimeout(() => {
      void apiFetch<OnboardingPreview>("/onboarding/preview", {
        method: "POST",
        body: JSON.stringify({
          name,
          vertical: watchVertical,
          jurisdiction: watchJurisdiction,
          tier: form.getValues("tier"),
        }),
      })
        .then(setPreview)
        .catch(() => setPreview(null));
    }, 400);
    return () => window.clearTimeout(t);
  }, [watchName, watchVertical, watchJurisdiction, form]);

  const generateSlug = (name: string) =>
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

  const isSlugTouched = form.formState.dirtyFields.slug;

  if (watchName && !isSlugTouched && form.getValues("slug") !== generateSlug(watchName)) {
    form.setValue("slug", generateSlug(watchName));
  }

  useEffect(() => {
    const j = catalog?.jurisdictions.find((x) => x.jurisdiction === watchJurisdiction);
    if (j?.defaultTimezone) form.setValue("timezone", j.defaultTimezone);
  }, [watchJurisdiction, catalog, form]);

  const onSubmit = (values: FormValues) => {
    if (!businessAttested) {
      toast({
        title: "Confirm your business",
        description: "Tick the box to confirm you operate a legitimate business.",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    apiFetch<{ id: string; slug: string }>("/businesses", {
      method: "POST",
      body: JSON.stringify({
        name: values.name,
        slug: values.slug,
        timezone: values.timezone,
        jurisdiction: values.jurisdiction,
        vertical: values.vertical,
        category: values.vertical,
        tier: values.tier,
        seedDefaults: true,
        parentBusinessId,
        structureKind: values.structureKind ?? defaultStructureKind,
        tenantAttestation: {
          entityKind: values.entityKind,
          tradingName: values.name,
          vatNumber: values.vatNumber?.trim() || undefined,
          attestedAt: new Date().toISOString(),
        },
      }),
    })
      .then((biz) => {
        toast({
          title: "Business created",
          description: "Your starter catalog is ready — keep going through setup.",
        });
        onCreated(biz.id, biz.slug);
      })
      .catch((err: unknown) => {
        toast({
          title: "Could not create business",
          description: err instanceof Error ? err.message : undefined,
          variant: "destructive",
        });
      })
      .finally(() => setSaving(false));
  };

  const jurisdictions = catalog?.jurisdictions ?? [];
  const verticals = catalog?.verticals ?? [];
  const tiers = catalog?.tiers ?? ["solo", "studio", "chain"];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Business name</FormLabel>
              <FormControl>
                <Input placeholder="Acme Studio" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Booking URL</FormLabel>
              <FormControl>
                <div className="flex items-center">
                  <span className="text-muted-foreground bg-muted px-3 py-2 text-sm border border-r-0 border-input rounded-l-md">
                    {publicBookingSlugPrefix()}
                  </span>
                  <Input className="rounded-l-none" placeholder="acme-studio" {...field} />
                </div>
              </FormControl>
              <FormDescription>Share this link with clients.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="jurisdiction"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Country / market</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {jurisdictions.map((j) => (
                    <SelectItem key={j.jurisdiction} value={j.jurisdiction}>
                      {j.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="vertical"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Business type</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {verticals.map((v) => (
                    <SelectItem key={v.vertical} value={v.vertical}>
                      {v.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
              {verticalHint ? (
                <FormDescription className="text-primary/90">{verticalHint}</FormDescription>
              ) : null}
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="entityKind"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Legal entity (self-declared)</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="sole_trader">Sole trader / self-employed</SelectItem>
                  <SelectItem value="partnership">Partnership</SelectItem>
                  <SelectItem value="limited_company">Limited company (Ltd / GmbH / S.L.)</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Not verified in closed beta — used for billing and DPA records later.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="vatNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>VAT number (optional)</FormLabel>
              <FormControl>
                <Input placeholder="IE1234567X" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="tier"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Team size</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {tiers.map((t) => {
                    const meta = TIER_OPTIONS.find((o) => o.value === t);
                    return (
                      <SelectItem key={t} value={t}>
                        {meta?.label ?? t}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        {(parentBusinessId || defaultStructureKind === "location") && (
          <FormField
            control={form.control}
            name="structureKind"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Structure</FormLabel>
                <Select onValueChange={field.onChange} value={field.value ?? "location"}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="location">Location (shop under a brand)</SelectItem>
                    <SelectItem value="brand_entity">Brand / legal entity</SelectItem>
                    <SelectItem value="standalone">Standalone business</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Locations share an owner chain; brand entities group multiple shops.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <FormField
          control={form.control}
          name="timezone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Timezone</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {EU_TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        {preview && preview.services.length > 0 ? (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2">
            <p className="text-sm font-medium">{packUi.label}</p>
            <p className="text-xs text-muted-foreground">{playbook.wedge}</p>
            <p className="text-xs text-muted-foreground">
              Starter {packUi.serviceNoun.toLowerCase()}s:{" "}
              {preview.services.slice(0, 3).map((s) => s.name).join(" · ")}
            </p>
            <p className="text-xs italic text-muted-foreground/90 line-clamp-2">
              Liv: {preview.aiGreeting}
            </p>
          </div>
        ) : null}
        <label className="flex items-start gap-3 cursor-pointer rounded-lg border border-border p-3">
          <Checkbox checked={businessAttested} onCheckedChange={(v) => setBusinessAttested(v === true)} />
          <span className="text-sm text-muted-foreground leading-relaxed">
            I confirm I operate a legitimate business at this location and am authorised to bind it to Livia.
            Livia does not perform KYB or licence checks in the closed beta.
          </span>
        </label>
        <Button type="submit" className="w-full" disabled={saving || !businessAttested}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating…
            </>
          ) : (
            "Create & continue"
          )}
        </Button>
      </form>
    </Form>
  );
}
