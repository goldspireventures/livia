import { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PublicSurfaceLoading } from "@/components/public/public-surface-chrome";
import { GuestHubPageHeader, GuestHubShell, GuestHubUpcomingHero } from "@/components/guest/guest-hub-chrome";
import { GuestHubLivChat } from "@/components/guest/guest-hub-liv-chat";
import { GuestHubSignIn } from "@/components/guest/guest-hub-sign-in";
import { formatDateTime } from "@/lib/format";
import { GUEST_HUB_COPY, type GuestPreferredModality } from "@workspace/policy";
import { GuestPreferredChannelCard } from "@/components/guest/guest-preferred-channel-card";
import { extractGuestVisitToken, normalizeGuestVisitUrl } from "@/lib/guest-visit-path";
import { GuestShopAvatar } from "@/components/guest/guest-shop-avatar";
import { Heart, Loader2 } from "lucide-react";

function normalizeHubView(view: HubView): HubView {
  return {
    ...view,
    upcomingBookings: view.upcomingBookings.map((b) => ({
      ...b,
      visitUrl: normalizeGuestVisitUrl(b.visitUrl, b.slug, b.bookingId),
    })),
    shops: view.shops.map((s) => ({
      ...s,
      manageVisitUrl: s.manageVisitUrl
        ? normalizeGuestVisitUrl(s.manageVisitUrl, s.slug)
        : null,
    })),
  };
}

