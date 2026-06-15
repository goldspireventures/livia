import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { useGuestBookTokenRoute } from "@/lib/use-guest-book-slug";
import { clientGuestBookHref } from "@/lib/guest-book-url";
import {
  warmPublicGuestSurfaceTheme,
  clearPublicGuestSurfaceTheme,
  type PublicGuestExperienceSkin,
} from "@/lib/apply-public-guest-theme";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Loader2, MessageCircle } from "lucide-react";
import { PublicSurfaceNotFound } from "@/components/public/public-surface-chrome";
import { PublicIntakeLoading } from "@/components/public/public-intake-loading";
import { usePublicGuestPwa } from "@/lib/public-guest-pwa";

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
  experienceSkin?: PublicGuestExperienceSkin;
};

type YesNo = "yes" | "no" | null;

const INTAKE_INTRO = `Before your treatment, please complete this intake form. Your practitioner will review your answers before your appointment.

This form is not medical advice and does not replace an in-person consultation.`;

function YesNoField({
  id,
  label,
  value,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  value: YesNo;
  onChange: (v: YesNo) => void;
  disabled?: boolean;
}) {
  return (
    <fieldset className="space-y-2" disabled={disabled}>
      <legend className="text-[15px] font-medium leading-snug">{label}</legend>
      <div className="flex gap-2">
        {(["yes", "no"] as const).map((opt) => (
          <Button
            key={opt}
            type="button"
            variant={value === opt ? "default" : "outline"}
            size="sm"
            className="min-h-[44px] flex-1 capitalize"
            onClick={() => onChange(opt)}
            data-testid={`${id}-${opt}`}
          >
            {opt}
          </Button>
        ))}
      </div>
    </fieldset>
  );
}

