import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { applyVerticalTheme } from "@/lib/vertical-theme";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import {
  PublicSurfaceFooter,
  PublicSurfaceLoading,
  PublicSurfaceNotFound,
} from "@/components/public/public-surface-chrome";

type IntakePayload = {
  intakeId: string;
  businessName: string;
  slug: string;
  vertical: string | null;
  status: string;
  customerFirstName: string | null;
  allergies: string | null;
  medications: string | null;
  conditions: string | null;
  priorProcedures: string | null;
  notes: string | null;
  logoUrl: string | null;
};

export default function PublicIntakePage() {
  const { slug, token } = useParams<{ slug: string; token: string }>();
  const [data, setData] = useState<IntakePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    allergies: "",
    medications: "",
    conditions: "",
    priorProcedures: "",
    notes: "",
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!slug || !token) return;
    setLoading(true);
    fetch(`/api/public/b/${slug}/intake/${token}`)
      .then(async (r) => {
        if (!r.ok) throw new Error("not found");
        return r.json() as Promise<IntakePayload>;
      })
      .then((d) => {
        setData(d);
        applyVerticalTheme(d.vertical, null);
        setForm({
          allergies: d.allergies ?? "",
          medications: d.medications ?? "",
          conditions: d.conditions ?? "",
          priorProcedures: d.priorProcedures ?? "",
          notes: d.notes ?? "",
        });
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
    return () => {
      document.documentElement.removeAttribute("data-vertical");
    };
  }, [slug, token]);

  async function submit() {
    if (!slug || !token) return;
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch(`/api/public/b/${slug}/intake/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error ?? "Could not submit");
      }
      setMessage("Intake submitted — the clinic will review before your appointment.");
      setData((d) => (d ? { ...d, status: "submitted" } : d));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Try again");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <PublicSurfaceLoading />;
  if (!data) {
    return (
      <PublicSurfaceNotFound
        title="Intake link not found"
        detail="This link is invalid or has expired. Contact the clinic if you need help."
      />
    );
  }

  const readOnly = data.status !== "draft";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 max-w-lg mx-auto w-full p-4 pb-8 space-y-4">
        <div className="text-center space-y-1 pt-4">
          {data.logoUrl ? (
            <img src={data.logoUrl} alt="" className="h-12 mx-auto rounded-lg object-contain" />
          ) : null}
          <h1 className="text-xl font-semibold">{data.businessName}</h1>
          <p className="text-sm text-muted-foreground">Medical intake — secure guest form</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {readOnly ? "Your submitted intake" : "Complete your intake"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(["allergies", "medications", "conditions", "priorProcedures", "notes"] as const).map(
              (field) => (
                <div key={field} className="space-y-1.5">
                  <Label className="capitalize">{field.replace(/([A-Z])/g, " $1")}</Label>
                  <Textarea
                    value={form[field]}
                    onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                    disabled={readOnly || busy}
                    rows={field === "notes" ? 3 : 2}
                  />
                </div>
              ),
            )}
            {message ? <p className="text-sm text-green-600">{message}</p> : null}
            {err ? <p className="text-sm text-destructive">{err}</p> : null}
            {!readOnly ? (
              <Button className="w-full" onClick={submit} disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit intake"}
              </Button>
            ) : null}
          </CardContent>
        </Card>
      </main>
      <PublicSurfaceFooter />
    </div>
  );
}
