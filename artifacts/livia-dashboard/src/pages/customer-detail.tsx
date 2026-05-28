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
import { formatDateTime } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Mail, Phone, Calendar, AlertCircle, Pencil, Link2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { customFetch } from "@workspace/api-client-react";
import { CustomerTimeline } from "@/components/customer-timeline";
import { LivMemoryPanel } from "@/components/customers/liv-memory-panel";
import { CustomerPetsPanel } from "@/components/customer-pets-panel";
import { CareSeriesPanel } from "@/components/customers/care-series-panel";
import { useForm } from "react-hook-form";
import { OperationalPageShell } from "@/components/layout/operational-page-shell";
import { invalidateOperationalState } from "@/lib/operational-cache";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "text-[hsl(var(--chart-4))]",
  CONFIRMED: "text-primary",
  COMPLETED: "text-[hsl(var(--chart-3))]",
  CANCELLED: "text-destructive",
  NO_SHOW: "text-muted-foreground",
};

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
  const [mergeIdentityId, setMergeIdentityId] = useState("");
  const [merging, setMerging] = useState(false);

  const bid = business?.id ?? "";
  const cid = customerId ?? "";
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

  async function mergeIdentity() {
    if (!bid || !cid || !mergeIdentityId.trim()) return;
    setMerging(true);
    try {
      await customFetch(`/api/businesses/${bid}/customers/${cid}/merge-identity`, {
        method: "POST",
        body: JSON.stringify({ identityId: mergeIdentityId.trim() }),
      });
      invalidateOperationalState(qc, bid);
      qc.invalidateQueries({ queryKey: getGetCustomerQueryKey(bid, cid) });
      setMergeIdentityId("");
      toast({ title: "Channel linked to this client" });
    } catch (e) {
      toast({
        title: "Merge failed",
        description: e instanceof Error ? e.message : undefined,
        variant: "destructive",
      });
    } finally {
      setMerging(false);
    }
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

  return (
    <OperationalPageShell
      title={editing ? "Edit client" : "Client profile"}
      subtitle={editing ? "Update contact details and notes" : "History and contact details"}
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
      <div className="space-y-6 max-w-2xl">

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
                <Textarea {...register("notes")} placeholder="Preferences, allergies, colour formula…" data-testid="edit-notes" />
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

              {canEdit ? (
                <div className="mt-4 pt-4 border-t space-y-2">
                  <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Link2 className="h-3 w-3" />
                    Merge duplicate channel
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Paste the channel identity id from the duplicate profile to attach it to this
                    client.
                  </p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Channel identity id"
                      value={mergeIdentityId}
                      onChange={(e) => setMergeIdentityId(e.target.value)}
                      data-testid="input-merge-identity"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={merging || !mergeIdentityId.trim()}
                      onClick={() => void mergeIdentity()}
                    >
                      {merging ? "Merging…" : "Merge"}
                    </Button>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <CareSeriesPanel customerId={cid} canEdit={canEdit} />

          <CustomerPetsPanel
            businessId={bid}
            customerId={cid}
            vertical={(business as { vertical?: string } | undefined)?.vertical}
          />

          <LivMemoryPanel businessId={bid} customerId={cid} canEdit={canEdit} />
          <CustomerTimeline businessId={bid} customerId={cid} />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Booking history
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {!c.recentBookings || c.recentBookings.length === 0 ? (
                <p className="text-sm text-muted-foreground px-6 py-8 text-center">No bookings yet</p>
              ) : (
                <div className="divide-y divide-border">
                  {c.recentBookings.map((booking) => (
                    <Link key={booking.id} href={`/bookings/${booking.id}`}>
                      <div className="flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors cursor-pointer">
                        <div>
                          <p className="font-medium text-sm">{booking.service?.name ?? "—"}</p>
                          <p className="text-xs text-muted-foreground">{formatDateTime(booking.startAt)}</p>
                        </div>
                        <span className={`text-xs font-semibold ${STATUS_COLORS[booking.status] ?? ""}`}>
                          {booking.status}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {canEdit && (
            <Link href={`/bookings?create=1&customerId=${cid}`}>
              <Button className="w-full">Book appointment</Button>
            </Link>
          )}
        </>
      )}
      </div>
    </OperationalPageShell>
  );
}