export default function PublicIntakePage() {
  const { slug, token } = useGuestBookTokenRoute("intake");
  const [data, setData] = useState<IntakePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [allergies, setAllergies] = useState("");
  const [medications, setMedications] = useState("");
  const [conditions, setConditions] = useState("");
  const [priorProcedures, setPriorProcedures] = useState("");
  const [notes, setNotes] = useState("");
  const [pregnant, setPregnant] = useState<YesNo>(null);
  const [bloodThinners, setBloodThinners] = useState<YesNo>(null);
  const [over18, setOver18] = useState(false);
  const [understood, setUnderstood] = useState(false);
  const [accurate, setAccurate] = useState(false);
  const [signatureName, setSignatureName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  usePublicGuestPwa(slug);

  useLayoutEffect(() => {
    if (!slug) return;
    void warmPublicGuestSurfaceTheme({ slug });
    return () => clearPublicGuestSurfaceTheme();
  }, [slug]);

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
        void warmPublicGuestSurfaceTheme({
          slug: d.slug ?? slug,
          vertical: d.vertical,
          experienceSkin: d.experienceSkin,
        });
        setAllergies(d.allergies ?? "");
        setMedications(d.medications ?? "");
        setConditions(d.conditions ?? "");
        setPriorProcedures(d.priorProcedures ?? "");
        setNotes(d.notes ?? "");
        if (d.customerFirstName) setSignatureName(d.customerFirstName);
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [slug, token]);

  const readOnly = data?.status !== "draft";
  const bookUrl = data ? clientGuestBookHref(data.slug) : "#";

  const canSubmit = useMemo(() => {
    if (readOnly || busy) return false;
    return (
      over18 &&
      understood &&
      accurate &&
      signatureName.trim().length > 1 &&
      pregnant !== null &&
      bloodThinners !== null
    );
  }, [readOnly, busy, over18, understood, accurate, signatureName, pregnant, bloodThinners]);

  async function submit() {
    if (!slug || !token || !canSubmit) return;
    setBusy(true);
    setErr(null);

    const toggleLines: string[] = [];
    if (pregnant === "yes") toggleLines.push("Pregnant or breastfeeding: Yes");
    if (pregnant === "no") toggleLines.push("Pregnant or breastfeeding: No");
    if (bloodThinners === "yes") toggleLines.push("Blood thinners: Yes");
    if (bloodThinners === "no") toggleLines.push("Blood thinners: No");

    const signedAt = new Date().toISOString().slice(0, 10);
    const payload = {
      allergies: allergies.trim(),
      medications: [medications.trim(), toggleLines.find((l) => l.startsWith("Blood"))].filter(Boolean).join("\n"),
      conditions: [conditions.trim(), toggleLines.find((l) => l.startsWith("Pregnant"))].filter(Boolean).join("\n"),
      priorProcedures: priorProcedures.trim(),
      notes: [
        notes.trim(),
        `Signed: ${signatureName.trim()} (${signedAt})`,
      ]
        .filter(Boolean)
        .join("\n\n"),
    };

    try {
      const r = await fetch(`/api/public/b/${slug}/intake/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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

  if (loading) return <PublicIntakeLoading />;

  if (!data) {
    return (
      <PublicSurfaceNotFound
        title="Intake link not found"
        detail="This link is invalid or has expired. Contact the clinic if you need help."
      />
    );
  }

  return (
    <div
      className="min-h-screen bg-[#fafafa] text-foreground public-intake-shell"
      data-testid="guest-intake-page"
    >
      <header className="sticky top-0 z-30 border-b border-border/60 bg-[#fafafa]/95 backdrop-blur-md px-4 py-3">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Medical intake</p>
        <p className="text-base font-semibold truncate">{data.businessName}</p>
      </header>

      <main className={`max-w-xl mx-auto px-5 py-6 ${readOnly ? "pb-10" : "pb-36"}`}>
        {data.customerFirstName ? (
          <p className="text-sm text-muted-foreground mb-4">
            Hi {data.customerFirstName} — please complete the form below.
          </p>
        ) : null}

        <section
          className="rounded-xl border border-border/70 bg-white p-4 max-h-[40vh] overflow-y-auto text-sm leading-relaxed mb-6"
          data-testid="guest-intake-consent-block"
        >
          <p className="whitespace-pre-wrap font-[family-name:var(--app-font-serif,ui-serif,Georgia)]">
            {INTAKE_INTRO}
          </p>
        </section>

        {message ? (
          <div className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm flex gap-2 mb-6">
            <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            {message}
          </div>
        ) : null}

        {readOnly ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Consent recorded — your clinic has your intake on file.
          </p>
        ) : (
          <div className="space-y-6">
            <section className="space-y-4" data-testid="guest-intake-contraindications">
              <h2 className="text-[13px] uppercase tracking-widest text-muted-foreground font-medium">
                Health questions
              </h2>
              <YesNoField
                id="intake-pregnant"
                label="Are you pregnant or breastfeeding?"
                value={pregnant}
                onChange={setPregnant}
                disabled={busy}
              />
              <YesNoField
                id="intake-blood-thinners"
                label="Are you taking blood thinners?"
                value={bloodThinners}
                onChange={setBloodThinners}
                disabled={busy}
              />
              <div className="space-y-1.5">
                <Label htmlFor="intake-allergies">Allergies</Label>
                <Textarea
                  id="intake-allergies"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  rows={2}
                  placeholder="List any known allergies"
                  disabled={busy}
                  data-testid="intake-allergies"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="intake-medications">Current medications</Label>
                <Textarea
                  id="intake-medications"
                  value={medications}
                  onChange={(e) => setMedications(e.target.value)}
                  rows={2}
                  disabled={busy}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="intake-conditions">Medical conditions</Label>
                <Textarea
                  id="intake-conditions"
                  value={conditions}
                  onChange={(e) => setConditions(e.target.value)}
                  rows={2}
                  disabled={busy}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="intake-prior">Prior procedures (optional)</Label>
                <Textarea
                  id="intake-prior"
                  value={priorProcedures}
                  onChange={(e) => setPriorProcedures(e.target.value)}
                  rows={2}
                  disabled={busy}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="intake-notes">Anything else we should know?</Label>
                <Textarea
                  id="intake-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  disabled={busy}
                />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                This is not medical advice — your practitioner will review your answers.
              </p>
            </section>

            <section className="space-y-3 border-t border-border/60 pt-6">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="intake-over18"
                  checked={over18}
                  onCheckedChange={(v) => setOver18(v === true)}
                  disabled={busy}
                  data-testid="intake-checkbox-over18"
                />
                <Label htmlFor="intake-over18" className="text-sm leading-snug font-normal cursor-pointer">
                  I confirm I am over 18
                </Label>
              </div>
              <div className="flex items-start gap-3">
                <Checkbox
                  id="intake-understood"
                  checked={understood}
                  onCheckedChange={(v) => setUnderstood(v === true)}
                  disabled={busy}
                  data-testid="intake-checkbox-understood"
                />
                <Label htmlFor="intake-understood" className="text-sm leading-snug font-normal cursor-pointer">
                  I have read and understand the intake questions
                </Label>
              </div>
              <div className="flex items-start gap-3">
                <Checkbox
                  id="intake-accurate"
                  checked={accurate}
                  onCheckedChange={(v) => setAccurate(v === true)}
                  disabled={busy}
                  data-testid="intake-checkbox-accurate"
                />
                <Label htmlFor="intake-accurate" className="text-sm leading-snug font-normal cursor-pointer">
                  I confirm the information I provide is accurate
                </Label>
              </div>
              <div className="space-y-1.5 pt-2">
                <Label htmlFor="intake-signature">Full legal name (signature) *</Label>
                <Input
                  id="intake-signature"
                  value={signatureName}
                  onChange={(e) => setSignatureName(e.target.value)}
                  placeholder="Jane Smith"
                  disabled={busy}
                  data-testid="intake-signature"
                />
              </div>
            </section>

            {err ? <p className="text-sm text-rose-600">{err}</p> : null}
          </div>
        )}

        {readOnly && (
          <div className="mt-8 text-center">
            <Button asChild variant="outline">
              <Link href={bookUrl}>Back to booking</Link>
            </Button>
          </div>
        )}
      </main>

      {!readOnly ? (
        <div className="fixed bottom-0 inset-x-0 z-40 border-t border-border/70 bg-[#fafafa]/95 backdrop-blur-md px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="max-w-xl mx-auto space-y-2">
            <Button
              type="button"
              className="w-full min-h-[52px]"
              disabled={!canSubmit}
              onClick={() => void submit()}
              data-testid="intake-submit"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit intake"}
            </Button>
            <Link
              href={bookUrl}
              className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground min-h-[44px]"
              data-testid="intake-message-clinic"
            >
              <MessageCircle className="h-4 w-4" aria-hidden />
              Questions? Message the clinic
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
