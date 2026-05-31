import { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PublicSurfaceLoading } from "@/components/public/public-surface-chrome";
import {
  GuestHubShell,
  GuestHubUpcomingHero,
} from "@/components/guest/guest-hub-chrome";
import { GuestHubSignIn } from "@/components/guest/guest-hub-sign-in";
import { formatDateTime } from "@/lib/format";
import { Heart, Loader2, Store } from "lucide-react";

type HubShop = {
  businessId: string;
  businessName: string;
  slug: string;
  vertical: string;
  logoUrl: string | null;
  bookUrl: string;
  isFavorite: boolean;
  lastServiceName: string | null;
};

type UpcomingBooking = {
  bookingId: string;
  businessName: string;
  slug: string;
  status: string;
  startAt: string;
  serviceName: string;
  staffDisplayName: string | null;
  visitUrl: string;
};

type HubView = {
  guestId: string;
  phoneE164: string;
  shops: HubShop[];
  upcomingBookings: UpcomingBooking[];
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
  const [favoriteBusy, setFavoriteBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [resendSec, setResendSec] = useState(0);

  const loadView = useCallback(async (token: string) => {
    const r = await fetch("/api/public/guest-hub/me", {
      headers: { "X-Guest-Hub-Token": token },
    });
    if (!r.ok) throw new Error("session");
    return r.json() as Promise<HubView>;
  }, []);

  useEffect(() => {
    fetch("/api/public/surface-config")
      .then(async (r) => (r.ok ? ((await r.json()) as SurfaceConfig) : null))
      .then(setSurfaceConfig)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (resendSec <= 0) return;
    const t = window.setInterval(() => {
      setResendSec((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => window.clearInterval(t);
  }, [resendSec]);

  useEffect(() => {
    if (!hubToken) return;
    setLoading(true);
    loadView(hubToken)
      .then(setView)
      .catch(() => {
        localStorage.removeItem(HUB_TOKEN_KEY);
        setHubToken(null);
      })
      .finally(() => setLoading(false));
  }, [hubToken, loadView]);

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
      setResendSec(60);
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

  async function toggleFavorite(businessId: string, pinned: boolean) {
    if (!hubToken) return;
    setFavoriteBusy(businessId);
    try {
      const r = await fetch(`/api/public/guest-hub/favorites/${businessId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Guest-Hub-Token": hubToken,
        },
        body: JSON.stringify({ pinned }),
      });
      if (!r.ok) throw new Error("favorite");
      setView(await r.json());
    } catch {
      setErr("Could not update favorite");
    } finally {
      setFavoriteBusy(null);
    }
  }

  if (loading) return <PublicSurfaceLoading />;

  if (!hubToken || !view) {
    return (
      <GuestHubSignIn
        phone={phone}
        onPhoneChange={setPhone}
        phonePlaceholder={phonePlaceholder}
        code={code}
        onCodeChange={setCode}
        otpSession={otpSession}
        busy={busy}
        resendSec={resendSec}
        err={err}
        stagingRelaxed={stagingRelaxed}
        devOtp={devOtp}
        magicOtp={magicOtp}
        stagingHint={
          stagingRelaxed ? (
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
          ) : undefined
        }
        onRequestOtp={() => void requestOtp()}
        onVerifyOtp={() => void verifyOtp()}
        onChangePhone={() => {
          setOtpSession(null);
          setCode("");
          setDevOtp(null);
        }}
      />
    );
  }

  const favoriteShops = view.shops.filter((s) => s.isFavorite);
  const otherShops = view.shops.filter((s) => !s.isFavorite);

  const heroBooking = view.upcomingBookings[0];
  const moreUpcoming = view.upcomingBookings.slice(1);

  return (
    <GuestHubShell testId="guest-hub-home" phoneE164={view.phoneE164}>
      <div className="text-center">
        <h1 className="text-2xl font-serif">Your vault</h1>
        <p className="text-xs text-muted-foreground mt-1">Every Livia shop you&apos;ve booked with</p>
      </div>

      {heroBooking ? (
        <section className="space-y-3" data-testid="guest-hub-upcoming">
          <GuestHubUpcomingHero
            businessName={heroBooking.businessName}
            serviceName={heroBooking.serviceName}
            startAt={heroBooking.startAt}
            visitUrl={heroBooking.visitUrl}
            formatDateTime={formatDateTime}
          />
          {moreUpcoming.map((b) => (
            <Link key={b.bookingId} href={b.visitUrl}>
              <Card className="hover:border-primary/40 cursor-pointer transition-colors">
                <CardContent className="py-3">
                  <p className="font-medium">{b.businessName}</p>
                  <p className="text-sm text-muted-foreground">{b.serviceName}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatDateTime(b.startAt)}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </section>
      ) : null}

        {view.shops.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              Book at any Livia shop — when you opt in, it appears here for easy rebooking.
            </CardContent>
          </Card>
        ) : (
          <>
            {favoriteShops.length > 0 ? (
              <ShopSection
                title="Favorites"
                shops={favoriteShops}
                favoriteBusy={favoriteBusy}
                onToggleFavorite={toggleFavorite}
              />
            ) : null}
            <ShopSection
              title={favoriteShops.length > 0 ? "All shops" : "Your shops"}
              shops={otherShops.length > 0 ? otherShops : view.shops}
              favoriteBusy={favoriteBusy}
              onToggleFavorite={toggleFavorite}
            />
          </>
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
    </GuestHubShell>
  );
}

function ShopSection({
  title,
  shops,
  favoriteBusy,
  onToggleFavorite,
}: {
  title: string;
  shops: HubShop[];
  favoriteBusy: string | null;
  onToggleFavorite: (businessId: string, pinned: boolean) => void;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium text-muted-foreground">{title}</h2>
      {shops.map((shop) => (
        <Card key={shop.businessId} className="overflow-hidden">
          <CardContent className="py-4 flex items-center gap-3">
            {shop.logoUrl ? (
              <img src={shop.logoUrl} alt="" className="h-12 w-12 rounded-lg object-contain shrink-0 bg-muted/30" />
            ) : (
              <Store className="h-8 w-8 text-muted-foreground shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{shop.businessName}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {shop.vertical.replace(/-/g, " ")}
                {shop.lastServiceName ? ` · last: ${shop.lastServiceName}` : ""}
              </p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="shrink-0"
              disabled={favoriteBusy === shop.businessId}
              aria-label={shop.isFavorite ? "Remove favorite" : "Add favorite"}
              data-testid={`guest-hub-favorite-${shop.slug}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                void onToggleFavorite(shop.businessId, !shop.isFavorite);
              }}
            >
              {favoriteBusy === shop.businessId ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Heart
                  className={`h-4 w-4 ${shop.isFavorite ? "text-primary fill-primary" : "text-muted-foreground"}`}
                />
              )}
            </Button>
            <Button size="sm" variant="secondary" asChild className="shrink-0">
              <Link href={shop.bookUrl}>Book again</Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
