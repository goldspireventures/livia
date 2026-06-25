import { useState, type ReactNode } from "react";
import { useSignUp, useClerk } from "@clerk/clerk-react";
import { useLocation } from "wouter";
import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GatewayAuthCard } from "@/components/gateway/gateway-auth-card";
import { formatClerkAuthError, extractClerkError } from "@/lib/clerk-auth-errors";
import { GATEWAY_PASSWORD_HINT } from "@workspace/policy";

type Step = "form" | "verify";

type Props = {
  redirectUrl?: string;
  bare?: boolean;
  onStepChange?: (step: Step) => void;
};

function wrapBare(bare: boolean, testId: string, node: ReactNode) {
  if (bare) return <div data-testid={testId}>{node}</div>;
  return <GatewayAuthCard testId={testId}>{node}</GatewayAuthCard>;
}

export function LiviaEmailSignUpForm({
  redirectUrl = "/legal-acceptance",
  bare = false,
  onStepChange,
}: Props) {
  const { signUp, isLoaded } = useSignUp();
  const { setActive } = useClerk();
  const [, navigate] = useLocation();

  const [step, setStep] = useState<Step>("form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [errorCode, setErrorCode] = useState<string | undefined>();

  async function finishSession(sessionId: string | null | undefined) {
    if (!sessionId) {
      setError("Account created but sign-in failed. Try signing in.");
      return;
    }
    await setActive({ session: sessionId });
    navigate(redirectUrl);
  }

  async function handleCreateAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoaded || !signUp || busy) return;
    setBusy(true);
    setError("");
    setErrorCode(undefined);
    try {
      const result = await signUp.create({
        emailAddress: email.trim(),
        password,
      });

      if (result.status === "complete") {
        await finishSession(result.createdSessionId);
        return;
      }

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setStep("verify");
      onStepChange?.("verify");
    } catch (err: unknown) {
      const parsed = extractClerkError(err);
      setErrorCode(parsed.code);
      setError(formatClerkAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoaded || !signUp || busy) return;
    setBusy(true);
    setError("");
    setErrorCode(undefined);
    try {
      const result = await signUp.attemptEmailAddressVerification({ code: code.trim() });
      if (result.status === "complete") {
        await finishSession(result.createdSessionId);
        return;
      }
      setError("Wrong code or it expired. Resend and try again.");
    } catch (err: unknown) {
      const parsed = extractClerkError(err);
      setErrorCode(parsed.code);
      setError(formatClerkAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  async function resendCode() {
    if (!isLoaded || !signUp || busy) return;
    setBusy(true);
    setError("");
    setErrorCode(undefined);
    try {
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
    } catch (err: unknown) {
      const parsed = extractClerkError(err);
      setErrorCode(parsed.code);
      setError(formatClerkAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  if (step === "verify") {
    return wrapBare(
      bare,
      "livia-sign-up-verify",
      <form onSubmit={(e) => void handleVerify(e)} className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Code sent to <span className="text-foreground">{email.trim()}</span>
        </p>
        <div className="space-y-2">
          <Label htmlFor="signup-code">Verification code</Label>
          <Input
            id="signup-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="text-center text-lg tracking-[0.35em]"
            maxLength={6}
            required
          />
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={busy || code.trim().length < 6}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue"}
          {!busy ? <ArrowRight className="ml-2 h-4 w-4" /> : null}
        </Button>
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <button
            type="button"
            className="text-primary hover:underline"
            onClick={() => {
              setStep("form");
              onStepChange?.("form");
              setCode("");
              setError("");
              setErrorCode(undefined);
            }}
          >
            Different email
          </button>
          <button type="button" className="text-primary hover:underline" onClick={() => void resendCode()}>
            Resend code
          </button>
        </div>
      </form>,
    );
  }

  return wrapBare(
    bare,
    "livia-sign-up-form",
    <form onSubmit={(e) => void handleCreateAccount(e)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="signup-email">Email</Label>
          <Input
            id="signup-email"
            type="email"
            autoComplete="email"
            placeholder="you@yourbusiness.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="signup-password">Password</Label>
          <div className="relative">
            <Input
              id="signup-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-10"
              minLength={8}
              required
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:text-foreground"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">{GATEWAY_PASSWORD_HINT}</p>
        </div>
        {error ? (
          <div className="space-y-1">
            <p className="text-sm text-destructive">{error}</p>
            {errorCode === "form_identifier_exists" ? (
              <p className="text-sm text-muted-foreground">
                <a href="/sign-in" className="font-medium text-primary underline underline-offset-2">
                  Sign in
                </a>
              </p>
            ) : null}
          </div>
        ) : null}
        <Button
          type="submit"
          className="w-full"
          disabled={busy || !email.trim() || password.length < 8 || !isLoaded}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
          {!busy ? <ArrowRight className="ml-2 h-4 w-4" /> : null}
        </Button>
      </form>,
  );
}