type HubShop = {
  businessId: string;
  businessName: string;
  slug: string;
  vertical: string;
  logoUrl: string | null;
  imageUrl?: string | null;
  bookUrl: string;
  shopRelationshipUrl?: string;
  manageVisitUrl: string | null;
  isFavorite: boolean;
  lastServiceName: string | null;
  relationshipHint?: string | null;
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

type PackageCreditRow = {
  ledgerId: string;
  businessName: string;
  slug: string;
  packageName: string;
  creditsRemaining: number;
  creditsTotal: number;
  expiresAt: string | null;
  redemptionCode: string | null;
};

type HubView = {
  guestId: string;
  phoneE164: string;
  preferredModality?: GuestPreferredModality;
  shops: HubShop[];
  upcomingBookings: UpcomingBooking[];
  packageCredits?: PackageCreditRow[];
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
  const [location, setLocation] = useLocation();
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
    const raw = (await r.json()) as HubView;
    return normalizeHubView(raw);
  }, []);

  const redirectLegacyVisit = useCallback(
    (visitToken: string, hubView: HubView | null) => {
      const fromHub = hubView?.upcomingBookings.find(
        (b) => extractGuestVisitToken(b.visitUrl) === visitToken,
      );
      if (fromHub) {
        window.location.assign(fromHub.visitUrl);
        return;
      }
      const shop = hubView?.shops.find((s) => {
        const t = s.manageVisitUrl ? extractGuestVisitToken(s.manageVisitUrl) : null;
        return t === visitToken;
      });
      if (shop?.manageVisitUrl) {
        window.location.assign(shop.manageVisitUrl);
        return;
      }
      void fetch(`/api/public/guest-hub/visit/${encodeURIComponent(visitToken)}`)
        .then(async (res) => (res.ok ? ((await res.json()) as { path?: string }) : null))
        .then((j) => {
          if (j?.path) window.location.assign(j.path);
        })
        .catch(() => undefined);
    },
    [],
  );

  useEffect(() => {
    const visitToken = new URLSearchParams(window.location.search).get("visit");
    if (!visitToken) return;
    redirectLegacyVisit(visitToken, view);
  }, [location, view, redirectLegacyVisit]);

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
              {GUEST_HUB_COPY.stagingBannerTitle} — {GUEST_HUB_COPY.stagingBannerBody}
              {magicOtp || surfaceConfig?.guestHub.magicOtpCode ? (
                <span className="block font-mono mt-1">
                  Use code{" "}
                  <strong>{magicOtp ?? surfaceConfig?.guestHub.magicOtpCode}</strong>
                  {devOtp ? ` or ${devOtp}` : ""}
                </span>
              ) : null}
              <span className="block mt-2 text-muted-foreground">{GUEST_HUB_COPY.demoGuestHint}</span>
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

  function signOut() {
    localStorage.removeItem(HUB_TOKEN_KEY);
    setHubToken(null);
    setView(null);
  }

  const statsLine = [
    `${view.shops.length} studios`,
    `${view.upcomingBookings.length} upcoming`,
    view.packageCredits?.length ? `${view.packageCredits.length} packs` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <GuestHubShell
      testId="guest-hub-home"
      phoneE164={view.phoneE164}
      hubToken={hubToken}
      onSignOut={signOut}
    >
      <GuestHubPageHeader
        title={GUEST_HUB_COPY.vaultTitle}
        subtitle={GUEST_HUB_COPY.vaultSubtitle}
      >
        <p
          className="text-xs text-muted-foreground tabular-nums font-mono"
          data-testid="guest-hub-vault-stats"
        >
          {statsLine}
        </p>
      </GuestHubPageHeader>

      <GuestHubLivChat hubToken={hubToken} variant="panel" />

      <div className="grid gap-8 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-8 min-w-0">
          {heroBooking ? (
            <section className="space-y-3" data-testid="guest-hub-upcoming">
              <h2 className="text-sm font-medium text-muted-foreground">
                {GUEST_HUB_COPY.upcomingSection}
              </h2>
              <GuestHubUpcomingHero
                businessName={heroBooking.businessName}
                serviceName={heroBooking.serviceName}
                startAt={heroBooking.startAt}
                visitUrl={heroBooking.visitUrl}
                formatDateTime={formatDateTime}
              />
              {moreUpcoming.length > 0 ? (
                <div className="grid sm:grid-cols-2 gap-3">
                  {moreUpcoming.map((b) => (
                    <Link key={b.bookingId} href={b.visitUrl}>
                      <Card className="h-full hover:border-primary/40 cursor-pointer transition-colors">
                        <CardContent className="py-4">
                          <p className="font-medium">{b.businessName}</p>
                          <p className="text-sm text-muted-foreground">{b.serviceName}</p>
                          <p className="text-xs text-muted-foreground mt-2 font-mono tabular-nums">
                            {formatDateTime(b.startAt)}
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              ) : null}
            </section>
          ) : null}

          {view.shops.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-sm text-muted-foreground max-w-lg mx-auto">
                {GUEST_HUB_COPY.emptyShops}
              </CardContent>
            </Card>
          ) : (
            <>
              {favoriteShops.length > 0 ? (
                <ShopSection
                  title={GUEST_HUB_COPY.favoritesSection}
                  shops={favoriteShops}
                  favoriteBusy={favoriteBusy}
                  onToggleFavorite={toggleFavorite}
                />
              ) : null}
              <ShopSection
                title={
                  favoriteShops.length > 0
                    ? GUEST_HUB_COPY.moreShopsSection
                    : GUEST_HUB_COPY.allShopsSection
                }
                shops={otherShops.length > 0 ? otherShops : view.shops}
                favoriteBusy={favoriteBusy}
                onToggleFavorite={toggleFavorite}
              />
            </>
          )}
        </div>

        <aside className="space-y-6 min-w-0">
          <GuestPreferredChannelCard
            hubToken={hubToken}
            preferredModality={view.preferredModality ?? "ANY"}
            onUpdated={(next) => setView((v) => (v ? { ...v, preferredModality: next } : v))}
          />

          {view.packageCredits && view.packageCredits.length > 0 ? (
            <section className="space-y-3" data-testid="guest-hub-package-credits">
              <h2 className="text-sm font-medium">{GUEST_HUB_COPY.packageCreditsSection}</h2>
              {view.packageCredits.map((p) => (
                <Card key={p.ledgerId}>
                  <CardContent className="py-4 text-sm">
                    <p className="font-medium">{p.businessName}</p>
                    <p className="text-muted-foreground">{p.packageName}</p>
                    <p className="mt-2 tabular-nums">
                      {p.creditsRemaining} of {p.creditsTotal} sessions left
                    </p>
                    {p.expiresAt ? (
                      <p className="text-xs text-muted-foreground mt-1">
                        Expires {formatDateTime(p.expiresAt)}
                      </p>
                    ) : null}
                    {p.redemptionCode ? (
                      <p className="font-mono text-xs mt-2 tracking-wider">{p.redemptionCode}</p>
                    ) : null}
                    <Link
                      href={p.slug ? `/book/${p.slug}` : "#"}
                      className="text-primary text-xs mt-3 inline-block font-medium"
                    >
                      Book a session →
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </section>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-4 text-xs text-muted-foreground">
                {GUEST_HUB_COPY.packageCreditsEmpty}
              </CardContent>
            </Card>
          )}
        </aside>
      </div>
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
      {shops.map((shop) => {
        const shopHref = shop.shopRelationshipUrl ?? `/my/${shop.slug}`;
        const primaryHref = shop.manageVisitUrl ?? shopHref;
        const primaryLabel = shop.manageVisitUrl
          ? "Manage visit"
          : GUEST_HUB_COPY.manageStudioCta;
        return (
          <Card
            key={shop.businessId}
            className="overflow-hidden hover:border-primary/35 transition-colors"
            data-testid={`guest-hub-shop-${shop.slug}`}
          >
            <CardContent className="py-4 flex items-center gap-3">
              <Link href={shopHref} className="flex items-center gap-3 flex-1 min-w-0">
                <GuestShopAvatar
                  businessName={shop.businessName}
                  imageUrl={shop.imageUrl}
                  logoUrl={shop.logoUrl}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{shop.businessName}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {shop.vertical.replace(/-/g, " ")}
                    {shop.lastServiceName ? ` · last: ${shop.lastServiceName}` : ""}
                  </p>
                  {shop.relationshipHint ? (
                    <p className="text-[11px] text-primary/90 mt-1 line-clamp-1">
                      {shop.relationshipHint}
                    </p>
                  ) : null}
                </div>
              </Link>
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
              <Button size="sm" variant={shop.manageVisitUrl ? "default" : "secondary"} asChild className="shrink-0">
                <Link href={primaryHref}>{primaryLabel}</Link>
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}
