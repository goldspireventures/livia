import type { GuestProofThread } from "@/components/body-art/design-proof-version-frame";
import { DesignProofVersionFrame } from "@/components/body-art/design-proof-version-frame";

export type GuestProofArtifact = GuestProofThread;

/** @deprecated Use DesignProofVersionFrame — kept for import compatibility. */
export function GuestDesignProofCard({ proof }: { proof: GuestProofArtifact }) {
  return <DesignProofVersionFrame proof={proof} testIdPrefix="guest-my-proof" />;
}
