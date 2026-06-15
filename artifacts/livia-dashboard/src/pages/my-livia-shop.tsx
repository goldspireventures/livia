import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PublicSurfaceLoading } from "@/components/public/public-surface-chrome";
import { GuestHubPageHeader, GuestHubShell } from "@/components/guest/guest-hub-chrome";
import { GuestHubLivChat } from "@/components/guest/guest-hub-liv-chat";
import { formatDateTime } from "@/lib/format";
import { GUEST_HUB_COPY } from "@workspace/policy";
import { GuestMyVaultModules } from "@/components/guest/guest-my-vault-modules";
import { GuestMyArtifactPanels } from "@/components/guest/guest-my-artifact-panels";
import { GuestStudioEngagementPanel } from "@/components/guest/guest-studio-engagement-panel";
import { ArrowLeft, CalendarCheck, Heart, MessageSquare } from "lucide-react";

const HUB_TOKEN_KEY = "livia_guest_hub_token";

type ShopPayload = {
  shop: {
    businessName: string;
    slug: string;
    vertical: string | null;
    logoUrl: string | null;
  };
  customer: {
    firstName: string | null;
    patchTestLabel: string | null;
    beautyPreferences: Record<string, unknown> | null;
  } | null;
  relationship: {
    headline: string;
    memoryHighlight: string | null;
    visitCount: number;
    stageLabel: string;
  } | null;
  upcomingBookings: Array<{
    bookingId: string;
    serviceName: string;
    startAt: string;
    staffDisplayName: string | null;
    manageUrl: string;
  }>;
  packageCredits: Array<{
    packageName: string;
    creditsRemaining: number;
    creditsTotal: number;
  }>;
  verticalArtifacts?: {
    pets: Array<{
      id: string;
      name: string;
      species: string;
      breed: string | null;
      behaviourNotes: string | null;
      allergyNotes: string | null;
    }>;
    proofs: Array<{
      proofId: string;
      status: string;
      note: string | null;
      imageUrl?: string | null;
      reviewUrl: string;
    }>;
    vehicleHighlight: string | null;
    consentItems?: Array<{
      id: string;
      label: string;
      status: string;
      kind: "consent" | "intake";
      actionUrl: string | null;
    }>;
    carePlan?: {
      name: string;
      sessionsCompleted: number;
      sessionsTotal: number;
      cadenceDays: number;
      status: string;
      nextBookHint?: string | null;
    } | null;
    wellnessPrep?: string[];
  };
  bookUrl: string;
  shopRelationshipUrl: string;
};

