import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateMarketingLead } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";

const formSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export function MarketingForm() {
  const [submitted, setSubmitted] = useState(false);
  const createLead = useCreateMarketingLead();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "" },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    createLead.mutate(
      { data: { email: values.email, source: "livia.io" } },
      {
        onSuccess: () => {
          setSubmitted(true);
        },
        onError: () => {
          form.setError("email", { message: "Something went wrong. Please try again." });
        },
      }
    );
  }

  if (submitted) {
    return (
      <div className="py-4 text-aurora-cyan font-medium flex items-center justify-center gap-2">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5">
          <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        You're in. We'll be in touch.
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col sm:flex-row gap-2 max-w-md w-full mx-auto">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormControl>
                <Input
                  placeholder="name@studio.com"
                  className="h-12 bg-background/50 border-white/10 text-white placeholder:text-muted-foreground focus-visible:ring-aurora-cyan"
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-destructive font-medium text-xs mt-1 absolute" />
            </FormItem>
          )}
        />
        <Button 
          type="submit" 
          className="h-12 px-8 bg-aurora-cyan hover:bg-aurora-cyan/90 text-black font-medium transition-colors"
          disabled={createLead.isPending}
        >
          {createLead.isPending ? "Joining..." : "Join closed beta"}
        </Button>
      </form>
    </Form>
  );
}
