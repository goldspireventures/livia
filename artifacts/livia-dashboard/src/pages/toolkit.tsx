import { useBusiness } from "@/lib/business-context";
import { useMembership } from "@/lib/membership-context";
import { usePersona } from "@/lib/persona";
import { LivCommandHub } from "@/components/liv/liv-command-hub";
import { LivTrustEmbeddedPanel } from "@/components/liv/liv-trust-embedded-panel";
import { PayrollExportCard } from "@/components/payroll-export-card";
import { EnterpriseExportCard } from "@/components/enterprise-export-card";
import { PersonaRitualHeader } from "@/components/ritual/persona-ritual-header";
import { PageFrame } from "@/components/ui/page-frame";
import { SettingsDisclosure } from "@/components/ui/settings-disclosure";
import {
  showEnterpriseToolkitExports,
  showPayrollToolkitExport,
} from "@workspace/policy";

/** Org-admin/owner Liv command centre — deferred exports and settings links. */
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
    <PageFrame width="md" className="space-y-4" data-testid="toolkit-page">
      <PersonaRitualHeader
        variant="page"
        title="Liv command"
        subtitle="Mandate, policies, and channel wiring — everyday work stays on Today and Inbox."
      />

      <LivCommandHub density="focused" />

      {showPayroll || showEnterprise ? (
        <SettingsDisclosure
          title="Exports"
          description="Payroll and enterprise reports when your plan includes them."
          defaultOpen={false}
        >
          <div className="space-y-3 pt-1">
            {showPayroll ? <PayrollExportCard /> : null}
            {showEnterprise ? <EnterpriseExportCard /> : null}
          </div>
        </SettingsDisclosure>
      ) : null}

      <LivTrustEmbeddedPanel />
    </PageFrame>
  );
}
