import { useEffect, useState } from "react";
import { useSearch } from "wouter";
import { GatewayAuthPageShell } from "@/components/gateway/gateway-auth-page-shell";
import { GatewayAuthSessionGate } from "@/components/gateway/gateway-auth-session-gate";
import { LiviaEmailSignUpForm } from "@/components/gateway/livia-email-sign-up-form";
import { captureOnboardingVerticalFromUrl } from "@/lib/onboarding-vertical-intent";
import { BetaSignupNotice } from "@/components/gateway/beta-signup-notice";

export default function SignUpPage() {
  const [step, setStep] = useState<"form" | "verify">("form");
  const search = useSearch();

  useEffect(() => {
    captureOnboardingVerticalFromUrl();
  }, [search]);

  return (
    <GatewayAuthSessionGate mode="sign-up">
      <GatewayAuthPageShell
      title={step === "verify" ? "Verify email" : "Create account"}
      subtitle={step === "verify" ? "Enter the six-digit code from your email." : undefined}
      headerAction={{ href: "/sign-in", label: "Sign in" }}
      footer={
        step === "form" ? (
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <a href="/sign-in" className="font-medium text-primary underline underline-offset-2">
              Sign in
            </a>
          </p>
        ) : null
      }
    >
      <BetaSignupNotice />
      <LiviaEmailSignUpForm bare redirectUrl="/legal-acceptance" onStepChange={setStep} />
      </GatewayAuthPageShell>
    </GatewayAuthSessionGate>
  );
}
