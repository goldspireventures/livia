import { useEffect } from "react";
import { useBusiness } from "@/lib/business-context";
import { useMembership } from "@/lib/membership-context";
import { usePersona } from "@/lib/persona";
import { LivCommandHub } from "@/components/liv/liv-command-hub";
import { EventVendorLivCommandPanel } from "@/components/event-vendor/event-vendor-liv-command";
import { LivTrustEmbeddedPanel } from "@/components/liv/liv-trust-embedded-panel";
import { LivProposalsPanel } from "@/components/liv-proposals-panel";
import { scrollToToolkitAnchor } from "@/lib/toolkit-navigation";
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
  const isEventVendor = vertical === "event-vendors";
  const tier = (business as { tier?: string } | null)?.tier;
  const showPayroll = showExports && showPayrollToolkitExport(vertical, tier);
  const showEnterprise = showExports && showEnterpriseToolkitExports(vertical, tier);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    if (!hash) return;
    const t = window.setTimeout(() => scrollToToolkitAnchor(`${window.location.pathname}${hash}`), 120);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <PageFrame width="md" className="space-y-4" data-testid="toolkit-page">
      <PersonaRitualHeader
        variant="page"
        title="Liv command"
        subtitle={
          isEventVendor
            ? "Quote drafts, follow-ups, and Liv voice — enquiries and quotes live under Business."
            : "Mandate, policies, and channel wiring — everyday work stays on Today and Inbox."
        }
      />

      {isEventVendor ? (
        <EventVendorLivCommandPanel />
      ) : (
        <LivCommandHub density="focused" />
      )}

      {!isEventVendor ? (
      <div id="liv-approvals" className="scroll-mt-20">
        <LivProposalsPanel variant="home" />
      </div>
      ) : null}

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

      <LivTrustEmbeddedPanel vertical={vertical} />
    </PageFrame>
  );
}
