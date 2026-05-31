/** Exec company hats — cockpit Hats River (Track H). */
export const EXEC_HAT_IDS = ["ceo", "coo", "cpo", "cto", "cs", "cro"] as const;

export type ExecHatId = (typeof EXEC_HAT_IDS)[number];

export type ExecHatDef = {
  id: ExecHatId;
  role: string;
  mandate: string;
};

export const EXEC_HAT_CATALOG: ExecHatDef[] = [
  { id: "ceo", role: "CEO", mandate: "Wedge proof, narrative, Gate 2" },
  { id: "coo", role: "COO", mandate: "Ops, support SLAs, ship discipline" },
  { id: "cpo", role: "CPO", mandate: "Product truth, onboarding, flags" },
  { id: "cto", role: "CTO", mandate: "Reliability, deploys, integrations" },
  { id: "cs", role: "Customer success", mandate: "Tenant health, responses, Liv incidents" },
  { id: "cro", role: "CRO", mandate: "Pipeline, billing readiness, commercial proof" },
];

export function isExecHatId(value: string): value is ExecHatId {
  return (EXEC_HAT_IDS as readonly string[]).includes(value);
}
