import { useEffect, type ReactNode } from "react";
import { Loader2, Shield, Sparkles } from "lucide-react";
import { LiviaLogoLink } from "@/components/brand/livia-logo-link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PublicSurfaceFooter } from "@/components/public/public-surface-chrome";
import { GUEST_HUB_COPY } from "@workspace/policy";
import { cn } from "@/lib/utils";
import {
  applyGuestHubPlatformTheme,
  clearGuestHubPlatformTheme,
} from "@/lib/experience-theme";

function StepIndicator({ step }: { step: 1 | 2 }) {
  return (
    <ol
      className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest"
      aria-label="Sign-in progress"
    >
      <li
        className={cn(
          "px-2 py-1 rounded-full",
          step === 1 ? "bg-primary/15 text-primary" : "text-muted-foreground",
        )}
      >
        1 · Phone
      </li>
      <span className="text-muted-foreground/50">→</span>
      <li
        className={cn(
          "px-2 py-1 rounded-full",
          step === 2 ? "bg-primary/15 text-primary" : "text-muted-foreground",
        )}
      >
        2 · Code
      </li>
    </ol>
  );
}

export function GuestHubSignIn({
  phone,
  onPhoneChange,
  phonePlaceholder,
  code,
  onCodeChange,
  otpSession,
  busy,
  resendSec,
  err,
  stagingRelaxed,
  stagingHint,
  devOtp,
  magicOtp,
  onRequestOtp,
  onVerifyOtp,
  onChangePhone,
}: {
  phone: string;
  onPhoneChange: (v: string) => void;
  phonePlaceholder: string;
  code: string;
  onCodeChange: (v: string) => void;
  otpSession: string | null;
  busy: boolean;
  resendSec: number;
  err: string | null;
  stagingRelaxed: boolean;
  stagingHint?: ReactNode;
  devOtp: string | null;
  magicOtp: string | null;
  onRequestOtp: () => void;
  onVerifyOtp: () => void;
  onChangePhone: () => void;
}) {
  const step: 1 | 2 = otpSession ? 2 : 1;

  useEffect(() => {
    applyGuestHubPlatformTheme();
    return () => clearGuestHubPlatformTheme();
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col bg-background guest-hub-shell guest-hub-platform"
      data-testid="guest-hub-sign-in"
    >
      <div className="flex-1 grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <section className="hidden lg:flex flex-col justify-between border-r border-border/60 bg-gradient-to-br from-primary/10 via-background to-background p-10 xl:p-14">
          <div>
            <LiviaLogoLink size="md" className="opacity-90" home="marketing" />
            <p className="text-[10px] uppercase tracking-widest font-mono text-primary mt-8">
              {GUEST_HUB_COPY.productName}
            </p>
            <h1 className="text-4xl xl:text-5xl font-serif tracking-tight mt-4 max-w-lg leading-tight">
              {GUEST_HUB_COPY.tagline}
            </h1>
            <p className="text-muted-foreground mt-4 max-w-md text-base leading-relaxed">
              {GUEST_HUB_COPY.signInBody}
            </p>
          </div>
          <ul className="space-y-4 max-w-md text-sm text-muted-foreground">
            <li className="flex gap-3">
              <Shield className="h-5 w-5 text-primary shrink-0" />
              <span>{GUEST_HUB_COPY.signInBulletSingleSignIn}</span>
            </li>
            <li className="flex gap-3">
              <Sparkles className="h-5 w-5 text-primary shrink-0" />
              <span>{GUEST_HUB_COPY.signInBulletHistory}</span>
            </li>
          </ul>
        </section>

        <section className="flex flex-col justify-center px-4 py-10 sm:px-8 lg:px-12 xl:px-16">
          <div className="w-full max-w-md mx-auto space-y-6">
            <div className="lg:hidden text-center space-y-3">
              <LiviaLogoLink size="md" className="mx-auto opacity-90" home="marketing" />
              <p className="text-[10px] uppercase tracking-widest font-mono text-primary">
                {GUEST_HUB_COPY.productName}
              </p>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-serif">{GUEST_HUB_COPY.signInTitle}</h2>
              <p className="text-sm text-muted-foreground lg:hidden">{GUEST_HUB_COPY.signInBody}</p>
              <StepIndicator step={step} />
            </div>

            {stagingRelaxed && stagingHint ? stagingHint : null}

            {!otpSession ? (
              <Card className="border-primary/15 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Your mobile number</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input
                    type="tel"
                    autoComplete="tel"
                    placeholder={phonePlaceholder}
                    value={phone}
                    onChange={(e) => onPhoneChange(e.target.value)}
                    data-testid="guest-hub-phone"
                    className="min-h-[48px] text-base"
                  />
                  <Button
                    className="w-full min-h-[48px]"
                    disabled={busy || !phone.trim() || resendSec > 0}
                    onClick={onRequestOtp}
                  >
                    {busy ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : resendSec > 0 ? (
                      `Resend in ${resendSec}s`
                    ) : (
                      "Send verification code"
                    )}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-primary/15 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Enter the code we sent</CardTitle>
                  <p className="text-xs text-muted-foreground font-mono mt-1 truncate">{phone}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {devOtp ? (
                    <p className="text-xs text-muted-foreground font-mono">Session code: {devOtp}</p>
                  ) : null}
                  {magicOtp ? (
                    <p className="text-xs text-muted-foreground font-mono">Staging code: {magicOtp}</p>
                  ) : null}
                  <Input
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="6-digit code"
                    value={code}
                    onChange={(e) => onCodeChange(e.target.value)}
                    data-testid="guest-hub-otp"
                    className="min-h-[48px] text-center text-lg tracking-[0.3em] font-mono"
                  />
                  <Button
                    className="w-full min-h-[48px]"
                    disabled={busy || code.length < 4}
                    onClick={onVerifyOtp}
                  >
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : GUEST_HUB_COPY.signInVerifyCta}
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      className="flex-1 text-xs text-muted-foreground min-h-[44px]"
                      disabled={busy || resendSec > 0}
                      onClick={onRequestOtp}
                    >
                      {resendSec > 0 ? `Resend in ${resendSec}s` : "Resend code"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="flex-1 text-xs text-muted-foreground min-h-[44px]"
                      disabled={busy}
                      onClick={onChangePhone}
                    >
                      Change number
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {err ? (
              <p className="text-sm text-destructive text-center" role="alert">
                {err}
              </p>
            ) : null}
          </div>
        </section>
      </div>

      <div className="border-t border-border/60">
        <PublicSurfaceFooter />
      </div>
    </div>
  );
}
