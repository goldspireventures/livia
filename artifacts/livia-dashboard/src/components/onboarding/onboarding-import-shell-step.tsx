import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api-fetch";
import { parseUserFacingError } from "@/lib/user-facing-errors";
import {
  clearOnboardingFormDraft,
  readOnboardingFormDraft,
  writeOnboardingFormDraft,
} from "@/lib/onboarding-form-draft";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { defaultSubverticalProfile, businessVerticalSchema } from "@workspace/policy";

const DRAFT_KEY = "import-shell";

const formSchema = z.object({
  name: z.string().min(2, "Enter your shop name"),
  vertical: z.string().min(1, "Choose your trade"),
  jurisdiction: z.enum(["IE", "GB", "DE", "ES", "IT", "NL", "PL", "SE", "DK", "NO", "FI"]),
});

type FormValues = z.infer<typeof formSchema>;

type Catalog = {
  jurisdictions: { jurisdiction: string; label: string; defaultTimezone: string }[];
  verticals: { vertical: string; label: string }[];
};

type Props = {
  businessId?: string | null;
  onCreated: (businessId: string, slug: string) => void;
  onSaved?: () => void;
  onVerticalPreview?: (vertical: string | null) => void;
};

function slugFromName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function OnboardingImportShellStep({
  businessId,
  onCreated,
  onSaved,
  onVerticalPreview,
}: Props) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [loadingBusiness, setLoadingBusiness] = useState(!!businessId);
  const editMode = !!businessId;

  const draft = readOnboardingFormDraft<FormValues>(DRAFT_KEY);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema as never),
    defaultValues: {
      name: draft?.name ?? "",
      vertical: draft?.vertical ?? "hair",
      jurisdiction: (draft?.jurisdiction as FormValues["jurisdiction"]) ?? "IE",
    },
  });

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
        });
      });
  }, []);

  useEffect(() => {
    if (!businessId) {
      setLoadingBusiness(false);
      return;
    }
    setLoadingBusiness(true);
    apiFetch<{ name?: string; vertical?: string; jurisdiction?: string }>(`/businesses/${businessId}`)
      .then((biz) => {
        const next: FormValues = {
          name: draft?.name ?? biz.name ?? "",
          vertical: draft?.vertical ?? biz.vertical ?? "hair",
          jurisdiction:
            (draft?.jurisdiction as FormValues["jurisdiction"]) ??
            (biz.jurisdiction as FormValues["jurisdiction"]) ??
            "IE",
        };
        form.reset(next);
      })
      .catch(() => undefined)
      .finally(() => setLoadingBusiness(false));
  }, [businessId, form]);

  const watchVertical = form.watch("vertical");
  useEffect(() => {
    onVerticalPreview?.(watchVertical ?? null);
  }, [watchVertical, onVerticalPreview]);

  useEffect(() => {
    const sub = form.watch((values) => {
      writeOnboardingFormDraft(DRAFT_KEY, values as Record<string, unknown>);
    });
    return () => sub.unsubscribe();
  }, [form]);

  const onSubmit = (values: FormValues) => {
    const slug = slugFromName(values.name);
    if (slug.length < 2) {
      toast({
        title: "Name too short",
        description: "Use at least two letters in your shop name.",
        variant: "destructive",
      });
      return;
    }
    const jurisdiction = catalog?.jurisdictions.find((j) => j.jurisdiction === values.jurisdiction);
    const verticalParsed = businessVerticalSchema.safeParse(values.vertical);
    if (!verticalParsed.success) {
      toast({
        title: "Choose a trade",
        description: "Select your business type from the list.",
        variant: "destructive",
      });
      return;
    }
    const subvertical = defaultSubverticalProfile(verticalParsed.data);
    setSaving(true);

    if (editMode && businessId) {
      apiFetch(`/businesses/${businessId}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: values.name,
          timezone: jurisdiction?.defaultTimezone ?? "Europe/Dublin",
          jurisdiction: values.jurisdiction,
          vertical: verticalParsed.data,
          category: subvertical.starterPackCategory ?? subvertical.label,
          subverticalProfileId: subvertical.id,
        }),
      })
        .then((biz) => {
          clearOnboardingFormDraft(DRAFT_KEY);
          toast({ title: "Saved", description: "Shop basics updated." });
          onSaved?.();
          return biz;
        })
        .catch((err: unknown) => {
          toast({
            title: "Could not save",
            description: parseUserFacingError(err, "Try again in a moment."),
            variant: "destructive",
          });
        })
        .finally(() => setSaving(false));
      return;
    }

    apiFetch<{ id: string; slug: string }>("/businesses", {
      method: "POST",
      body: JSON.stringify({
        name: values.name,
        slug,
        timezone: jurisdiction?.defaultTimezone ?? "Europe/Dublin",
        jurisdiction: values.jurisdiction,
        vertical: verticalParsed.data,
        category: subvertical.starterPackCategory ?? subvertical.label,
        subverticalProfileId: subvertical.id,
        tier: "solo",
        seedDefaults: false,
        starterPack: false,
        tenantAttestation: {
          entityKind: "sole_trader",
          tradingName: values.name,
          attestedAt: new Date().toISOString(),
        },
      }),
    })
      .then((biz) => {
        clearOnboardingFormDraft(DRAFT_KEY);
        onCreated(biz.id, biz.slug);
      })
      .catch((err: unknown) => {
        toast({
          title: "Could not create shop",
          description: parseUserFacingError(err, "Could not create your studio"),
          variant: "destructive",
        });
      })
      .finally(() => setSaving(false));
  };

  const jurisdictions = catalog?.jurisdictions ?? [];
  const verticals = catalog?.verticals ?? [];

  if (loadingBusiness) {
    return (
      <div className="flex justify-center py-8" data-testid="onboarding-import-shell-loading">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-testid="onboarding-import-shell">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Shop name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Aurora Studio" autoFocus {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="vertical"
          render={({ field }) => (
            <FormItem>
              <FormLabel>What you do</FormLabel>
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
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="jurisdiction"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Country</FormLabel>
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
        <p className="text-xs text-muted-foreground">
          Phone, address, menu, and clients come from your import on the next step.
        </p>
        <Button type="submit" className="w-full" disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              One moment…
            </>
          ) : editMode ? (
            "Save and return to import"
          ) : (
            "Continue to import"
          )}
        </Button>
      </form>
    </Form>
  );
}
