import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateBusiness } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, Sparkles } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, "Business name must be at least 2 characters"),
  slug: z.string().min(2, "Slug must be at least 2 characters").regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  category: z.string().min(1, "Please select a category"),
  timezone: z.string().min(1, "Please select a timezone"),
});

type FormValues = z.infer<typeof formSchema>;

export default function OnboardingPage() {
  const { toast } = useToast();
  const createBusiness = useCreateBusiness();
  const [seedLoading, setSeedLoading] = useState(false);

  const form = useForm<FormValues>({
    // zod v4 types can mismatch resolver's bundled zod typings; runtime validation is fine.
    resolver: zodResolver(formSchema as unknown as Parameters<typeof zodResolver>[0]),
    defaultValues: {
      name: "",
      slug: "",
      category: "",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  });

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  };

  const watchName = form.watch("name");
  const isSlugTouched = form.formState.dirtyFields.slug;

  if (watchName && !isSlugTouched && form.getValues("slug") !== generateSlug(watchName)) {
    form.setValue("slug", generateSlug(watchName));
  }

  const onSubmit = (values: FormValues) => {
    createBusiness.mutate(
      { data: values },
      {
        onSuccess: () => {
          toast({
            title: "Business created",
            description: "Welcome to Livia!",
          });
          window.location.href = "/dashboard";
        },
        onError: (error) => {
          toast({
            title: "Failed to create business",
            description: (error as any).error || "An unexpected error occurred",
            variant: "destructive",
          });
        },
      }
    );
  };

  const loadDemoData = async () => {
    setSeedLoading(true);
    try {
      const res = await fetch("/api/dev/seed", { method: "POST" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Seed failed");
      toast({
        title: "Demo workspace ready!",
        description: `${body.business?.name ?? "Luxe Salon & Spa"} — 3 staff, 5 services, 8 clients, 15 bookings loaded.`,
      });
      window.location.href = "/dashboard";
    } catch (err: any) {
      toast({
        title: "Could not load demo data",
        description: err.message,
        variant: "destructive",
      });
      setSeedLoading(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] w-full items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Set up your business</CardTitle>
          <CardDescription>
            Let's get your command center ready. You can change these details later.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* ── Demo shortcut ─────────────────────────────────────────── */}
          <div className="rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30 p-4 space-y-2">
            <p className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-violet-400" />
              Just exploring? Load a demo workspace instantly.
            </p>
            <p className="text-xs text-muted-foreground">
              Creates <strong>3 businesses</strong> across different industries — a hair salon, a tattoo studio, and a personal training gym — each with real staff, services, clients, and bookings so you can explore every feature.
            </p>
            <Button
              type="button"
              variant="secondary"
              className="w-full mt-1"
              onClick={loadDemoData}
              disabled={seedLoading || createBusiness.isPending}
            >
              {seedLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading demo data…
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Load demo workspace
                </>
              )}
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">or set up your own</span>
            <Separator className="flex-1" />
          </div>

          {/* ── Manual setup form ─────────────────────────────────────── */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Name</FormLabel>
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
                          livia.io/b/
                        </span>
                        <Input className="rounded-l-none" placeholder="acme-studio" {...field} />
                      </div>
                    </FormControl>
                    <FormDescription>
                      This is the link you'll share with clients.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="barbershop">Barbershop</SelectItem>
                        <SelectItem value="salon">Hair Salon</SelectItem>
                        <SelectItem value="tattoo">Tattoo Studio</SelectItem>
                        <SelectItem value="massage">Massage Therapy</SelectItem>
                        <SelectItem value="fitness">Personal Training</SelectItem>
                        <SelectItem value="medical">Medical Spa</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="timezone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Timezone</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a timezone" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="America/New_York">Eastern Time (US &amp; Canada)</SelectItem>
                        <SelectItem value="America/Chicago">Central Time (US &amp; Canada)</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time (US &amp; Canada)</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time (US &amp; Canada)</SelectItem>
                        <SelectItem value="Europe/London">London</SelectItem>
                        <SelectItem value="Europe/Paris">Paris</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={createBusiness.isPending || seedLoading}>
                {createBusiness.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating…
                  </>
                ) : (
                  "Create Business"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
