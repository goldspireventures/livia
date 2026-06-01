import { useBusiness } from "@/lib/business-context";
import { useMembership } from "@/lib/membership-context";
import { usePersona } from "@/lib/persona";
import { canEditLiv, canViewComms } from "@/lib/settings-persona";
import { SettingsDisclosure } from "@/components/ui/settings-disclosure";
import LivPromptControls from "@/components/liv-prompt-controls";
import OperationalPolicyControls from "@/components/operational-policy-controls";
import CommunicationsControls from "@/components/communications-controls";

/** Liv & trust controls embedded in Liv command — expand in place instead of tab hopping. */
export function LivTrustEmbeddedPanel() {
  const { business } = useBusiness();
  const { kind: persona } = usePersona();
  const livEditable = canEditLiv(persona);
  const showComms = canViewComms(persona);
  const bid = business?.id ?? "";

  if (!bid) return null;

  return (
    <div className="space-y-3" data-testid="liv-trust-embedded">
      <SettingsDisclosure
        title="Liv voice & prompts"
        description="Greeting, tone, and what Liv knows about your shop."
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

      <SettingsDisclosure
        title="Booking policy"
        description="Deposits, buffers, and when Liv can confirm automatically."
        defaultOpen={false}
      >
        <div className="pt-2">
          <OperationalPolicyControls />
        </div>
      </SettingsDisclosure>

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
