import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { customFetch } from "@workspace/api-client-react";
import {
  LIV_OUTBOUND_TEMPLATE_VARS,
  type LivOutboundCopyKey,
} from "@workspace/policy";
import { SettingsDisclosure } from "@/components/ui/settings-disclosure";

type Field = {
  key: LivOutboundCopyKey;
  label: string;
  hint: string;
  defaultTemplate: string;
};

type Props = {
  businessId: string;
  onSaved?: () => void;
};

export function LivOutboundTemplatesSection({ businessId, onSaved }: Props) {
  const [fields, setFields] = useState<Field[]>([]);
  const [overrides, setOverrides] = useState<Partial<Record<LivOutboundCopyKey, string>>>({});
  const [title, setTitle] = useState("Message templates");
  const [subtitle, setSubtitle] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!businessId) return;
    void customFetch<{
      fields: Field[];
      overrides: Partial<Record<LivOutboundCopyKey, string>>;
      sectionTitle?: string;
      sectionSubtitle?: string;
    }>(`/api/businesses/${businessId}/liv-outbound`)
      .then((view) => {
        setFields(view.fields);
        setOverrides(view.overrides ?? {});
        setTitle(view.sectionTitle ?? "Message templates");
        setSubtitle(view.sectionSubtitle ?? "");
      })
      .catch(() => setFields([]));
  }, [businessId]);

  async function save() {
    if (!businessId) return;
    setBusy(true);
    try {
      await customFetch(`/api/businesses/${businessId}/liv-outbound`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(overrides),
      });
      onSaved?.();
    } finally {
      setBusy(false);
    }
  }

  if (!fields.length) return null;

  return (
    <div className="rounded-xl border bg-card/60 p-4 space-y-4" data-testid="liv-outbound-templates">
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        <p className="text-[10px] text-muted-foreground mt-2">
          Variables: {LIV_OUTBOUND_TEMPLATE_VARS.join(", ")}
        </p>
      </div>

      <div className="space-y-2">
        {fields.map((field) => (
          <SettingsDisclosure
            key={field.key}
            title={field.label}
            description={field.hint}
            defaultOpen={false}
            data-testid={`liv-template-disclosure-${field.key}`}
          >
            <div className="space-y-2 pt-2">
              <div className="flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="text-xs h-7"
                  onClick={() =>
                    setOverrides((prev) => ({
                      ...prev,
                      [field.key]: field.defaultTemplate,
                    }))
                  }
                >
                  Reset to default
                </Button>
              </div>
              <Textarea
                value={overrides[field.key] ?? ""}
                onChange={(e) =>
                  setOverrides((prev) => ({
                    ...prev,
                    [field.key]: e.target.value,
                  }))
                }
                rows={field.key === "decline_reply" ? 8 : 5}
                placeholder={field.defaultTemplate}
                data-testid={`liv-template-${field.key}`}
              />
            </div>
          </SettingsDisclosure>
        ))}
      </div>

      <Button type="button" onClick={() => void save()} disabled={busy} data-testid="liv-outbound-save">
        {busy ? "Saving…" : "Save templates"}
      </Button>
    </div>
  );
}
