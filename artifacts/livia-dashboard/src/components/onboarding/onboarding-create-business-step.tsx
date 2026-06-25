import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api-fetch";
import { parseUserFacingError } from "@/lib/user-facing-errors";
import { publicBookingSlugPrefix, publicBookingSlugSuffix } from "@/lib/surface-urls";
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
import {
  getVerticalStarterPackOffer,
  getVerticalOnboardingExtras,
  getVerticalPlaybook,
  verticalStarterPackIncludesRetail,
  onboardingCommerceBlocksForVertical,
  retailStarterPackFootnote,
  listSubverticalProfiles,
  defaultSubverticalProfile,
  getSubverticalProfile,
  onboardingHintForSubvertical,
  resolveOnboardingTierFromSubvertical,
  SHARED_PREMISES_ONBOARDING_NOTE,
  shouldSeedStarterPackOnCreate,
  MIGRATION_INTENT_OPTIONS,
  type MigrationIntent,
} from "@workspace/policy";
import { verticalPackUi } from "@/lib/vertical-pack-ui";
import {
  clearOnboardingFormDraft,
  readOnboardingFormDraft,
  writeOnboardingFormDraft,
} from "@/lib/onboarding-form-draft";

const CREATE_BUSINESS_DRAFT_KEY = "create-business";

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
  tier: z.enum([
    "solo",
    "studio",
    "chain",
    "mid-chain",
    "franchise",
    "chair-host",
    "white-label",
  ]),
  timezone: z.string().min(1),
  structureKind: z.enum(["standalone", "location", "brand_entity"]).optional(),
  entityKind: z.enum(["sole_trader", "partnership", "limited_company", "other"]),
  vatNumber: z.string().max(32).optional(),
  subverticalProfileId: z.string().optional(),
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
  starterPackAvailable?: boolean;
  starterPackServices?: { name: string; durationMinutes: number; priceMinor: number }[];
};

type Props = {
  onCreated: (
    businessId: string,
    slug: string,
    extras?: { migrationIntent?: MigrationIntent },
  ) => void;
  onVerticalPreview?: (vertical: string | null) => void;
  parentBusinessId?: string;
  defaultStructureKind?: "standalone" | "location" | "brand_entity";
  initialMigrationIntent?: MigrationIntent;
  hideMigrationIntentPicker?: boolean;
};

