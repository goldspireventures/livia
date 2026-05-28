import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateMarketingLead } from "@workspace/api-client-react";
import { trackEvent } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { editorialCopy, type MarketingLocale } from "@/lib/marketing-editorial-i18n";

function formSchema(locale: MarketingLocale) {
  const invalid =
    locale === "de" ? "Bitte eine gültige E-Mail-Adresse eingeben." : "Please enter a valid email address.";
  return z.object({
    email: z.string().email(invalid),
  });
}

export function MarketingForm({ locale = "en" }: { locale?: MarketingLocale }) {
  const [submitted, setSubmitted] = useState(false);
  const createLead = useCreateMarketingLead();
  const t = editorialCopy(locale).form;
  const schema = formSchema(locale);

  type FormValues = z.infer<typeof schema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema as never),
    defaultValues: { email: "" },
  });

  function onSubmit(values: FormValues) {
    const source = locale === "de" ? "livia.io/de" : "livia.io";
    createLead.mutate(
      { data: { email: values.email, source } },
      {
        onSuccess: () => {
          trackEvent("lead_submit", { source });
          setSubmitted(true);
        },
        onError: () => {
          form.setError("email", { message: t.error });
        },
      },
    );
  }

  if (submitted) {
    return (
      <div className="py-4 text-aurora-cyan font-medium flex items-center gap-2 min-h-[44px]">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0">
          <path
            d="M20 6L9 17L4 12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {t.success}
      </div>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col sm:flex-row gap-3 max-w-md w-full"
      >
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
                  placeholder={t.placeholder}
                  className="h-12 min-h-[44px] bg-background/50 border-white/10 text-white placeholder:text-muted-foreground focus-visible:ring-aurora-cyan"
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
        >
          {createLead.isPending ? (locale === "de" ? "Wird gesendet…" : "Joining…") : t.submit}
        </Button>
      </form>
    </Form>
  );
}
