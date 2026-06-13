import { Link } from "wouter";
import { BookOpen, Building2, Globe, Inbox, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageFrame } from "@/components/ui/page-frame";
import { useBusiness } from "@/lib/business-context";

const TRACKS = [
  {
    id: "guest",
    title: "Your guest booking page",
    icon: Globe,
    summary: "What customers see without signing in.",
    steps: [
      "Share your /b link from Settings → Studio.",
      "Guests pick a service, time, and contact details.",
      "Liv answers guest questions on your booking page when enabled.",
      "Booking terms and privacy copy come from Settings → Legal & trust.",
    ],
    cta: { href: "/settings?tab=shop", label: "Copy booking link" },
  },
  {
    id: "floor",
    title: "Running the floor",
    icon: Building2,
    summary: "Day-to-day work for owners and staff.",
    steps: [
      "Today — pending bookings and what needs attention.",
      "Inbox — reply to guests; Ask Liv drafts from your policies.",
      "Bookings — calendar, status, and running late.",
      "Customers — history, Liv memory, and relationship context.",
    ],
    cta: { href: "/dashboard", label: "Open Today" },
  },
  {
    id: "liv",
    title: "Tuning Liv",
    icon: Sparkles,
    summary: "Keep replies accurate and on-brand.",
    steps: [
      "Legal & trust — booking terms, privacy, house rules (Liv reads these).",
      "Settings → Liv — tone and guest-facing chat greeting.",
      "Liv hub — mandate, channels, and day-to-day operating rules.",
      "Refresh morning briefing after big policy changes.",
    ],
    cta: { href: "/settings?tab=legal", label: "Review policies" },
  },
  {
    id: "inbox",
    title: "Inbox & handoffs",
    icon: Inbox,
    summary: "When a thread needs a human.",
    steps: [
      "Open a conversation from Inbox or a booking.",
      "Use Ask Liv on the right to draft — always review before sending.",
      "Hand off when refunds, complaints, or edge cases need you.",
      "Liv memory updates from resolved threads.",
    ],
    cta: { href: "/inbox", label: "Open inbox" },
  },
] as const;

export default function GuidesPage() {
  const { business } = useBusiness();
  const slug = business?.slug;

  return (
    <PageFrame width="md" className="pb-12">
      <div className="mb-8">
        <p className="text-xs font-mono uppercase tracking-wider text-primary mb-2 flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          Help
        </p>
        <h1 className="font-serif text-2xl tracking-tight">Getting the most from Livia</h1>
        <p className="text-muted-foreground text-sm mt-2 max-w-lg">
          Quick paths for your team — no engineering jargon. Need support? Use the help button in
          the top bar.
        </p>
      </div>

      <div className="space-y-4">
        {TRACKS.map((t) => {
          const Icon = t.icon;
          return (
            <Card key={t.id}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Icon className="h-4 w-4 text-primary" />
                  {t.title}
                </CardTitle>
                <CardDescription>{t.summary}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  {t.steps.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
                <Link href={t.cta.href}>
                  <Button variant="outline" size="sm">
                    {t.cta.label}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {slug ? (
        <Card className="mt-6 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Preview your storefront</CardTitle>
            <CardDescription>Preview the guest booking experience.</CardDescription>
          </CardHeader>
          <CardContent>
            <a href={`/book/${slug}`} target="_blank" rel="noopener noreferrer">
              <Button size="sm">Open book page</Button>
            </a>
          </CardContent>
        </Card>
      ) : null}
    </PageFrame>
  );
}
