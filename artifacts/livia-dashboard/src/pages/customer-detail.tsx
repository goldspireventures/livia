import { useState } from "react";
import { Link } from "wouter";
import { usePathId } from "@/lib/detail-route-params";
import { useBusiness } from "@/lib/business-context";
import { useMembership } from "@/lib/membership-context";
import {
  useGetCustomer,
  getGetCustomerQueryKey,
  useUpdateCustomer,
  getListCustomersQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Mail, Phone, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { trustedClientToggleGuidance } from "@workspace/policy";
import { GuestRelationshipPanel } from "@/components/customers/guest-relationship-panel";
import { ClientConsultPipelinePanel } from "@/components/event-vendor/client-consult-pipeline-panel";
import {
  ownerClientNotesPlaceholder,
  ownerClientProfileSubtitle,
  showOwnerBookAppointmentCta,
  showOwnerBookingHistoryPanel,
  showOwnerConsultPipelinePanel,
  showOwnerGuestRelationshipPanel,
  showOwnerLivMemoryPanel,
} from "@workspace/policy";
import { LivMemoryPanel } from "@/components/customers/liv-memory-panel";
import { GuestHistoryPanel } from "@/components/customers/guest-history-panel";
import { CustomerPetsPanel } from "@/components/customer-pets-panel";
import { CareSeriesPanel } from "@/components/customers/care-series-panel";
import { useForm } from "react-hook-form";
import { OperationalPageShell } from "@/components/layout/operational-page-shell";
import { invalidateOperationalState } from "@/lib/operational-cache";
import { BeautyClientPanel } from "@/components/beauty/beauty-client-panel";
import { AlliedClinicalNotesPanel } from "@/components/allied-health/allied-clinical-notes-panel";

interface CustomerForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  notes: string;
}

