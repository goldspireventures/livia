import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { OnboardingLivRehearsalPreview } from "@/components/onboarding/onboarding-liv-rehearsal-preview";
import { cn } from "@/lib/utils";

const TONES = [
  { value: "FRIENDLY", label: "Warm" },
  { value: "PROFESSIONAL", label: "Professional" },
  { value: "PLAYFUL", label: "Playful" },
] as const;

type Props = {
  businessName: string;
  aiEnabled: boolean;
  aiTone: string;
  aiGreeting: string;
  saving: boolean;
  onEnabledChange: (v: boolean) => void;
  onToneChange: (v: string) => void;
  onGreetingChange: (v: string) => void;
  onSave: () => void;
  hideSaveButton?: boolean;
};

/** A6 — conversational “reply to Liv”, not a settings form. */
export function OnboardingLivReplyStep({
  businessName,
  aiEnabled,
  aiTone,
  aiGreeting,
  saving,
  onEnabledChange,
  onToneChange,
  onGreetingChange,
  onSave,
  hideSaveButton = false,
}: Props) {
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_minmax(200px,240px)]" data-testid="onboarding-liv-form">
      <div className="space-y-6">
        <div className="space-y-3">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            How should I greet people?
          </Label>
          <Textarea
            value={aiGreeting}
            onChange={(e) => onGreetingChange(e.target.value)}
            placeholder="Hi! I'm Liv — how can I help you book today?"
            rows={4}
            className="text-base resize-none border-primary/20 bg-background/60 focus-visible:ring-primary/30"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Tone</Label>
          <div className="flex flex-wrap gap-2">
            {TONES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => onToneChange(t.value)}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  aiTone === t.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border/40">
          <span className="text-sm text-muted-foreground">Liv answers when you&apos;re busy</span>
          <Switch checked={aiEnabled} onCheckedChange={onEnabledChange} />
        </div>

        {!hideSaveButton ? (
          <Button type="button" onClick={onSave} disabled={saving} className="w-full sm:w-auto">
            {saving ? "Saving…" : "Save & continue"}
          </Button>
        ) : null}
      </div>

      <OnboardingLivRehearsalPreview
        businessName={businessName}
        greeting={aiGreeting}
        tone={aiTone}
        className="lg:sticky lg:top-4 lg:self-start"
      />
    </div>
  );
}
