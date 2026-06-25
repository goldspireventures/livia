import { useState } from "react";
import { useSignIn, useClerk, useUser } from "@clerk/clerk-react";
import { useLocation } from "wouter";
import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GatewayAuthCard } from "@/components/gateway/gateway-auth-card";
import { formatClerkAuthError } from "@/lib/clerk-auth-errors";
import { readSignInRedirectPath } from "@/lib/local-dashboard-auth";
import { fetchPostSignInLandingPath } from "@/lib/post-sign-in-landing";
import { LIVIA_FORM_EXAMPLES } from "@workspace/policy";

type Props = {
  redirectUrl?: string;
  onEmailChange?: (email: string) => void;
  /** Omit inner card when parent provides shell chrome. */
  bare?: boolean;
};

export function LiviaEmailSignInForm({ redirectUrl, onEmailChange, bare = false }: Props) {
  const { signIn, isLoaded } = useSignIn();
  const { setActive, user: clerkUser } = useClerk();
  const { user } = useUser();
  const [, navigate] = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoaded || !signIn || busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await signIn.create({
        identifier: email.trim(),
        password,
      });

      if (result.status === "complete" && result.createdSessionId) {
        await setActive({ session: result.createdSessionId });
        const clerkUserId = clerkUser?.id ?? user?.id ?? "";
        const requested = redirectUrl ?? readSignInRedirectPath();
        const landing = await fetchPostSignInLandingPath({
          clerkUserId,
          email: clerkUser?.primaryEmailAddress?.emailAddress ?? user?.primaryEmailAddress?.emailAddress ?? email.trim(),
          requestedRedirect: requested,
        });
        navigate(landing);
        return;
      }

      setError("Extra verification is required for this account. Contact support if this persists.");
    } catch (err: unknown) {
      setError(formatClerkAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  const body = (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="signin-email">Email</Label>
          <Input
            id="signin-email"
            type="email"
            autoComplete="email"
            placeholder={LIVIA_FORM_EXAMPLES.ownerEmail}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              onEmailChange?.(e.target.value);
            }}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="signin-password">Password</Label>
          <div className="relative">
            <Input
              id="signin-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-10"
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
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button
          type="submit"
          className="w-full"
          disabled={busy || !email.trim() || !password || !isLoaded}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
          {!busy ? <ArrowRight className="ml-2 h-4 w-4" /> : null}
        </Button>
      </form>
  );

  if (bare) {
    return <div data-testid="livia-sign-in-form">{body}</div>;
  }

  return <GatewayAuthCard testId="livia-sign-in-form">{body}</GatewayAuthCard>;
}
