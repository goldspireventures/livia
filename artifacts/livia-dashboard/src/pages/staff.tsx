import { useState } from "react";
import { Link } from "wouter";
import { useBusiness } from "@/lib/business-context";
import {
  useListStaff,
  getListStaffQueryKey,
  useCreateStaff,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UsersRound, UserPlus, ChevronRight, Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { useMembership } from "@/lib/membership-context";
import {
  OWNERSHIP_SUCCESSION,
  STAFF_INVITE_JOBS,
  rosterMemberRoleLabel,
  staffInviteJobToMembership,
  type StaffInviteJobKind,
  verticalOperationalCopy,
  LIVIA_FORM_EXAMPLES,
} from "@workspace/policy";
import { getStaffInviteRedirectUrl } from "@/lib/staff-invite-redirect";
import { useOperationalChrome } from "@/lib/operational-chrome";
import { apiFetch, ApiFetchError } from "@/lib/api-fetch";
import { useMutation } from "@tanstack/react-query";
import { invalidateOperationalState } from "@/lib/operational-cache";
import { OperationalPageShell } from "@/components/layout/operational-page-shell";
import { cn } from "@/lib/utils";
import { onContainedScrollWheel } from "@/lib/use-contained-scroll";

interface StaffForm {
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  phone: string;
}

interface InviteForm {
  email: string;
  job: StaffInviteJobKind;
}

function InviteDialog({
  businessId,
  outlineButton,
  inviteCta,
}: {
  businessId: string;
  outlineButton: (extra?: string) => string;
  inviteCta: string;
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset, watch, setValue } = useForm<InviteForm>({
    defaultValues: { email: "", job: "floor" },
  });
  const job = watch("job");

  const invite = useMutation({
    mutationFn: (vals: InviteForm) => {
      const payload = staffInviteJobToMembership(vals.job);
      return apiFetch(`/businesses/${businessId}/invitations`, {
        method: "POST",
        body: JSON.stringify({
          email: vals.email.trim().toLowerCase(),
          role: payload.role,
          ...(payload.deskRole ? { deskRole: payload.deskRole } : {}),
          redirectUrl: getStaffInviteRedirectUrl(),
        }),
      });
    },
    onSuccess: () => {
      toast({ title: "Invitation sent", description: "They'll receive an email shortly." });
      reset();
      setOpen(false);
    },
    onError: (err: unknown) => {
      const e = err as ApiFetchError;
      const msg =
        e?.code === "CLERK_NOT_CONFIGURED"
          ? "Invitations need server config. Ask your admin to set CLERK_SECRET_KEY."
          : e?.message ?? "Failed to send invitation";
      toast({ title: "Invitation failed", description: msg, variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className={outlineButton()}
          data-testid="button-invite-teammate"
        >
          <Mail className="h-4 w-4 mr-2" />
          {inviteCta}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{OWNERSHIP_SUCCESSION.teamInvite.dialogTitle}</DialogTitle>
          <DialogDescription>{OWNERSHIP_SUCCESSION.teamInvite.dialogDescription}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => invite.mutate(v))} className="space-y-4">
          <div className="space-y-2">
            <Label>Email *</Label>
            <Input
              type="email"
              {...register("email", { required: true })}
              placeholder={LIVIA_FORM_EXAMPLES.staffInviteEmail}
              data-testid="input-invite-email"
            />
          </div>
          <div className="space-y-2">
            <Label>{OWNERSHIP_SUCCESSION.teamInvite.rolePickerLabel}</Label>
            <p className="text-xs text-muted-foreground">
              {OWNERSHIP_SUCCESSION.teamInvite.rolePickerHint}
            </p>
            <div className="space-y-2">
              {STAFF_INVITE_JOBS.map((j) => (
                <button
                  key={j.id}
                  type="button"
                  data-testid={`invite-job-${j.id}`}
                  onClick={() => setValue("job", j.id)}
                  className={cn(
                    "w-full rounded-lg border p-3 text-left transition-colors",
                    job === j.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40",
                  )}
                >
                  <p className="text-sm font-medium text-foreground">{j.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{j.body}</p>
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={invite.isPending} data-testid="button-submit-invite">
              {invite.isPending ? "Sending…" : "Send invitation"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function StaffPage() {
  const { business } = useBusiness();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);

  const bid = business?.id ?? "";
  const businessVertical = (business as { vertical?: string } | null)?.vertical;
  const businessCategory = (business as { category?: string } | null)?.category;
  const op = useOperationalChrome(businessVertical);
  const opCopy = verticalOperationalCopy(businessVertical, businessCategory);

  const { data: staff, isLoading } = useListStaff(
    bid,
    {},
    { query: { enabled: !!bid } as any }
  );

  const createStaff = useCreateStaff();
  const { register, handleSubmit, reset } = useForm<StaffForm>();
  const { effectiveRole } = useMembership();
  const canManage = effectiveRole === "OWNER" || effectiveRole === "ADMIN";

  function onSubmit(vals: StaffForm) {
    if (!bid) return;
    createStaff.mutate(
      { businessId: bid, data: vals },
      {
        onSuccess: () => {
          invalidateOperationalState(qc, bid);
          qc.invalidateQueries({ queryKey: getListStaffQueryKey(bid) });
          toast({ title: "Staff member added" });
          reset();
          setDialogOpen(false);
        },
        onError: () => toast({ title: "Failed to add staff", variant: "destructive" }),
      }
    );
  }

  const members = (staff as any[]) ?? [];

  const headerActions = canManage ? (
    <>
      {bid ? (
        <InviteDialog
          businessId={bid}
          outlineButton={op.outlineButton}
          inviteCta={opCopy.teamInviteCta}
        />
      ) : null}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button data-testid="button-add-staff" className={op.primaryButton()}>
            <UserPlus className="h-4 w-4 mr-2" />
            {opCopy.addTeamMemberCta}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{opCopy.addTeamMemberCta}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name *</Label>
                <Input {...register("firstName", { required: true })} data-testid="input-first-name" />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input {...register("lastName")} data-testid="input-last-name" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Display Name *</Label>
              <Input
                {...register("displayName", { required: true })}
                placeholder="Name shown to customers"
                data-testid="input-display-name"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" {...register("email")} data-testid="input-email" />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input type="tel" {...register("phone")} data-testid="input-phone" />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createStaff.isPending} data-testid="button-submit-staff">
                {createStaff.isPending ? "Adding…" : opCopy.addTeamMemberCta}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  ) : null;

  return (
    <OperationalPageShell
      data-testid="staff-page"
      title={opCopy.teamPageTitle}
      subtitle={opCopy.teamPageSubtitle}
      width="full"
      actions={headerActions}
    >
      <Card className={op.panel()}>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="divide-y divide-border">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : members.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <UsersRound className="h-9 w-9 text-muted-foreground mb-3 opacity-40" />
              <p className="font-medium">{opCopy.emptyTeamTitle}</p>
              <p className="text-sm text-muted-foreground mt-1">{opCopy.emptyTeamBody}</p>
            </div>
          ) : (
            <div className={op.listScroll()} onWheel={onContainedScrollWheel}>
              {members.map((member: any) => (
                <Link key={member.id} href={`/staff/${member.id}`}>
                  <div
                    data-testid={`row-staff-${member.id}`}
                    className={op.row()}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold shrink-0">
                      {member.displayName?.charAt(0) ?? "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{member.displayName}</p>
                      <p className="text-sm text-muted-foreground">
                        {rosterMemberRoleLabel(member.role, businessVertical, businessCategory)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          member.isActive
                            ? "bg-[hsl(var(--chart-3))]/10 text-[hsl(var(--chart-3))]"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {member.isActive ? "Active" : "Inactive"}
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </OperationalPageShell>
  );
}
