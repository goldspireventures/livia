import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateMarketingLead } from "@workspace/api-client-react";
import { trackEvent } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { editorialCopy, type MarketingLocale } from "@/lib/marketing-editorial-i18n";
import { MARKETING_VERTICAL_LINKS } from "@/lib/marketing-verticals";
import { persistDemoGateKey } from "@/lib/marketing-demo-gate-client";
import { marketingDemoHandoffUrl } from "@/lib/marketing-demo-handoff";

const COUNTRY_OPTIONS = [
  { value: "IE", label: "Ireland" },
  { value: "GB", label: "United Kingdom" },
  { value: "DE", label: "Germany" },
] as const;

export type MarketingFormIntent = "waitlist" | "demo";

function formSchema(locale: MarketingLocale) {
  const invalid =
    locale === "de" ? "Bitte eine gültige E-Mail-Adresse eingeben." : "Please enter a valid email address.";
  return z.object({
    email: z.string().email(invalid),
    vertical: z.string().optional(),
    country: z.string().optional(),
  });
}

function initialVerticalFromQuery(): string {
  if (typeof window === "undefined") return "";
  const raw = new URLSearchParams(window.location.search).get("vertical")?.trim() ?? "";
  if (!raw) return "";
  const known = MARKETING_VERTICAL_LINKS.some((v) => v.slug === raw);
  return known ? raw : "";
}

export function MarketingForm({
  locale = "en",
  intent = "waitlist",
}: {
  locale?: MarketingLocale;
  intent?: MarketingFormIntent;
}) {
  const [submitted, setSubmitted] = useState(false);
  const createLead = useCreateMarketingLead();
  const t = editorialCopy(locale);
  const schema = formSchema(locale);
  const isDemo = intent === "demo";

  type FormValues = z.infer<typeof schema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema as never),
    defaultValues: { email: "", vertical: "", country: "IE" },
  });

  useEffect(() => {
    const fromQuery = initialVerticalFromQuery();
    if (fromQuery) form.setValue("vertical", fromQuery);
  }, [form]);

  function onSubmit(values: FormValues) {
    const source =
      locale === "de"
        ? isDemo
          ? "livia-hq.com/de/book-demo"
          : "livia-hq.com/de"
        : isDemo
          ? "livia-hq.com/book-demo"
          : "livia-hq.com";
    createLead.mutate(
      {
        data: {
          email: values.email,
          source,
          utmSource: values.vertical?.trim()
            ? isDemo
              ? `demo:${values.vertical}`
              : `vertical:${values.vertical}`
            : isDemo
              ? "demo-request"
              : undefined,
          utmMedium: values.country?.trim() || undefined,
        },
      },
      {
        onSuccess: (data) => {
          trackEvent("lead_submit", {
            source,
            intent,
            ...(values.vertical?.trim() ? { vertical: values.vertical } : {}),
            ...(values.country?.trim() ? { country: values.country } : {}),
          });
          if (isDemo && data.demoAccessToken) {
            persistDemoGateKey(data.demoAccessToken);
            window.location.assign(
              marketingDemoHandoffUrl({
                vertical: values.vertical,
                gateKey: data.demoAccessToken,
              }),
            );
            return;
          }
          setSubmitted(true);
        },
        onError: () => {
          form.setError("email", { message: t.form.error });
        },
      },
    );
  }

  if (submitted) {
    return (
      <div className="py-4 text-[#d9c39a] font-medium flex items-center gap-2 min-h-[44px]">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0">
          <path
            d="M20 6L9 17L4 12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {isDemo ? t.formDemo.success : t.form.success}
      </div>
    );
  }

  const verticalLabel = locale === "de" ? "Branche (optional)" : "Your trade (optional)";
  const countryLabel = locale === "de" ? "Land" : "Country";
  const submitLabel = isDemo ? t.formDemo.submit : t.form.submit;
  const pendingLabel = isDemo ? t.formDemo.pending : locale === "de" ? "Wird gesendet…" : "Joining…";

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-3 max-w-md w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="vertical"
            render={({ field }) => (
              <FormItem>
                <Select value={field.value ?? ""} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="min-h-[44px] bg-background/50 border-white/10" data-testid="waitlist-vertical">
                      <SelectValue placeholder={verticalLabel} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {MARKETING_VERTICAL_LINKS.map((v) => (
                      <SelectItem key={v.slug} value={v.slug}>
                        {v.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <Select value={field.value ?? "IE"} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="min-h-[44px] bg-background/50 border-white/10" data-testid="waitlist-country">
                      <SelectValue placeholder={countryLabel} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {COUNTRY_OPTIONS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Input
                    type="email"
                    aria-label="Email"
                    autoComplete="email"
                    placeholder={t.form.placeholder}
                    className="h-12 min-h-[44px] bg-background/50 border-white/10 text-white placeholder:text-muted-foreground focus-visible:ring-aurora-cyan"
                    data-testid="waitlist-email"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-destructive font-medium text-xs mt-1" />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            className="h-12 min-h-[44px] px-8 bg-aurora-cyan hover:bg-aurora-cyan/90 text-black font-medium shrink-0"
            disabled={createLead.isPending}
            data-testid="waitlist-submit"
          >
            {createLead.isPending ? pendingLabel : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
