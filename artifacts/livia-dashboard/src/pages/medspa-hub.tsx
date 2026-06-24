import { useCallback, useEffect, useState } from "react";
import { useBusiness } from "@/lib/business-context";
import { customFetch } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardCheck, FileHeart } from "lucide-react";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { OperationalPageShell } from "@/components/layout/operational-page-shell";
import { resolveMedspaHubDefaultTab, type MedspaHubTab } from "@workspace/policy";

type ConsentRow = {
  id: string;
  procedureLabel: string;
  customerId: string;
  bookingId: string | null;
  status: string;
  createdAt: string;
};

type IntakeRow = {
  id: string;
  customerId: string;
  allergies: string | null;
  medications: string | null;
  conditions: string | null;
  submittedAt: string | null;
};

function EmptyTab({ message }: { message: string }) {
  return (
    <p className="text-sm text-muted-foreground text-center py-8 rounded-lg border border-dashed border-border/70 bg-muted/20">
      {message}
    </p>
  );
}

export default function MedspaHubPage() {
  const { business } = useBusiness();
  const bid = business?.id ?? "";
  const [loading, setLoading] = useState(true);
  const [consents, setConsents] = useState<ConsentRow[]>([]);
  const [intakes, setIntakes] = useState<IntakeRow[]>([]);
  const [signId, setSignId] = useState<string | null>(null);
  const [signature, setSignature] = useState("");
  const [activeTab, setActiveTab] = useState<MedspaHubTab>("consents");

  const load = useCallback(async () => {
    if (!bid) return;
    setLoading(true);
    try {
      const [c, i] = await Promise.all([
        customFetch<{ data: ConsentRow[] }>(`/api/businesses/${bid}/medspa/consents/pending`),
        customFetch<{ data: IntakeRow[] }>(`/api/businesses/${bid}/medspa/intakes/review-queue`),
      ]);
      setConsents(c.data);
      setIntakes(i.data);
      setActiveTab(
        resolveMedspaHubDefaultTab({
          consents: c.data.length,
          intakes: i.data.length,
        }),
      );
    } finally {
      setLoading(false);
    }
  }, [bid]);

  useEffect(() => {
    void load();
  }, [load]);

  async function markIntakeReviewed(intakeId: string) {
    await customFetch(`/api/businesses/${bid}/medspa/intakes/${intakeId}/reviewed`, {
      method: "PATCH",
    });
    void load();
  }

  async function signConsent(consentId: string, bookingId: string | null) {
    if (!signature.trim()) return;
    await customFetch(`/api/businesses/${bid}/medspa/consents/${consentId}/sign`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        signatureName: signature.trim(),
        bookingId: bookingId ?? undefined,
      }),
    });
    setSignId(null);
    setSignature("");
    void load();
  }

  const vertical = (business as { vertical?: string } | undefined)?.vertical;
  if (vertical !== "medspa") {
    return (
      <div className="p-6 max-w-lg">
        <p className="text-muted-foreground text-sm">
          Clinical hub is for medspa verticals. Switch business or update vertical in settings.
        </p>
      </div>
    );
  }

  return (
    <OperationalPageShell
      title="Clinical hub"
      subtitle="Consents and intake review — open the tab with work waiting. Slot waitlist is on Today via Liv."
      width="lg"
    >
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as MedspaHubTab)}
        data-testid="medspa-hub-page"
      >
        <TabsList className="h-auto flex-wrap gap-1">
          <TabsTrigger value="consents" className="gap-1.5 text-xs">
            <ClipboardCheck className="h-3.5 w-3.5" />
            Consents
            {consents.length > 0 ? (
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                {consents.length}
              </Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="intakes" className="gap-1.5 text-xs">
            <FileHeart className="h-3.5 w-3.5" />
            Intakes
            {intakes.length > 0 ? (
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                {intakes.length}
              </Badge>
            ) : null}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="consents" className="mt-3 space-y-2">
          {loading ? (
            <Skeleton className="h-24 w-full" />
          ) : consents.length === 0 ? (
            <EmptyTab message="No pending consents — web bookings sign at checkout." />
          ) : (
            consents.map((row) => (
              <div
                key={row.id}
                className="rounded-lg border border-border/80 bg-card px-3 py-3 space-y-2"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{row.procedureLabel}</p>
                    <p className="text-xs text-muted-foreground">
                      Customer …{row.customerId.slice(-6)}
                      {row.bookingId ? (
                        <>
                          {" · "}
                          <Link href={`/bookings/${row.bookingId}`} className="text-primary underline">
                            Booking
                          </Link>
                        </>
                      ) : null}
                    </p>
                  </div>
                </div>
                {signId === row.id ? (
                  <div className="flex flex-wrap gap-2">
                    <Input
                      value={signature}
                      onChange={(e) => setSignature(e.target.value)}
                      placeholder="Client legal name"
                      className="h-9 max-w-xs"
                    />
                    <Button size="sm" onClick={() => void signConsent(row.id, row.bookingId)}>
                      Record signature
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setSignId(null)}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" className="h-8" onClick={() => setSignId(row.id)}>
                    Sign in clinic
                  </Button>
                )}
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="intakes" className="mt-3 space-y-2">
          {loading ? (
            <Skeleton className="h-24 w-full" />
          ) : intakes.length === 0 ? (
            <EmptyTab message="No intakes awaiting review." />
          ) : (
            intakes.map((row) => (
              <div
                key={row.id}
                className="rounded-lg border border-border/80 bg-card px-3 py-3 flex flex-wrap items-center justify-between gap-2"
              >
                <div className="min-w-0 text-sm">
                  <p className="font-medium">Medical intake</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {row.allergies ? `Allergies: ${row.allergies}` : "—"}
                    {row.medications ? ` · Meds: ${row.medications}` : ""}
                  </p>
                </div>
                <Button size="sm" className="h-8 shrink-0" onClick={() => void markIntakeReviewed(row.id)}>
                  Mark reviewed
                </Button>
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </OperationalPageShell>
  );
}
