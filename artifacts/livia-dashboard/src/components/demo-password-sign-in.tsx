import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSignIn, useClerk } from "@clerk/clerk-react";
import { useLocation } from "wouter";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api-fetch";
import {
  applyDemoSessionContext,
  requestDemoQuickSignIn,
  type DemoSignInResult,
} from "@/lib/demo-portal";
import { completeDemoClerkSignIn } from "@/lib/demo-clerk-sign-in";
import { SignInTenantPreview } from "@/components/sign-in-tenant-preview";
import { useSignInAppearanceHint } from "@/lib/sign-in-appearance-hint";
import { useGatewaySkinHandoffOptional } from "@/components/gateway/gateway-skin-handoff-provider";
import { prefetchTenantDashboardShell } from "@/lib/prefetch-tenant-dashboard";

type Props = {
  defaultEmail?: string;
  devPasswordHint?: string;
  /** When true, omit outer border — parent provides chrome. */
  embedded?: boolean;
};

export function DemoPasswordSignIn({
  defaultEmail = "owner-luxe@demo.livia-hq.com",
  devPasswordHint,
  embedded = false,
}: Props) {
  const { signIn, isLoaded } = useSignIn();
  const { signOut, session, setActive } = useClerk();
  const [, navigate] = useLocation();
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { hint: appearanceHint, loading: appearanceLoading } = useSignInAppearanceHint(email);
  const queryClient = useQueryClient();
  const gatewayHandoff = useGatewaySkinHandoffOptional();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoaded || !signIn || busy) return;
    setBusy(true);
    setError("");
    try {
      const trimmedEmail = email.trim();
      const result =
        password.trim() || !devPasswordHint
          ? await apiFetch<DemoSignInResult>("/demo/sign-in-email", {
              method: "POST",
              body: JSON.stringify({ email: trimmedEmail, password }),
            })
          : await requestDemoQuickSignIn(trimmedEmail);
      await completeDemoClerkSignIn(
        signIn,
        { signOut, setActive, sessionId: session?.id },
        result,
        password.trim() || devPasswordHint,
      );
      applyDemoSessionContext(result);
      await prefetchTenantDashboardShell(queryClient, result.businessId);
      const go = () => navigate(result.landingPath);
      if (gatewayHandoff) {
        await gatewayHandoff.transitionToTenant(go, {
          businessId: result.businessId,
          soft: true,
        });
      } else {
        go();
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Could not sign in. Use LIVIA_DEMO_PASSWORD (default LiviaDemo2026!).";
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  const form = (
    <form
      onSubmit={handleSubmit}
      className={
        embedded
          ? "space-y-3 text-left"
          : "mt-6 space-y-3 rounded-xl border border-border/60 bg-muted/20 p-4 text-left"
      }
      data-testid="demo-password-sign-in"
    >
      {!embedded ? (
        <p className="text-xs text-muted-foreground leading-relaxed">
          Demo tenants only — password{" "}
          <code className="text-[10px]">{devPasswordHint ?? "LiviaDemo2026!"}</code>. Or use the{" "}
          <Link href="/demo" className="text-primary underline underline-offset-2">
            demo launcher
          </Link>
          .
        </p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="demo-email" className="text-xs">
            Demo email
          </Label>
          <Input
            id="demo-email"
            type="email"
            autoComplete="username"
            placeholder="owner-luxe@demo.livia-hq.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="demo-password" className="text-xs">
            Demo password
          </Label>
          <Input
            id="demo-password"
            type="password"
            autoComplete="current-password"
            placeholder={devPasswordHint ?? "LiviaDemo2026!"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="flex items-end">
          <Button
            type="submit"
            className="w-full"
            disabled={busy || !email.trim() || (!password && !devPasswordHint)}
          >
            {busy ? "Signing in…" : devPasswordHint && !password ? "Quick sign in" : "Sign in as demo"}
          </Button>
        </div>
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </form>
  );

  if (!embedded) return form;

  return (
    <SignInTenantPreview hint={appearanceHint} loading={appearanceLoading}>
      {form}
    </SignInTenantPreview>
  );
}
