import { useEffect, useState } from "react";
import { useBusiness } from "@/lib/business-context";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { customFetch } from "@workspace/api-client-react";
import { FileText, RotateCcw } from "lucide-react";
import type { OperationalPolicy } from "@workspace/policy";

type GuestPolicyPayload = {
  policy: OperationalPolicy;
  bookingTermsBlock: string;
  bookingTermsTemplate: string;
  privacyNoticeBlock: string;
  houseRulesBlock: string;
  guestPolicyTemplates: {
    bookingTerms: string;
    privacyNotice: string;
    houseRules: string;
  };
};

type DocKey = "bookingTermsCustom" | "privacyNoticeCustom" | "houseRulesCustom";

const DOC_META: Record<
  DocKey,
  { title: string; description: string; templateKey: keyof GuestPolicyPayload["guestPolicyTemplates"] }
> = {
  bookingTermsCustom: {
    title: "Booking terms",
    description: "Shown at checkout on your public booking page.",
    templateKey: "bookingTerms",
  },
  privacyNoticeCustom: {
    title: "Guest privacy notice",
    description: "How you handle customer data — guests may see this on your storefront.",
    templateKey: "privacyNotice",
  },
  houseRulesCustom: {
    title: "House rules",
    description: "Parking, walk-ins, treatment prep, and other day-to-day notes for your team.",
    templateKey: "houseRules",
  },
};

export function GuestPoliciesPanel({ editable = true }: { editable?: boolean }) {
  const { business } = useBusiness();
  const { toast } = useToast();
  const bid = business?.id ?? "";
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [state, setState] = useState<GuestPolicyPayload | null>(null);

  async function load() {
    if (!bid) return;
    setLoading(true);
    try {
      const data = await customFetch<GuestPolicyPayload>(
        `/api/businesses/${bid}/operational-policy`,
      );
      setState(data);
    } catch {
      setState(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [bid]);

  function setCustomField(key: DocKey, value: string) {
    if (!state) return;
    setState({
      ...state,
      policy: { ...state.policy, [key]: value || undefined },
    });
  }

  async function applyTemplate(key: DocKey) {
    if (!bid || !state) return;
    const meta = DOC_META[key];
    const templateText = state.guestPolicyTemplates[meta.templateKey];
    setSaving(true);
    try {
      const nextPolicy = { ...state.policy, [key]: templateText };
      const data = await customFetch<GuestPolicyPayload>(
        `/api/businesses/${bid}/operational-policy`,
        {
          method: "PATCH",
          body: JSON.stringify({
            policy: {
              bookingTermsCustom: nextPolicy.bookingTermsCustom,
              privacyNoticeCustom: nextPolicy.privacyNoticeCustom,
              houseRulesCustom: nextPolicy.houseRulesCustom,
            },
          }),
        },
      );
      setState(data);
      toast({
        title: `${meta.title} updated`,
        description: "Template applied — edit the text anytime.",
      });
    } catch (e) {
      toast({
        title: "Could not apply template",
        description: e instanceof Error ? e.message : undefined,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function save() {
    if (!bid || !state) return;
    setSaving(true);
    try {
      const data = await customFetch<GuestPolicyPayload>(
        `/api/businesses/${bid}/operational-policy`,
        {
          method: "PATCH",
          body: JSON.stringify({
            policy: {
              bookingTermsCustom: state.policy.bookingTermsCustom,
              privacyNoticeCustom: state.policy.privacyNoticeCustom,
              houseRulesCustom: state.policy.houseRulesCustom,
            },
          }),
        },
      );
      setState(data);
      toast({ title: "Policies saved", description: "Your storefront and booking flow use these now." });
    } catch (e) {
      toast({
        title: "Could not save policies",
        description: e instanceof Error ? e.message : undefined,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  if (!bid) return null;
  if (loading && !state) return <Skeleton className="h-64 w-full" />;
  if (!state) {
    return (
      <p className="text-sm text-muted-foreground">
        Could not load guest policies. Check you are signed in as an admin.
      </p>
    );
  }

  return (
    <Card data-testid="guest-policies-panel">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-4 w-4" />
          Your guest policies
        </CardTitle>
        <CardDescription>
          One place for booking terms, privacy, and house rules — templates are prefilled from your
          country and vertical; edit anything that needs to match how you actually run.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {(Object.keys(DOC_META) as DocKey[]).map((key) => {
          const meta = DOC_META[key];
          const value = state.policy[key] ?? "";
          const livePreview =
            key === "bookingTermsCustom"
              ? state.bookingTermsBlock
              : key === "privacyNoticeCustom"
                ? state.privacyNoticeBlock
                : state.houseRulesBlock || state.guestPolicyTemplates.houseRules;
          const usingTemplate = !value.trim();

          return (
            <div key={key} className="space-y-2 rounded-lg border border-border/80 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <Label className="text-sm font-medium">{meta.title}</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">{meta.description}</p>
                </div>
                {editable ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-8 shrink-0"
                    onClick={() => void applyTemplate(key)}
                    disabled={saving}
                  >
                    <RotateCcw className="h-3.5 w-3.5 mr-1" />
                    Use template
                  </Button>
                ) : null}
              </div>
              <Textarea
                value={value}
                rows={key === "houseRulesCustom" ? 5 : 4}
                disabled={!editable}
                placeholder={state.guestPolicyTemplates[meta.templateKey]}
                onChange={(e) => setCustomField(key, e.target.value)}
                data-testid={`guest-policy-${key}`}
              />
              <p className="text-[11px] text-muted-foreground">
                {usingTemplate ? "Using template" : "Custom text"}
                {livePreview ? (
                  <>
                    {" "}
                    · Live:{" "}
                    <span className="text-foreground/80">
                      {livePreview.length > 120 ? `${livePreview.slice(0, 120)}…` : livePreview}
                    </span>
                  </>
                ) : null}
              </p>
            </div>
          );
        })}

        {editable ? (
          <Button onClick={() => void save()} disabled={saving} data-testid="guest-policies-save">
            {saving ? "Saving…" : "Save guest policies"}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
