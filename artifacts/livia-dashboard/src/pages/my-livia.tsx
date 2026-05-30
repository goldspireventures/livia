import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PublicSurfaceFooter,
  PublicSurfaceLoading,
} from "@/components/public/public-surface-chrome";
import { LiviaWordmark } from "@/components/brand/LiviaMark";
import { Heart, Loader2, Store } from "lucide-react";

type HubShop = {
  businessId: string;
  businessName: string;
  slug: string;
  vertical: string;
  logoUrl: string | null;
  bookUrl: string;
  isFavorite: boolean;
};

type HubView = {
  guestId: string;
  phoneE164: string;
  shops: HubShop[];
};

type SurfaceConfig = {
  deployEnv: string;
  stagingRelaxed: boolean;
  guestHub: {
    otpMode: "strict" | "dev" | "bypass";
    phoneMode: "strict" | "loose";
    magicOtpCode: string | null;
    exposeDevOtp: boolean;
  };
};

const HUB_TOKEN_KEY = "livia_guest_hub_token";

export default function MyLiviaPage() {
  const [surfaceConfig, setSurfaceConfig] = useState<SurfaceConfig | null>(null);
  const [hubToken, setHubToken] = useState<string | null>(() =>
    typeof window !== "undefined" ? localStorage.getItem(HUB_TOKEN_KEY) : null,
  );
  const [view, setView] = useState<HubView | null>(null);
  const [loading, setLoading] = useState(Boolean(hubToken));
  const [phone, setPhone] = useState("");
  const [otpSession, setOtpSession] = useState<string | null>(null);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [magicOtp, setMagicOtp] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/public/surface-config")
      .then(async (r) => (r.ok ? ((await r.json()) as SurfaceConfig) : null))
      .then(setSurfaceConfig)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!hubToken) return;
    setLoading(true);
    fetch("/api/public/guest-hub/me", {
      headers: { "X-Guest-Hub-Token": hubToken },
    })
      .then(async (r) => {
        if (!r.ok) throw new Error("session");
        return r.json() as Promise<HubView>;
      })
      .then(setView)
      .catch(() => {
        localStorage.removeItem(HUB_TOKEN_KEY);
        setHubToken(null);
      })
      .finally(() => setLoading(false));
  }, [hubToken]);

  const stagingRelaxed = surfaceConfig?.stagingRelaxed ?? false;
  const phonePlaceholder =
    surfaceConfig?.guestHub.phoneMode === "loose" ? "Any test number (e.g. 12345)" : "+353 87 …";

  async function requestOtp() {
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch("/api/public/guest-hub/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error ?? "Could not send code");
      }
      const j = (await r.json()) as {
        sessionToken: string;
        devOtp?: string;
        magicOtpCode?: string;
      };
      setOtpSession(j.sessionToken);
      setDevOtp(j.devOtp ?? null);
      setMagicOtp(j.magicOtpCode ?? surfaceConfig?.guestHub.magicOtpCode ?? null);
      if (j.magicOtpCode) setCode(j.magicOtpCode);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Try again");
    } finally {
      setBusy(false);
    }
  }

  async function verifyOtp() {
    if (!otpSession) return;
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch("/api/public/guest-hub/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionToken: otpSession, code }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error ?? "Incorrect code");
      }
      const j = (await r.json()) as { hubToken: string };
      localStorage.setItem(HUB_TOKEN_KEY, j.hubToken);
      setHubToken(j.hubToken);
      setOtpSession(null);
      setCode("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Try again");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <PublicSurfaceLoading />;

  if (!hubToken || !view) {
    return (
      <div className="min-h-screen bg-background public-booking-shell" data-testid="guest-hub-sign-in">
        <div className="max-w-md mx-auto px-4 py-16 space-y-6">
          <div className="text-center space-y-2">
            <LiviaWordmark size="md" className="mx-auto opacity-90" />
            <p className="text-[10px] uppercase tracking-widest font-mono text-primary">My Livia</p>
            <h1 className="text-2xl font-serif">Your bookings, one place</h1>
            <p className="text-sm text-muted-foreground">
              Phone verify once — see every shop you&apos;ve booked with Livia. No password.
            </p>
          </div>

          {stagingRelaxed ? (
            <div
              className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100/90"
              data-testid="guest-hub-staging-banner"
            >
              Staging QA — loose phone + magic OTP
              {magicOtp || surfaceConfig?.guestHub.magicOtpCode ? (
                <span className="block font-mono mt-1">
                  Use code{" "}
                  <strong>{magicOtp ?? surfaceConfig?.guestHub.magicOtpCode}</strong>
                  {devOtp ? ` or ${devOtp}` : ""}
                </span>
              ) : null}
            </div>
          ) : null}

          {!otpSession ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Enter your mobile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  type="tel"
                  placeholder={phonePlaceholder}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  data-testid="guest-hub-phone"
                />
                <Button className="w-full" disabled={busy || !phone.trim()} onClick={() => void requestOtp()}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send code"}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Enter the code</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {devOtp ? (
                  <p className="text-xs text-muted-foreground font-mono">Session code: {devOtp}</p>
                ) : null}
                {magicOtp ? (
                  <p className="text-xs text-muted-foreground font-mono">Magic staging code: {magicOtp}</p>
                ) : null}
                <Input
                  inputMode="numeric"
                  placeholder="6-digit code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  data-testid="guest-hub-otp"
                />
                <Button className="w-full" disabled={busy || code.length < 4} onClick={() => void verifyOtp()}>
                  Verify
                </Button>
              </CardContent>
            </Card>
          )}
          {err ? <p className="text-sm text-destructive text-center">{err}</p> : null}
          <PublicSurfaceFooter />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="guest-hub-home">
      <div className="max-w-lg mx-auto px-4 py-10 space-y-6">
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-widest font-mono text-primary">My Livia</p>
          <h1 className="text-2xl font-serif mt-2">Your shops</h1>
          <p className="text-xs text-muted-foreground mt-1">{view.phoneE164}</p>
        </div>

        {view.shops.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              Book at any Livia shop — when you opt in, it appears here for easy rebooking.
            </CardContent>
          </Card>
        ) : (
          view.shops.map((shop) => (
            <Card key={shop.businessId}>
              <CardContent className="py-4 flex items-center gap-3">
                {shop.logoUrl ? (
                  <img src={shop.logoUrl} alt="" className="h-10 w-10 rounded object-contain" />
                ) : (
                  <Store className="h-8 w-8 text-muted-foreground" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{shop.businessName}</p>
                  <p className="text-xs text-muted-foreground capitalize">{shop.vertical.replace(/-/g, " ")}</p>
                </div>
                {shop.isFavorite ? <Heart className="h-4 w-4 text-primary fill-primary" /> : null}
                <Link href={shop.bookUrl}>
                  <Button size="sm" variant="secondary">
                    Book again
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))
        )}

        <Button
          variant="ghost"
          className="w-full text-muted-foreground"
          onClick={() => {
            localStorage.removeItem(HUB_TOKEN_KEY);
            setHubToken(null);
            setView(null);
          }}
        >
          Sign out
        </Button>
        <PublicSurfaceFooter />
      </div>
    </div>
  );
}
