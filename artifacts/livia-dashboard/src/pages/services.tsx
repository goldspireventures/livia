import { useCallback, useEffect, useState } from "react";
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
import { Scissors, Plus, Clock, DollarSign, Star } from "lucide-react";
import { customFetch } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { invalidateOperationalState } from "@/lib/operational-cache";
import { OperationalPageShell } from "@/components/layout/operational-page-shell";
import { ServiceImageField } from "@/components/services/service-image-field";
import { businessVocabulary } from "@workspace/policy";

interface ServiceForm {
  name: string;
  description: string;
  durationMinutes: number;
  priceMinor: number;
  currency: string;
  imageUrl?: string;
}

export default function ServicesPage() {
  const { business } = useBusiness();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [featuredIds, setFeaturedIds] = useState<string[]>([]);

  const bid = business?.id ?? "";

  const loadFeatured = useCallback(async () => {
    if (!bid) return;
    try {
      const row = await customFetch<{ publicFeaturedServiceIds?: string[] }>(
        `/api/businesses/${bid}/presentation`,
      );
      setFeaturedIds(Array.isArray(row.publicFeaturedServiceIds) ? row.publicFeaturedServiceIds : []);
    } catch {
      setFeaturedIds([]);
    }
  }, [bid]);

  useEffect(() => {
    void loadFeatured();
  }, [loadFeatured]);

  const { data: services, isLoading } = useListServices(
    bid,
    { isActive: showInactive ? undefined : true },
    { query: { enabled: !!bid } as any }
  );

  const createService = useCreateService();
  const updateService = useUpdateService();
  const { register, handleSubmit, reset, watch, setValue } = useForm<ServiceForm>({
    defaultValues: { currency: "USD", durationMinutes: 60, imageUrl: "" },
  });
  const draftImageUrl = watch("imageUrl");

  const svcList =
    (services as {
      id: string;
      name: string;
      description?: string;
      durationMinutes: number;
      priceMinor: number;
      currency?: string;
      isActive?: boolean;
      imageUrl?: string | null;
    }[]) ?? [];

  const vocab = businessVocabulary(
    (business as { vertical?: string } | null)?.vertical,
    (business as { category?: string } | null)?.category,
  );

  function openEdit(svc: (typeof svcList)[number]) {
    setEditId(svc.id);
    reset({
      name: svc.name,
      description: svc.description ?? "",
      durationMinutes: svc.durationMinutes,
      priceMinor: svc.priceMinor,
      currency: svc.currency || "EUR",
      imageUrl: svc.imageUrl ?? "",
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
          imageUrl: vals.imageUrl?.trim() || undefined,
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
          imageUrl: vals.imageUrl?.trim() || undefined,
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

  async function toggleFeatured(serviceId: string) {
    if (!bid) return;
    let next = featuredIds.includes(serviceId)
      ? featuredIds.filter((id) => id !== serviceId)
      : [...featuredIds, serviceId];
    if (next.length > 4) {
      toast({
        title: "Up to 4 services on your booking page",
        description: "Unpin one before adding another.",
        variant: "destructive",
      });
      return;
    }
    try {
      const res = await customFetch<{ publicFeaturedServiceIds: string[] }>(
        `/api/businesses/${bid}/public-featured-services`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ serviceIds: next }),
        },
      );
      setFeaturedIds(res.publicFeaturedServiceIds);
      toast({ title: "Booking page highlights updated" });
    } catch {
      toast({ title: "Could not update featured services", variant: "destructive" });
    }
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
      data-testid="services-page"
      title={vocab.publicBookCatalogTitle}
      subtitle={`Your catalog — add photos for public booking. Pin up to 4 ${vocab.publicBookCatalogTitle.toLowerCase()} to the top of your book page.`}
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
                {bid ? (
                  <ServiceImageField
                    businessId={bid}
                    imageUrl={draftImageUrl || null}
                    onChange={(url) => setValue("imageUrl", url ?? "")}
                    disabled={createService.isPending}
                  />
                ) : null}
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
            {bid ? (
              <ServiceImageField
                businessId={bid}
                imageUrl={draftImageUrl || null}
                onChange={(url) => setValue("imageUrl", url ?? "")}
                disabled={updateService.isPending}
              />
            ) : null}
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
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : svcList.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <Scissors className="h-9 w-9 text-muted-foreground mb-3 opacity-40" />
            <p className="font-medium">No services yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Create your first service to start taking bookings
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0 max-h-[min(70vh,640px)] overflow-y-auto divide-y divide-border">
            {svcList.map((svc: any) => (
              <div
                key={svc.id}
                data-testid={`row-service-${svc.id}`}
                className={`flex flex-wrap items-center gap-3 p-3 ${!svc.isActive ? "opacity-60" : ""}`}
              >
                {svc.imageUrl ? (
                  <img
                    src={svc.imageUrl}
                    alt=""
                    className="h-12 w-12 shrink-0 rounded-lg object-cover border border-border/60"
                  />
                ) : (
                  <div className="h-12 w-12 shrink-0 rounded-lg border border-dashed border-border/60 bg-muted/30" />
                )}
                <div className="flex-1 min-w-[140px]">
                  <p className="font-medium text-sm">{svc.name}</p>
                  {svc.description ? (
                    <p className="text-xs text-muted-foreground line-clamp-1">{svc.description}</p>
                  ) : null}
                </div>
                <div className="flex items-center gap-3 text-sm shrink-0">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {svc.durationMinutes}m
                  </span>
                  <span className="font-semibold text-primary">
                    {formatCurrency(svc.priceMinor, svc.currency)}
                  </span>
                  {!svc.isActive ? (
                    <Badge variant="outline" className="text-[10px]">
                      Inactive
                    </Badge>
                  ) : null}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    variant={featuredIds.includes(svc.id) ? "default" : "outline"}
                    size="sm"
                    title={
                      featuredIds.includes(svc.id)
                        ? "Pinned on booking page"
                        : "Pin to booking page (max 4)"
                    }
                    onClick={() => void toggleFeatured(svc.id)}
                    data-testid={`button-feature-service-${svc.id}`}
                  >
                    <Star
                      className={`h-3.5 w-3.5 ${featuredIds.includes(svc.id) ? "fill-current" : ""}`}
                    />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEdit(svc)}
                    data-testid={`button-edit-service-${svc.id}`}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleActive(svc.id, svc.isActive)}
                    disabled={updateService.isPending}
                    data-testid={`button-toggle-service-${svc.id}`}
                  >
                    {svc.isActive ? "Deactivate" : "Activate"}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </OperationalPageShell>
  );
}
