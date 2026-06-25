import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { Mail } from "lucide-react";
import { OWNERSHIP_SUCCESSION, LIVIA_FORM_EXAMPLES } from "@workspace/policy";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiFetch, ApiFetchError } from "@/lib/api-fetch";

const copy = OWNERSHIP_SUCCESSION.successionInvite;

type Form = {
  email: string;
  role: "ADMIN" | "STAFF";
};

type Props = {
  businessId: string;
  onSent?: () => void;
};

/** G8 — invite future owner from Ownership tab only (not Staff → Invite). */
export function OwnershipSuccessionInvite({ businessId, onSent }: Props) {
  const { toast } = useToast();
  const [sending, setSending] = useState(false);
  const { register, handleSubmit, control, reset } = useForm<Form>({
    defaultValues: { email: "", role: "ADMIN" },
  });

  const onSubmit = async (vals: Form) => {
    setSending(true);
    try {
      await apiFetch(`/businesses/${businessId}/ownership-invitations`, {
        method: "POST",
        body: JSON.stringify(vals),
      });
      toast({
        title: copy.successTitle,
        description: copy.successBody,
      });
      reset({ email: "", role: "ADMIN" });
      onSent?.();
    } catch (err: unknown) {
      const e = err as ApiFetchError;
      const msg =
        e?.code === "CLERK_NOT_CONFIGURED"
          ? "Invitations need server config (CLERK_SECRET_KEY)."
          : e?.message ?? copy.error;
      toast({ title: copy.error, description: msg, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="rounded-lg border border-primary/25 bg-primary/5 px-3 py-3 space-y-3"
      data-testid="ownership-succession-invite"
    >
      <div>
        <p className="text-sm font-medium flex items-center gap-2">
          <Mail className="h-4 w-4 text-primary" aria-hidden />
          {copy.title}
        </p>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{copy.body}</p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="succession-invite-email">{copy.emailLabel}</Label>
          <Input
            id="succession-invite-email"
            type="email"
            placeholder={LIVIA_FORM_EXAMPLES.partnerEmail}
            data-testid="ownership-invite-email"
            {...register("email", { required: true })}
          />
        </div>
        <div className="space-y-2">
          <Label>{copy.roleLabel}</Label>
          <Controller
            control={control}
            name="role"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger data-testid="ownership-invite-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">{copy.roleAdmin}</SelectItem>
                  <SelectItem value="STAFF">{copy.roleStaff}</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <Button type="submit" disabled={sending} data-testid="ownership-invite-send">
          {sending ? copy.sending : copy.cta}
        </Button>
      </form>
      <p className="text-[11px] text-muted-foreground leading-relaxed">
        {OWNERSHIP_SUCCESSION.teamInviteNote}
      </p>
    </div>
  );
}
