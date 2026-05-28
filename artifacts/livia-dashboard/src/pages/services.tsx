import { useState } from "react";
import { useBusiness } from "@/lib/business-context";
import {
  useListServices,
  getListServicesQueryKey,
  useCreateService,
  useUpdateService,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Scissors, Plus, Clock, DollarSign } from "lucide-react";
import { useForm } from "react-hook-form";
import { invalidateOperationalState } from "@/lib/operational-cache";
import { OperationalPageShell } from "@/components/layout/operational-page-shell";

interface ServiceForm {
  name: string;
  description: string;
  durationMinutes: number;
  priceMinor: number;
  currency: string;
}

export default function ServicesPage() {
  const { business } = useBusiness();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  const bid = business?.id ?? "";

  const { data: services, isLoading } = useListServices(
    bid,
    { isActive: showInactive ? undefined : true },
    { query: { enabled: !!bid } as any }
  );

  const createService = useCreateService();
  const updateService = useUpdateService();
  const { register, handleSubmit, reset } = useForm<ServiceForm>({
    defaultValues: { currency: "USD", durationMinutes: 60 },
  });

  const svcList = (services as { id: string; name: string; description?: string; durationMinutes: number; priceMinor: number; currency?: string; isActive?: boolean }[]) ?? [];

  function openEdit(svc: (typeof svcList)[number]) {
    setEditId(svc.id);
    reset({
      name: svc.name,
      description: svc.description ?? "",
      durationMinutes: svc.durationMinutes,
      priceMinor: svc.priceMinor,
      currency: svc.currency || "EUR",
    });
  }

  function saveEdit(vals: ServiceForm) {
    if (!bid || !editId) return;
    updateService.mutate(
      {
        businessId: bid,
        serviceId: editId,
        data: {
          name: vals.name,
          description: vals.description || undefined,
          durationMinutes: Number(vals.durationMinutes),
          priceMinor: Number(vals.priceMinor),
          currency: vals.currency || "EUR",
        },
      },
      {
        onSuccess: () => {
          invalidateOperationalState(qc, bid);
          qc.invalidateQueries({ queryKey: getListServicesQueryKey(bid) });
          toast({ title: "Service updated" });
          setEditId(null);
        },
        onError: () => toast({ title: "Failed to update service", variant: "destructive" }),
      },
    );
  }

  function onSubmit(vals: ServiceForm) {
    if (!bid) return;
    createService.mutate(
      {
        businessId: bid,
        data: {
          name: vals.name,
          description: vals.description || undefined,
          durationMinutes: Number(vals.durationMinutes),
          priceMinor: Number(vals.priceMinor),
          currency: vals.currency || "USD",
        },
      },
      {
        onSuccess: () => {
          invalidateOperationalState(qc, bid);
          qc.invalidateQueries({ queryKey: getListServicesQueryKey(bid) });
          toast({ title: "Service created" });
          reset();
          setDialogOpen(false);
        },
        onError: () => toast({ title: "Failed to create service", variant: "destructive" }),
      }
    );
  }

  function toggleActive(serviceId: string, isActive: boolean) {
    if (!bid) return;
    updateService.mutate(
      { businessId: bid, serviceId, data: { isActive: !isActive } },
      {
        onSuccess: () => {
          invalidateOperationalState(qc, bid);
          qc.invalidateQueries({ queryKey: getListServicesQueryKey(bid) });
          toast({ title: isActive ? "Service deactivated" : "Service activated" });
        },
      }
    );
  }

  return (
    <OperationalPageShell
      title="Services"
      subtitle="Your catalog — duration and price drive availability and Liv's booking suggestions."
      width="full"
      actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowInactive(!showInactive)}>
            {showInactive ? "Hide Inactive" : "Show All"}
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-service">
                <Plus className="h-4 w-4 mr-2" />
                New Service
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Service</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label>Service Name *</Label>
                  <Input
                    {...register("name", { required: true })}
                    placeholder="e.g. Haircut"
                    data-testid="input-service-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    {...register("description")}
                    placeholder="What's included..."
                    data-testid="input-description"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Duration (min) *
                    </Label>
                    <Input
                      type="number"
                      min={5}
                      step={5}
                      {...register("durationMinutes", { required: true, min: 5 })}
                      data-testid="input-duration"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      Price (cents) *
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      {...register("priceMinor", { required: true, min: 0 })}
                      placeholder="2000 = $20.00"
                      data-testid="input-price"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Input {...register("currency")} placeholder="USD" data-testid="input-currency" />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createService.isPending}
                    data-testid="button-submit-service"
                  >
                    {createService.isPending ? "Creating..." : "Create Service"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      }
    >
      <Dialog open={!!editId} onOpenChange={(o) => !o && setEditId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit service</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(saveEdit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Service name *</Label>
              <Input {...register("name", { required: true })} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea {...register("description")} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Duration (min)</Label>
                <Input type="number" min={5} {...register("durationMinutes", { required: true })} />
              </div>
              <div className="space-y-2">
                <Label>Price (cents)</Label>
                <Input type="number" min={0} {...register("priceMinor", { required: true })} />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setEditId(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateService.isPending}>
                {updateService.isPending ? "Saving…" : "Save service"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-40" />)}
        </div>
      ) : svcList.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Scissors className="h-10 w-10 text-muted-foreground mb-4 opacity-40" />
            <p className="font-medium">No services yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Create your first service to start taking bookings
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {svcList.map((svc: any) => (
            <Card
              key={svc.id}
              data-testid={`card-service-${svc.id}`}
              className={!svc.isActive ? "opacity-60" : ""}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{svc.name}</CardTitle>
                  {!svc.isActive && (
                    <Badge variant="outline" className="text-[10px]">Inactive</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {svc.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{svc.description}</p>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {svc.durationMinutes} min
                  </span>
                  <span className="font-semibold text-primary">
                    {formatCurrency(svc.priceMinor, svc.currency)}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => openEdit(svc)}
                    data-testid={`button-edit-service-${svc.id}`}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => toggleActive(svc.id, svc.isActive)}
                    disabled={updateService.isPending}
                    data-testid={`button-toggle-service-${svc.id}`}
                  >
                    {svc.isActive ? "Deactivate" : "Activate"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </OperationalPageShell>
  );
}
