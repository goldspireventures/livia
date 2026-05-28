import { useState } from "react";
import { useSignIn, useClerk } from "@clerk/clerk-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api-fetch";
import {
  applyDemoSessionContext,
  type DemoSignInResult,
} from "@/lib/demo-portal";

type Props = {
  defaultEmail?: string;
  devPasswordHint?: string;
};

export function DemoPasswordSignIn({ defaultEmail = "", devPasswordHint }: Props) {
  const { signIn, isLoaded, setActive } = useSignIn();
  const { signOut, session } = useClerk();
  const [, navigate] = useLocation();
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoaded || !signIn || busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await apiFetch<DemoSignInResult>("/demo/sign-in-email", {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), password }),
      });
      if (session?.id) {
        await signOut({ sessionId: session.id });
      }
      const attempt = await signIn.create({
        strategy: "ticket",
        ticket: result.token!,
      });
      if (attempt.status === "complete" && attempt.createdSessionId) {
        await setActive({ session: attempt.createdSessionId });
        applyDemoSessionContext(result);
        navigate(result.landingPath);
      } else {
        setError("Sign-in did not complete. Run demo provision, then try again.");
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Could not sign in. Use LIVIA_DEMO_PASSWORD from .env (default LiviaDemo2026!).";
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 space-y-3 rounded-xl border border-primary/30 bg-primary/5 p-4 text-left"
    >
      <p className="text-xs font-mono uppercase tracking-wide text-muted-foreground">
        Demo account (direct sign-in)
      </p>
      <div className="space-y-2">
        <Label htmlFor="demo-email" className="text-xs">
          Email
        </Label>
        <Input
          id="demo-email"
          type="email"
          autoComplete="username"
          placeholder="desk@livia.io"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="demo-password" className="text-xs">
          Password
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
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      <Button type="submit" className="w-full" disabled={busy || !email.trim() || !password}>
        {busy ? "Signing in…" : "Sign in as demo"}
      </Button>
      <p className="text-[11px] text-muted-foreground leading-relaxed">
        Uses a Clerk ticket so you skip “extra verification” steps. Password is{" "}
        <code className="text-[10px]">LIVIA_DEMO_PASSWORD</code>
        {devPasswordHint ? (
          <>
            {" "}
            — dev default <code className="text-[10px]">{devPasswordHint}</code>
          </>
        ) : null}
        . Not <code className="text-[10px]">LiveDemo2026!</code>.
      </p>
    </form>
  );
}
