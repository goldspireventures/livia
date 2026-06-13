import { useBusiness } from "@/lib/business-context";
import { useMembership } from "@/lib/membership-context";
import { usePersona } from "@/lib/persona";
import { canEditLiv, canViewComms } from "@/lib/settings-persona";
import { SettingsDisclosure } from "@/components/ui/settings-disclosure";
import LivPromptControls from "@/components/liv-prompt-controls";
import LivMandateControls from "@/components/liv-mandate-controls";
import OperationalPolicyControls from "@/components/operational-policy-controls";
import CommunicationsControls from "@/components/communications-controls";

/** Liv & trust controls embedded in Liv command — expand in place instead of tab hopping. */
export function LivTrustEmbeddedPanel({ vertical }: { vertical?: string | null }) {
  const { business } = useBusiness();
  const { kind: persona } = usePersona();
  const livEditable = canEditLiv(persona);
  const showComms = canViewComms(persona);
  const bid = business?.id ?? "";
  const isEventVendor = vertical === "event-vendors";

  if (!bid) return null;

  return (
    <div className="space-y-3" data-testid="liv-trust-embedded">
      <div id="liv-mandate" className="scroll-mt-20">
        <SettingsDisclosure
          title="Trust & autonomy"
          description="Mandate rung, refund cap, and blocked actions."
          defaultOpen={false}
        >
          <div className="pt-2">
            <LivMandateControls />
          </div>
        </SettingsDisclosure>
      </div>

      <SettingsDisclosure
        title="Liv voice & prompts"
        description={
          isEventVendor
            ? "Greeting and tone on your public website and enquire flow."
            : "Greeting, tone, and what Liv knows about your shop."
        }
        defaultOpen={false}
      >
        <div className="pt-2">
          {!livEditable ? (
            <p className="text-sm text-muted-foreground mb-3">
              View-only — owners and managers can edit in Settings → Liv AI.
            </p>
          ) : null}
          <LivPromptControls />
        </div>
      </SettingsDisclosure>

      {!isEventVendor ? (
      <SettingsDisclosure
        title="Booking policy"
        description="Deposits, buffers, and when Liv can confirm automatically."
        defaultOpen={false}
      >
        <div className="pt-2">
          <OperationalPolicyControls />
        </div>
      </SettingsDisclosure>
      ) : (
      <SettingsDisclosure
        title="Quote & deposit terms"
        description="Default deposit % and terms — used on quotes and your public site."
        defaultOpen={false}
      >
        <p className="text-sm text-muted-foreground pt-2">
          Edit deposit rules, quote validity, and terms on{" "}
          <a href="/event-site" className="text-primary underline underline-offset-2">
            Website
          </a>
          .
        </p>
      </SettingsDisclosure>
      )}

      {showComms ? (
        <SettingsDisclosure
          title="Channels"
          description="SMS, email, and messaging connections."
          defaultOpen={false}
        >
          <div className="pt-2">
            <CommunicationsControls businessId={bid} />
          </div>
        </SettingsDisclosure>
      ) : null}
    </div>
  );
}
