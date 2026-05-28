import { Link } from "wouter";
import { useBusiness } from "@/lib/business-context";
import { useMembership } from "@/lib/membership-context";
import { usePersona } from "@/lib/persona";
import { LivCommandHub } from "@/components/liv/liv-command-hub";
import { PayrollExportCard } from "@/components/payroll-export-card";
import { EnterpriseExportCard } from "@/components/enterprise-export-card";
import { PersonaRitualHeader } from "@/components/ritual/persona-ritual-header";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import {
  showEnterpriseToolkitExports,
  showPayrollToolkitExport,
} from "@workspace/policy";

const LIV_LINKS = [
  { href: "/settings?tab=liv", label: "Liv voice & prompts", blurb: "Tone, greeting, knowledge, prompt versions." },
  { href: "/settings?tab=policy", label: "Booking policy", blurb: "Deposits, no-shows, trusted clients — what Liv enforces." },
  { href: "/settings?tab=comms", label: "Channels", blurb: "SMS, email, and what's live vs roadmap." },
] as const;

/** Org-admin/owner Liv command centre — not a second app map (no Operations grid). */
export default function ToolkitPage() {
  const { business } = useBusiness();
  const { effectiveRole } = useMembership();
  const { kind: persona } = usePersona();
  const showExports = persona === "org_admin" || effectiveRole === "OWNER";
  const vertical = (business as { vertical?: string } | null)?.vertical;
  const tier = (business as { tier?: string } | null)?.tier;
  const showPayroll = showExports && showPayrollToolkitExport(vertical, tier);
  const showEnterprise = showExports && showEnterpriseToolkitExports(vertical, tier);

  return (
    <div className="space-y-6 max-w-4xl">
      <PersonaRitualHeader
        variant="page"
        title="Liv command"
        subtitle="Briefing, tuning, and exports — your operating brain. Day-to-day work stays on Today, Queue, and the floor."
      />

      <LivCommandHub />

      {showPayroll ? <PayrollExportCard /> : null}
      {showEnterprise ? <EnterpriseExportCard /> : null}

      <section>
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5" />
          Liv & trust
        </h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {LIV_LINKS.map((t) => (
            <Link key={t.href} href={t.href}>
              <Card className="h-full hover:border-primary/40 transition-colors">
                <CardContent className="p-4">
                  <p className="font-medium text-sm">{t.label}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{t.blurb}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {business?.slug ? (
        <p className="text-xs text-muted-foreground">
          Customer-facing Liv:{" "}
          <a className="text-primary hover:underline" href={`/b/${business.slug}`} target="_blank" rel="noreferrer">
            /b/{business.slug}
          </a>
        </p>
      ) : null}
    </div>
  );
}

