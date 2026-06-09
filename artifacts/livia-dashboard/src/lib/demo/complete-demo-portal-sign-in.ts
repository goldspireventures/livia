import type { QueryClient } from "@tanstack/react-query";
import type { useSignIn } from "@clerk/clerk-react";
import { completeDemoClerkSignIn } from "@/lib/demo-clerk-sign-in";
import { applyDemoSessionContext, type DemoSignInResult } from "@/lib/demo-portal";
import { prefetchTenantDashboardShell } from "@/lib/prefetch-tenant-dashboard";
import type { useGatewaySkinHandoffOptional } from "@/components/gateway/gateway-skin-handoff-provider";

type SignInResource = NonNullable<ReturnType<typeof useSignIn>["signIn"]>;
type GatewayHandoff = NonNullable<ReturnType<typeof useGatewaySkinHandoffOptional>>;

type ClerkActions = {
  signOut?: (opts: { sessionId: string }) => Promise<unknown>;
  setActive: (opts: { session: string }) => Promise<unknown>;
  sessionId?: string | null;
};

/**
 * Demo portal sign-in — navigate quickly; warm tenant shell in the background.
 * Skips gateway veil animation in dev (saves ~1.5s on every role pick).
 */
export async function completeDemoPortalSignIn(opts: {
  signIn: SignInResource;
  clerk: ClerkActions;
  result: DemoSignInResult;
  password?: string;
  queryClient: QueryClient;
  navigate: (path: string) => void;
  gatewayHandoff?: GatewayHandoff | null;
  vertical?: string;
  useGatewayVeil?: boolean;
}): Promise<void> {
  const {
    signIn,
    clerk,
    result,
    password,
    queryClient,
    navigate,
    gatewayHandoff,
    vertical,
    useGatewayVeil = import.meta.env.PROD,
  } = opts;

  await completeDemoClerkSignIn(signIn, clerk, result, password);
  applyDemoSessionContext(result);

  const go = () => navigate(result.landingPath);
  void prefetchTenantDashboardShell(queryClient, result.businessId);

  if (gatewayHandoff && useGatewayVeil) {
    await gatewayHandoff.transitionToTenant(go, {
      vertical,
      businessId: result.businessId,
      soft: true,
    });
    return;
  }

  go();
}