export function OnboardingCreateBusinessStep({
  onCreated,
  onVerticalPreview,
  parentBusinessId,
  defaultStructureKind = "standalone",
  initialMigrationIntent,
  hideMigrationIntentPicker = false,
}: Props) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [businessAttested, setBusinessAttested] = useState(false);
  const resolvedIntent: MigrationIntent =
    initialMigrationIntent && initialMigrationIntent !== "unspecified"
      ? initialMigrationIntent
      : "unspecified";
  const [migrationIntent, setMigrationIntent] = useState<MigrationIntent>(resolvedIntent);
  const [starterPack, setStarterPack] = useState(true);
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

  useEffect(() => {
    if (!initialMigrationIntent || initialMigrationIntent === "unspecified") return;
    setMigrationIntent(initialMigrationIntent);
    if (initialMigrationIntent === "switching") setStarterPack(false);
    if (initialMigrationIntent === "fresh" && shouldSeedStarterPackOnCreate("fresh")) {
      setStarterPack(true);
    }
  }, [initialMigrationIntent]);

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
      subverticalProfileId: defaultSubverticalProfile("hair").id,
      ...readOnboardingFormDraft<FormValues>(CREATE_BUSINESS_DRAFT_KEY),
    },
  });

  useEffect(() => {
    const sub = form.watch((values) => {
      writeOnboardingFormDraft(CREATE_BUSINESS_DRAFT_KEY, values as Record<string, unknown>);
    });
    return () => sub.unsubscribe();
  }, [form]);

  const watchVertical = form.watch("vertical");
  const watchSubverticalId = form.watch("subverticalProfileId");
  const subverticalProfiles = listSubverticalProfiles(watchVertical);
  const activeSubvertical =
    getSubverticalProfile(watchSubverticalId ?? "") ?? defaultSubverticalProfile(watchVertical);
  const subverticalHint = onboardingHintForSubvertical(activeSubvertical);
  const watchName = form.watch("name");
  const watchJurisdiction = form.watch("jurisdiction");
  const starterOffer = getVerticalStarterPackOffer(watchVertical);
  const verticalHint = getVerticalOnboardingExtras(watchVertical).createBusinessHint;
  const packUi = verticalPackUi(watchVertical);
  const playbook = getVerticalPlaybook(watchVertical);

  useEffect(() => {
    onVerticalPreview?.(watchVertical ?? null);
    setStarterPack(false);
    const def = defaultSubverticalProfile(watchVertical);
    form.setValue("subverticalProfileId", def.id);
    if (!form.formState.dirtyFields.tier) {
      form.setValue(
        "tier",
        resolveOnboardingTierFromSubvertical(def, form.getValues("tier"), false),
      );
    }
  }, [watchVertical, onVerticalPreview, form]);

  useEffect(() => {
    if (!watchSubverticalId) return;
    const profile =
      getSubverticalProfile(watchSubverticalId) ?? defaultSubverticalProfile(watchVertical);
    if (!form.formState.dirtyFields.tier) {
      form.setValue(
        "tier",
        resolveOnboardingTierFromSubvertical(profile, form.getValues("tier"), false),
      );
    }
  }, [watchSubverticalId, watchVertical, form]);

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
          subverticalProfileId: form.getValues("subverticalProfileId"),
        }),
      })
        .then(setPreview)
        .catch(() => setPreview(null));
    }, 400);
    return () => window.clearTimeout(t);
  }, [watchName, watchVertical, watchJurisdiction, watchSubverticalId, form]);

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
    const subvertical =
      getSubverticalProfile(values.subverticalProfileId ?? "") ??
      defaultSubverticalProfile(values.vertical);
    setSaving(true);
    apiFetch<{ id: string; slug: string }>("/businesses", {
      method: "POST",
      body: JSON.stringify({
        name: values.name,
        slug: values.slug,
        timezone: values.timezone,
        jurisdiction: values.jurisdiction,
        vertical: values.vertical,
        category: subvertical.starterPackCategory ?? subvertical.label,
        subverticalProfileId: subvertical.id,
        tier: values.tier,
        seedDefaults: false,
        starterPack: migrationIntent === "switching" ? false : starterPack ? true : undefined,
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
          description: starterPack
            ? `${starterOffer.label} applied — finish setup steps next.`
            : "Empty studio created — add your menu when you're ready.",
        });
        clearOnboardingFormDraft(CREATE_BUSINESS_DRAFT_KEY);
        onCreated(biz.id, biz.slug, { migrationIntent });
      })
      .catch((err: unknown) => {
        toast({
          title: "Could not create business",
          description: parseUserFacingError(err, "Could not create your business"),
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
        {!hideMigrationIntentPicker ? (
          <div className="space-y-2" data-testid="migration-intent-picker">
            <p className="text-sm font-medium">How are you starting?</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {MIGRATION_INTENT_OPTIONS.map((opt) => {
                const active = migrationIntent === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    data-testid={`migration-intent-${opt.id}`}
                    onClick={() => {
                      setMigrationIntent(opt.id);
                      if (opt.id === "switching") setStarterPack(false);
                      if (opt.id === "fresh" && shouldSeedStarterPackOnCreate("fresh")) setStarterPack(true);
                    }}
                    className={`rounded-lg border px-3 py-2.5 text-left transition-colors ${
                      active
                        ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                        : "border-border/80 hover:border-border"
                    }`}
                  >
                    <p className="text-sm font-medium">{opt.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{opt.subtitle}</p>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
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
                  {publicBookingSlugPrefix() ? (
                    <span className="text-muted-foreground bg-muted px-3 py-2 text-sm border border-r-0 border-input rounded-l-md whitespace-nowrap">
                      {publicBookingSlugPrefix()}
                    </span>
                  ) : null}
                  <Input
                    className={publicBookingSlugPrefix() ? "rounded-none" : "rounded-l-md"}
                    placeholder="acme-studio"
                    {...field}
                  />
                  {publicBookingSlugSuffix() ? (
                    <span className="text-muted-foreground bg-muted px-3 py-2 text-sm border border-l-0 border-input rounded-r-md whitespace-nowrap">
                      {publicBookingSlugSuffix()}
                    </span>
                  ) : null}
                </div>
              </FormControl>
              <FormDescription>
                Your branded book page — guests manage visits in My Livia at /my.
              </FormDescription>
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
        {subverticalProfiles.length > 1 ? (
          <FormField
            control={form.control}
            name="subverticalProfileId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>What kind of studio?</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="onboarding-subvertical">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {subverticalProfiles.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.label} — {p.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  {subverticalHint ??
                    "Tailors your starter menu and guest relationship on My Livia."}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : null}
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
        <p className="text-xs text-muted-foreground leading-relaxed rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
          {SHARED_PREMISES_ONBOARDING_NOTE}
        </p>
        <FormField
          control={form.control}
          name="tier"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Team size</FormLabel>
              <Select
                onValueChange={(v) => {
                  field.onChange(v);
                }}
                value={field.value}
              >
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
        {migrationIntent === "fresh" ? (
        <>
        <label className="flex items-start gap-3 cursor-pointer rounded-lg border border-primary/25 bg-primary/5 p-3">
          <Checkbox
            checked={starterPack}
            onCheckedChange={(v) => setStarterPack(v === true)}
            data-testid="vertical-starter-pack-opt-in"
          />
          <span className="text-sm leading-relaxed">
            <span className="font-medium text-foreground">{starterOffer.label}</span>
            <span className="block text-xs text-muted-foreground mt-1">
              {starterOffer.description}
            </span>
          </span>
        </label>
        {preview && (preview.services.length > 0 || starterPack) ? (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2">
            <p className="text-sm font-medium">{packUi.label}</p>
            <p className="text-xs text-muted-foreground">{playbook.wedge}</p>
            <p className="text-xs text-muted-foreground">
              {starterPack && preview.starterPackServices?.length
                ? `Template ${packUi.serviceNoun.toLowerCase()}s: ${preview.starterPackServices
                    .slice(0, 4)
                    .map((s) => s.name)
                    .join(" · ")}…`
                : `Add your own ${packUi.serviceNoun.toLowerCase()}s on the next step.`}
            </p>
            {starterPack && verticalStarterPackIncludesRetail(watchVertical) ? (
              <p className="text-xs text-muted-foreground">
                {retailStarterPackFootnote(watchVertical) ?? starterOffer.extraLine}
              </p>
            ) : null}
            <p className="text-xs italic text-muted-foreground/90 line-clamp-2">
              Liv: {preview.aiGreeting}
            </p>
          </div>
        ) : null}
        </>
        ) : (
          <p className="text-xs text-muted-foreground rounded-lg border border-dashed border-border/70 bg-muted/20 p-3">
            After your profile, you will upload exports or a spreadsheet. Liv maps them into your
            menu and client list.
          </p>
        )}
        {onboardingCommerceBlocksForVertical(watchVertical).length > 0 ? (
          <div className="rounded-lg border border-border/80 bg-muted/30 p-4 space-y-3" data-testid="onboarding-commerce-blocks">
            <p className="text-sm font-medium">Included in base · optional add-ons</p>
            <p className="text-xs text-muted-foreground">
              Core booking, team, and guest book are in your plan. These depth packs unlock after setup:
            </p>
            <ul className="space-y-2">
              {onboardingCommerceBlocksForVertical(watchVertical).map((block) => (
                <li key={block.addonId} className="text-xs rounded-md border border-border/60 bg-background px-3 py-2">
                  <span className="font-medium text-foreground">{block.label}</span>
                  <span className="text-muted-foreground"> · {block.priceLabel}</span>
                  <p className="text-muted-foreground mt-0.5">{block.description}</p>
                </li>
              ))}
            </ul>
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
          ) : migrationIntent === "switching" ? (
            "Continue to import"
          ) : (
            "Create shop"
          )}
        </Button>
      </form>
    </Form>
  );
}
