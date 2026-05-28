import { useCallback, useEffect, useState } from "react";
import { useBusiness } from "@/lib/business-context";
import { customFetch } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardCheck, FileHeart, ListOrdered } from "lucide-react";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";

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

type WaitlistRow = {
  id: string;
  phone: string | null;
  email: string | null;
  serviceId: string | null;
  createdAt: string;
};

export default function MedspaHubPage() {
  const { business } = useBusiness();
  const bid = business?.id ?? "";
  const [loading, setLoading] = useState(true);
  const [consents, setConsents] = useState<ConsentRow[]>([]);
  const [intakes, setIntakes] = useState<IntakeRow[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistRow[]>([]);
  const [signId, setSignId] = useState<string | null>(null);
  const [signature, setSignature] = useState("");

  const load = useCallback(async () => {
    if (!bid) return;
    setLoading(true);
    try {
      const [c, i, w] = await Promise.all([
        customFetch<{ data: ConsentRow[] }>(`/api/businesses/${bid}/medspa/consents/pending`),
        customFetch<{ data: IntakeRow[] }>(`/api/businesses/${bid}/medspa/intakes/review-queue`),
        customFetch<{ data: WaitlistRow[] }>(`/api/businesses/${bid}/waitlist`),
      ]);
      setConsents(c.data);
      setIntakes(i.data);
      setWaitlist(w.data);
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
        <p className="text-muted-foreground">
          Clinical hub is for medspa verticals. Switch business or update vertical in settings.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Clinical hub</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Consent queue, intake review, and slot waitlist — counsel-reviewed copy ships from policy
          packs.
        </p>
      </div>

      <Tabs defaultValue="consents">
        <TabsList>
          <TabsTrigger value="consents" className="gap-2">
            <ClipboardCheck className="h-4 w-4" />
            Consents
            {consents.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {consents.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="intakes" className="gap-2">
            <FileHeart className="h-4 w-4" />
            Intakes
          </TabsTrigger>
          <TabsTrigger value="waitlist" className="gap-2">
            <ListOrdered className="h-4 w-4" />
            Waitlist
          </TabsTrigger>
        </TabsList>

        <TabsContent value="consents" className="mt-4 space-y-3">
          {loading ? (
            <Skeleton className="h-32 w-full" />
          ) : consents.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                No pending consents — web bookings sign at checkout.
              </CardContent>
            </Card>
          ) : (
            consents.map((row) => (
              <Card key={row.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{row.procedureLabel}</CardTitle>
                  <CardDescription>
                    Customer {row.customerId.slice(-6)}
                    {row.bookingId ? (
                      <>
                        {" "}
                        ·{" "}
                        <Link href={`/bookings/${row.bookingId}`} className="text-primary underline">
                          Booking
                        </Link>
                      </>
                    ) : null}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {signId === row.id ? (
                    <>
                      <Input
                        value={signature}
                        onChange={(e) => setSignature(e.target.value)}
                        placeholder="Client legal name"
                      />
                      <Button size="sm" onClick={() => void signConsent(row.id, row.bookingId)}>
                        Record signature
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setSignId(null)}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => setSignId(row.id)}>
                      Sign in clinic
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="intakes" className="mt-4 space-y-3">
          {loading ? (
            <Skeleton className="h-32 w-full" />
          ) : intakes.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                No intakes awaiting review.
              </CardContent>
            </Card>
          ) : (
            intakes.map((row) => (
              <Card key={row.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Medical intake</CardTitle>
                  <CardDescription>
                    {row.allergies ? `Allergies: ${row.allergies}` : "—"}
                    {row.medications ? ` · Meds: ${row.medications}` : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button size="sm" onClick={() => void markIntakeReviewed(row.id)}>
                    Mark reviewed
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="waitlist" className="mt-4 space-y-3">
          {loading ? (
            <Skeleton className="h-32 w-full" />
          ) : waitlist.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                Waitlist empty — cancellations auto-offer via workflow.
              </CardContent>
            </Card>
          ) : (
            waitlist.map((row) => (
              <Card key={row.id}>
                <CardContent className="py-4 flex justify-between items-center">
                  <div className="text-sm">
                    {row.phone ?? row.email ?? "Contact on file"}
                    <p className="text-xs text-muted-foreground">
                      Joined {new Date(row.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant="outline">Active</Badge>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
