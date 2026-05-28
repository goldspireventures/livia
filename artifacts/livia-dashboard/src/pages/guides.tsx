import { Link } from "wouter";
import { BookOpen, Building2, Globe, Shield, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const VERTICAL_BOOKING_LINKS = [
  { href: "/b/paws-parlour-dublin", label: "Pet grooming" },
  { href: "/b/clarity-medspa-dublin", label: "Medspa + consent" },
  { href: "/b/motion-physio-cork", label: "Physio / allied health" },
  { href: "/b/peak-fitness-dublin", label: "Fitness / PT" },
  { href: "/b/luxe-salon-spa", label: "Hair + continuity (E2E seed)" },
] as const;

const TRACKS = [
  {
    id: "public",
    title: "Public & customer",
    icon: Globe,
    summary: "No login. Book, chat with Liv, wallet pass — the outward face of a shop.",
    steps: [
      "Provision demo world at /demo (once).",
      "Open Customer door or /b/aurora-studio in incognito.",
      "Book a slot; optional chat on the public booking page.",
      "Try vertical showcases: pet, medspa consent, physio, fitness (links below).",
      "Confirm email/SMS copy in Settings (as shop owner later).",
    ],
    cta: { href: "/b/aurora-studio", label: "Open Aurora Studio booking" },
  },
  {
    id: "business",
    title: "Business owners & staff",
    icon: Building2,
    summary: "Org admin, owner, manager, staff, front desk — each gets their own Clerk login and landing route.",
    steps: [
      "POST /api/demo/provision (button on /demo).",
      "Pick a door: org admin (3 locations), owner (Conor's Cut), manager (inbox), staff (My Day), reception (bookings).",
      "Use business switcher (org admin) and View as (owner/manager).",
      "Team: Staff → Invite (not hiring). Leave: staff requests, manager approves on Rota.",
      "Running late: Today or booking detail. Liv tuning: Liv command (not Operations grid).",
      "Business ready pack: docs/business/OPERATOR-READY-PACK.md in repo.",
      "Mobile: same businesses via sign-in; parity in docs/product/WEB-MOBILE-PARITY.md.",
    ],
    cta: { href: "/demo", label: "Demo gateway (live sign-in)" },
  },
  {
    id: "internal",
    title: "Livia Inc · internal ops",
    icon: Shield,
    summary: "Tenant directory and health cards — never tenant JWTs. Service token only.",
    steps: [
      "pnpm dev:internal → http://localhost:5175",
      "Paste INTERNAL_OPS_SECRET from root .env.",
      "Search tenants; open health card + deep links (Stripe, Clerk, public booking).",
      "Impersonation policy: owners use ?as=staff — audited; ops do not borrow tenant sessions.",
    ],
    cta: { href: "http://localhost:5175", label: "Open internal console", external: true },
  },
] as const;

export default function GuidesPage() {
  return (
    <div className="min-h-[100dvh] bg-background">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="flex items-center gap-2 text-primary mb-4">
          <BookOpen className="h-5 w-5" />
          <span className="text-xs font-mono uppercase tracking-wider">E2E playbook</span>
        </div>
        <h1 className="font-serif text-4xl tracking-tight mb-3">Navigate all of Livia</h1>
        <p className="text-muted-foreground leading-relaxed mb-10">
          Three onboarding tracks — public customer, tenant users, and Livia internal staff. Full
          copy-paste commands live in{" "}
          <code className="text-sm">docs/testing/FULL-LIVIA-EXPERIENCE.md</code> in the repo.
        </p>

        <div className="space-y-6">
          {TRACKS.map((t) => {
            const Icon = t.icon;
            return (
              <Card key={t.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Icon className="h-5 w-5 text-primary" />
                    {t.title}
                  </CardTitle>
                  <CardDescription>{t.summary}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1.5">
                    {t.steps.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ol>
                  {"external" in t.cta && t.cta.external ? (
                    <a href={t.cta.href} target="_blank" rel="noreferrer">
                      <Button variant="outline" size="sm" className="gap-2">
                        {t.cta.label}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </a>
                  ) : (
                    <Link href={t.cta.href}>
                      <Button variant="outline" size="sm" className="gap-2">
                        {t.cta.label}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  )}
                  {t.id === "public" ? (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {VERTICAL_BOOKING_LINKS.map((v) => (
                        <Link key={v.href} href={v.href}>
                          <Button variant="secondary" size="sm">
                            {v.label}
                          </Button>
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="mt-10 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg">Operator ready pack</CardTitle>
            <CardDescription>
              Starter policies, leave procedure, running late, team invite, and AI disclosure — adapt with
              your solicitor, then mirror in Settings → Policy and Liv.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Link href="/settings">
              <Button variant="default" size="sm">
                Open Settings (legal tab)
              </Button>
            </Link>
            <p className="text-xs text-muted-foreground w-full">
              Full pack: <code className="text-[11px]">docs/business/OPERATOR-READY-PACK.md</code> and{" "}
              <code className="text-[11px]">docs/business/templates/</code>
            </p>
          </CardContent>
        </Card>

        <div className="mt-12 flex flex-wrap gap-3">
          <Link href="/demo">
            <Button>Live demo gateway</Button>
          </Link>
          <Link href="/lifecycle">
            <Button variant="outline">Lifecycle map</Button>
          </Link>
          <Link href="/portal">
            <Button variant="outline">Portal hub</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