export default function CustomerDetailPage() {
  const customerId = usePathId("customers");
  const { business } = useBusiness();
  const { effectiveRole } = useMembership();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);

  const bid = business?.id ?? "";
  const cid = customerId ?? "";
  const vertical = (business as { vertical?: string } | null)?.vertical;
  const isBeauty = vertical === "beauty";
  const showCareSeries =
    vertical === "allied-health" || vertical === "wellness" || vertical === "physio";
  const canEdit = effectiveRole === "OWNER" || effectiveRole === "ADMIN";

  const { data: customer, isLoading } = useGetCustomer(
    bid,
    cid,
    { query: { enabled: !!bid && !!cid } as never },
  );

  const updateCustomer = useUpdateCustomer();
  const { register, handleSubmit, reset } = useForm<CustomerForm>();

  const c = customer as {
    id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    notes?: string;
    isBlocked?: boolean;
    trustedClient?: boolean;
    strikeCount?: number;
    noShowCount?: number;
    channelIdentities?: Array<{
      id: string;
      channelType: string;
      externalId: string;
      displayName?: string | null;
      username?: string | null;
    }>;
    recentBookings?: Array<{
      id: string;
      status: string;
      startAt: string;
      service?: { name?: string };
    }>;
    patchTestCompletedAt?: string | null;
    beautyPreferences?: unknown;
  } | null;

  function startEdit() {
    if (!c) return;
    reset({
      firstName: c.firstName ?? "",
      lastName: c.lastName ?? "",
      email: c.email ?? "",
      phone: c.phone ?? "",
      notes: c.notes ?? "",
    });
    setEditing(true);
  }

  function onSave(vals: CustomerForm) {
    if (!bid || !cid) return;
    updateCustomer.mutate(
      {
        businessId: bid,
        customerId: cid,
        data: {
          firstName: vals.firstName.trim() || undefined,
          lastName: vals.lastName.trim() || undefined,
          email: vals.email.trim() || undefined,
          phone: vals.phone.trim() || undefined,
          notes: vals.notes.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          invalidateOperationalState(qc, bid);
          qc.invalidateQueries({ queryKey: getGetCustomerQueryKey(bid, cid) });
          qc.invalidateQueries({ queryKey: getListCustomersQueryKey(bid) });
          toast({ title: "Client saved" });
          setEditing(false);
        },
        onError: () => toast({ title: "Could not save — check the details and try again.", variant: "destructive" }),
      },
    );
  }

  function saveBeautyFields(data: Record<string, unknown>) {
    if (!bid || !cid) return;
    updateCustomer.mutate(
      { businessId: bid, customerId: cid, data: data as never },
      {
        onSuccess: () => {
          invalidateOperationalState(qc, bid);
          qc.invalidateQueries({ queryKey: getGetCustomerQueryKey(bid, cid) });
          toast({ title: "Beauty profile saved" });
        },
        onError: () => toast({ title: "Could not save beauty profile", variant: "destructive" }),
      },
    );
  }

  function toggleBlock() {
    if (!bid || !cid || !c) return;
    updateCustomer.mutate(
      { businessId: bid, customerId: cid, data: { isBlocked: !c.isBlocked } },
      {
        onSuccess: () => {
          invalidateOperationalState(qc, bid);
          qc.invalidateQueries({ queryKey: getGetCustomerQueryKey(bid, cid) });
          toast({ title: c.isBlocked ? "Client unblocked" : "Client blocked" });
        },
        onError: () => toast({ title: "Failed to update client", variant: "destructive" }),
      },
    );
  }

  function toggleTrustedClient() {
    if (!bid || !cid || !c || !canEdit) return;
    updateCustomer.mutate(
      { businessId: bid, customerId: cid, data: { trustedClient: !c.trustedClient } },
      {
        onSuccess: () => {
          invalidateOperationalState(qc, bid);
          qc.invalidateQueries({ queryKey: getGetCustomerQueryKey(bid, cid) });
          toast({ title: c.trustedClient ? "Trusted removed" : "Marked trusted" });
        },
        onError: () => toast({ title: "Could not update trusted status", variant: "destructive" }),
      },
    );
  }

  return (
    <OperationalPageShell
      data-testid="customer-detail-page"
      title={editing ? "Edit client" : "Client profile"}
      subtitle={editing ? "Update contact details and notes" : ownerClientProfileSubtitle(vertical)}
      width="lg"
      actions={
        <div className="flex items-center gap-2">
          <Link href="/customers">
            <Button variant="outline" size="sm" data-testid="button-back">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          {canEdit && !editing && c ? (
            <Button variant="outline" size="sm" onClick={startEdit} data-testid="button-edit-customer">
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          ) : null}
        </div>
      }
    >
      <div className="space-y-4 max-w-2xl">

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-40" />
          <Skeleton className="h-64" />
        </div>
      ) : !c ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">Client not found</CardContent>
        </Card>
      ) : editing ? (
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSave)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First name *</Label>
                  <Input {...register("firstName", { required: true })} data-testid="edit-first-name" />
                </div>
                <div className="space-y-2">
                  <Label>Last name</Label>
                  <Input {...register("lastName")} data-testid="edit-last-name" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" {...register("email")} data-testid="edit-email" />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input type="tel" {...register("phone")} data-testid="edit-phone" />
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea {...register("notes")} placeholder={ownerClientNotesPlaceholder(vertical)} data-testid="edit-notes" />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateCustomer.isPending} data-testid="button-save-customer">
                  {updateCustomer.isPending ? "Saving…" : "Save client"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xl">
                    {c.firstName?.charAt(0) ?? "?"}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold" data-testid="text-customer-name">
                      {c.firstName} {c.lastName}
                    </h2>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {c.isBlocked && (
                        <Badge variant="destructive" className="text-[10px]">
                          Blocked
                        </Badge>
                      )}
                      {c.trustedClient ? (
                        <Badge variant="secondary" className="text-[10px]">
                          Trusted
                        </Badge>
                      ) : null}
                      {(c.strikeCount ?? 0) > 0 ? (
                        <Badge variant="outline" className="text-[10px]">
                          {c.strikeCount} strike{(c.strikeCount ?? 0) === 1 ? "" : "s"}
                        </Badge>
                      ) : null}
                      {(c.noShowCount ?? 0) > 0 ? (
                        <Badge variant="outline" className="text-[10px]">
                          {c.noShowCount} no-show{(c.noShowCount ?? 0) === 1 ? "" : "s"}
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                </div>
                {canEdit && (
                  <Button
                    variant={c.isBlocked ? "outline" : "destructive"}
                    size="sm"
                    onClick={toggleBlock}
                    disabled={updateCustomer.isPending}
                    data-testid="button-toggle-block"
                  >
                    {c.isBlocked ? "Unblock" : "Block"}
                  </Button>
                )}
              </div>

              <div className="mt-6 space-y-3">
                {c.email && (
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${c.email}`} className="hover:text-primary transition-colors">
                      {c.email}
                    </a>
                  </div>
                )}
                {c.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${c.phone}`} className="hover:text-primary transition-colors">
                      {c.phone}
                    </a>
                  </div>
                )}
              </div>

              {c.notes && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm whitespace-pre-wrap">{c.notes}</p>
                </div>
              )}

              {canEdit ? (
                <div
                  className="mt-4 pt-4 border-t flex items-start justify-between gap-4"
                  data-testid="customer-trusted-toggle"
                >
                  <div>
                    <p className="text-sm font-medium">Trusted client</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-md">
                      {trustedClientToggleGuidance()}
                    </p>
                  </div>
                  <Switch
                    checked={Boolean(c.trustedClient)}
                    disabled={updateCustomer.isPending}
                    onCheckedChange={() => toggleTrustedClient()}
                    aria-label="Trusted client"
                  />
                </div>
              ) : null}

              {(c.channelIdentities?.length ?? 0) > 0 ? (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Linked channels</p>
                  <ul className="space-y-1 text-sm">
                    {c.channelIdentities!.map((ch) => (
                      <li key={ch.id} className="font-mono text-xs text-muted-foreground">
                        {ch.channelType} · {ch.externalId}
                        {ch.username ? ` (@${ch.username})` : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

            </CardContent>
          </Card>

          {showOwnerGuestRelationshipPanel(vertical) ? (
            <GuestRelationshipPanel
              businessId={bid}
              customerId={cid}
              customerPhone={c.phone}
            />
          ) : null}

          {showOwnerConsultPipelinePanel(vertical) ? (
            <ClientConsultPipelinePanel businessId={bid} customerId={cid} />
          ) : null}

          {isBeauty ? (
            <BeautyClientPanel
              customer={{
                patchTestCompletedAt: c.patchTestCompletedAt,
                beautyPreferences: c.beautyPreferences,
              }}
              canEdit={canEdit}
              saving={updateCustomer.isPending}
              onSavePatchTest={(iso) => saveBeautyFields({ patchTestCompletedAt: iso })}
              onSavePreferences={(prefs) => saveBeautyFields({ beautyPreferences: prefs })}
            />
          ) : null}

          {showCareSeries ? <CareSeriesPanel customerId={cid} canEdit={canEdit} /> : null}
          {vertical === "allied-health" ? <AlliedClinicalNotesPanel customerId={cid} /> : null}

          <CustomerPetsPanel
            businessId={bid}
            customerId={cid}
            vertical={(business as { vertical?: string } | undefined)?.vertical}
          />

          {showOwnerLivMemoryPanel(vertical) ? (
          <LivMemoryPanel
            businessId={bid}
            customerId={cid}
            canEdit={canEdit}
            vertical={(business as { vertical?: string } | null)?.vertical}
            category={(business as { category?: string } | null)?.category}
          />
          ) : null}

          <GuestHistoryPanel
            businessId={bid}
            customerId={cid}
            recentBookings={showOwnerBookingHistoryPanel(vertical) ? c.recentBookings : []}
            vertical={vertical}
          />

          {showOwnerBookAppointmentCta(vertical) && canEdit ? (
            <Link href={`/bookings?create=1&customerId=${cid}`}>
              <Button className="w-full">Book appointment</Button>
            </Link>
          ) : null}
          {showOwnerConsultPipelinePanel(vertical) && canEdit ? (
            <Link href="/inbox">
              <Button className="w-full" variant="outline">
                Open inbox
              </Button>
            </Link>
          ) : null}
        </>
      )}
      </div>
    </OperationalPageShell>
  );
}