export default function MyLiviaShopPage() {
  const { slug } = useParams<{ slug: string }>();
  const [hubToken] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem(HUB_TOKEN_KEY) : null,
  );
  const [data, setData] = useState<ShopPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hubToken || !slug) {
      setLoading(false);
      return;
    }
    fetch(`/api/public/guest-hub/shops/${encodeURIComponent(slug)}`, {
      headers: { "X-Guest-Hub-Token": hubToken },
    })
      .then(async (r) => {
        if (!r.ok) throw new Error("not found");
        return r.json() as Promise<ShopPayload>;
      })
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [hubToken, slug]);

  if (!hubToken) {
    return (
      <GuestHubShell centered>
        <p className="text-sm text-center text-muted-foreground">{GUEST_HUB_COPY.signInRequired}</p>
        <Button asChild className="w-full">
          <Link href="/my">Sign in</Link>
        </Button>
      </GuestHubShell>
    );
  }

  if (loading) return <PublicSurfaceLoading />;

  if (!data) {
    return (
      <GuestHubShell hubToken={hubToken} centered>
        <p className="text-sm text-center text-muted-foreground">{GUEST_HUB_COPY.shopNotFound}</p>
        <Button asChild variant="outline" className="w-full">
          <Link href="/my">Back to My Livia</Link>
        </Button>
      </GuestHubShell>
    );
  }

  const next = data.upcomingBookings[0];

  const relationshipSubtitle = data.relationship
    ? `${data.relationship.stageLabel} · ${data.relationship.visitCount} ${GUEST_HUB_COPY.relationshipVisits}`
    : undefined;

  return (
    <GuestHubShell hubToken={hubToken} testId="guest-hub-shop-relationship">
      <Link
        href="/my"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {GUEST_HUB_COPY.backToVault}
      </Link>

      <GuestHubPageHeader
        title={data.shop.businessName}
        subtitle={relationshipSubtitle}
      >
        {data.shop.logoUrl ? (
          <img
            src={data.shop.logoUrl}
            alt=""
            className="h-14 w-14 rounded-xl object-cover border border-border/60"
          />
        ) : (
          <div className="h-14 w-14 rounded-xl bg-primary/15 flex items-center justify-center font-serif text-xl border border-border/60">
            {data.shop.businessName.charAt(0)}
          </div>
        )}
      </GuestHubPageHeader>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6 min-w-0">
          {data.relationship?.memoryHighlight ? (
            <p className="text-sm text-muted-foreground border-l-2 border-primary/40 pl-3">
              {data.relationship.memoryHighlight}
            </p>
          ) : null}

          {next ? (
            <Link href={next.manageUrl}>
              <Card className="hover:border-primary/40 cursor-pointer transition-colors border-primary/25">
                <CardContent className="py-5">
                  <p className="text-[10px] uppercase tracking-widest font-mono text-primary">
                    {GUEST_HUB_COPY.upcomingSection}
                  </p>
                  <p className="text-lg font-medium mt-2">{next.serviceName}</p>
                  <p className="text-sm text-muted-foreground font-mono tabular-nums">
                    {formatDateTime(next.startAt)}
                  </p>
                  {next.staffDisplayName ? (
                    <p className="text-sm text-muted-foreground mt-1">with {next.staffDisplayName}</p>
                  ) : null}
                  <p className="text-xs text-primary mt-3 font-medium">Manage visit →</p>
                </CardContent>
              </Card>
            </Link>
          ) : null}

          {data.verticalArtifacts ? (
            <GuestMyArtifactPanels
              artifacts={data.verticalArtifacts}
              vertical={data.shop.vertical}
              hubToken={hubToken}
              shopSlug={slug}
            />
          ) : null}

          <GuestStudioEngagementPanel
            vertical={data.shop.vertical}
            bookUrl={data.bookUrl}
            proofs={
              data.shop.vertical === "body-art" ? [] : data.verticalArtifacts?.proofs
            }
            hubToken={hubToken}
            shopSlug={slug}
            onMessage={() => {
              if (next) window.location.href = next.manageUrl;
            }}
          />

          <GuestMyVaultModules
            vertical={data.shop.vertical}
            displayOnly={false}
            bookUrl={data.bookUrl}
          />
        </div>

        <aside className="space-y-6 min-w-0">
          {data.packageCredits.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-sm font-medium">{GUEST_HUB_COPY.packageCreditsSection}</h2>
              {data.packageCredits.map((p, i) => (
                <Card key={i}>
                  <CardContent className="py-4 text-sm tabular-nums">
                    <p className="font-medium">{p.packageName}</p>
                    <p className="text-muted-foreground mt-1">
                      {p.creditsRemaining} of {p.creditsTotal} sessions left
                    </p>
                  </CardContent>
                </Card>
              ))}
            </section>
          ) : null}

          <div className="flex flex-col gap-2 sticky top-20">
            {next ? (
              <Button asChild className="w-full gap-2 min-h-[44px]">
                <Link href={next.manageUrl}>
                  <MessageSquare className="h-4 w-4" />
                  Manage visit
                </Link>
              </Button>
            ) : (
              <Button asChild variant="secondary" className="w-full gap-2 min-h-[44px]">
                <a href={data.bookUrl}>
                  <CalendarCheck className="h-4 w-4" />
                  {GUEST_HUB_COPY.bookAgainCta}
                </a>
              </Button>
            )}
            <Button asChild variant="ghost" className="w-full text-muted-foreground gap-2">
              <Link href="/my">
                <Heart className="h-4 w-4" />
                All studios
              </Link>
            </Button>
          </div>

          <GuestHubLivChat hubToken={hubToken} variant="inline" />
        </aside>
      </div>
    </GuestHubShell>
  );
}
