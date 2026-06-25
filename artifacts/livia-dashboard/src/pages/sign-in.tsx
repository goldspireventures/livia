import { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { DemoPasswordSignIn } from "@/components/demo-password-sign-in";
import { GatewayAuthPageShell } from "@/components/gateway/gateway-auth-page-shell";
import { GatewayAuthSessionGate } from "@/components/gateway/gateway-auth-session-gate";
import { LiviaEmailSignInForm } from "@/components/gateway/livia-email-sign-in-form";
import { fetchDemoCatalog } from "@/lib/demo-portal";
import { isDemoAccountEmail } from "@/lib/demo-tenant";
import { isDemoLoginEnabled } from "@/lib/persona";
import { isSignedOutLanding } from "@/lib/auth-routes";
import { ProspectDemoRedirect } from "@/components/prospect-demo-redirect";
import { getMarketingDemoConciergeUrl } from "@/lib/marketing-demo-gate";
import { isLocalDashboardDev, readSignInRedirectPath } from "@/lib/local-dashboard-auth";
import { SignInTenantPreview } from "@/components/sign-in-tenant-preview";
import { useSignInAppearanceHint } from "@/lib/sign-in-appearance-hint";

function useBetaSignInMode(): boolean {
  return useMemo(() => {
    if (typeof window === "undefined") return false;
    const params = new URLSearchParams(window.location.search);
    return params.get("beta") === "1" || params.get("real") === "1";
  }, []);
}

function useFounderSignInSurface(): boolean {
  const betaMode = useBetaSignInMode();
  return betaMode || !isDemoLoginEnabled || isLocalDashboardDev();
}

export default function SignInPage() {
  const [devPassword, setDevPassword] = useState<string | undefined>();
  const [emailForHint, setEmailForHint] = useState("");
  const founderSignIn = useFounderSignInSurface();
  const redirectAfterSignIn = readSignInRedirectPath();
  const { hint: appearanceHint, loading: appearanceLoading } = useSignInAppearanceHint(emailForHint);
  const tenantHint =
    emailForHint.trim() && !isDemoAccountEmail(emailForHint) ? appearanceHint : null;

  useEffect(() => {
    if (!isDemoLoginEnabled || !import.meta.env.DEV) return;
    fetchDemoCatalog()
      .then((c) => setDevPassword(c.sharedPassword ?? c.devPassword))
      .catch(() => undefined);
  }, []);

  if (isDemoLoginEnabled && !founderSignIn && !isSignedOutLanding()) {
    return <ProspectDemoRedirect />;
  }

  const invitedDemoUrl = getMarketingDemoConciergeUrl();

  return (
    <GatewayAuthSessionGate mode="sign-in">
    <GatewayAuthPageShell
      title="Sign in"
      headerAction={{ href: "/sign-up", label: "Create account" }}
      above={
        isSignedOutLanding() ? (
          <p className="rounded-lg border border-border/60 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
            Signed out.{" "}
            <a href={invitedDemoUrl} className="text-primary underline underline-offset-2">
              Guest demo
            </a>
          </p>
        ) : null
      }
      footer={
        <p className="text-sm text-muted-foreground">
          No account?{" "}
          <a href="/sign-up" className="font-medium text-primary underline underline-offset-2">
            Create one
          </a>
        </p>
      }
      below={
        import.meta.env.DEV && isDemoLoginEnabled ? (
          <details className="group rounded-lg border border-dashed border-border/60 text-sm">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2.5 text-muted-foreground [&::-webkit-details-marker]:hidden">
              <span>Developer demo sign-in</span>
              <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" />
            </summary>
            <div className="border-t border-border/40 px-3 pb-3 pt-2">
              <DemoPasswordSignIn devPasswordHint={devPassword} embedded showTenantPreview={false} />
            </div>
          </details>
        ) : null
      }
    >
      <SignInTenantPreview
        hint={tenantHint}
        loading={appearanceLoading && Boolean(emailForHint.trim())}
        embedded
      >
        <LiviaEmailSignInForm
          bare
          redirectUrl={redirectAfterSignIn ?? "/dashboard"}
          onEmailChange={setEmailForHint}
        />
      </SignInTenantPreview>
    </GatewayAuthPageShell>
    </GatewayAuthSessionGate>
  );
}
