import { useEffect, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { LiviaWordmark } from "@/components/brand/LiviaMark";
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
      className="flex items-center justify-center gap-2 text-[10px] font-mono uppercase tracking-widest"
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
      className="min-h-screen bg-background guest-hub-shell guest-hub-platform"
      data-testid="guest-hub-sign-in"
    >
      <div className="max-w-md mx-auto px-4 py-12 space-y-6">
        <div className="text-center space-y-3">
          <LiviaWordmark size="md" className="mx-auto opacity-90" />
          <p className="text-[10px] uppercase tracking-widest font-mono text-primary">
            {GUEST_HUB_COPY.productName}
          </p>
          <h1 className="text-2xl font-serif">{GUEST_HUB_COPY.signInTitle}</h1>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">{GUEST_HUB_COPY.signInBody}</p>
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
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify & open vault"}
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

        <PublicSurfaceFooter />
      </div>
    </div>
  );
}
