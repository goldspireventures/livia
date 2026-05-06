import { useState } from "react";
import { Link } from "wouter";
import { useBusiness } from "@/lib/business-context";
import {
  useListCustomers,
  getListCustomersQueryKey,
  useCreateCustomer,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, Search, UserPlus, ChevronRight } from "lucide-react";
import { useForm } from "react-hook-form";

interface CustomerForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export default function CustomersPage() {
  const { business } = useBusiness();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const bid = business?.id ?? "";

  const { data, isLoading } = useListCustomers(
    bid,
    { search: search || undefined, limit: 50 },
    { query: { enabled: !!bid } as any }
  );

  const createCustomer = useCreateCustomer();
  const { register, handleSubmit, reset } = useForm<CustomerForm>();

  function onSubmit(vals: CustomerForm) {
    if (!bid) return;
    createCustomer.mutate(
      { businessId: bid, data: vals },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListCustomersQueryKey(bid) });
          toast({ title: "Customer added" });
          reset();
          setDialogOpen(false);
        },
        onError: () => toast({ title: "Failed to add customer", variant: "destructive" }),
      }
    );
  }

  const customers = (data as any)?.data ?? data ?? [];
  const total = (data as any)?.total;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground">
            {total !== undefined ? `${total} total` : "Manage your client base"}
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-customer">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Customer</DialogTitle>
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
                <Button type="submit" disabled={createCustomer.isPending} data-testid="button-submit-customer">
                  {createCustomer.isPending ? "Adding..." : "Add Customer"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search customers..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          data-testid="input-search-customers"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="divide-y divide-border">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : (customers as any[]).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Users className="h-10 w-10 text-muted-foreground mb-4 opacity-40" />
              <p className="font-medium">{search ? "No customers found" : "No customers yet"}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {search ? "Try a different search" : "Add your first customer to get started"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {(customers as any[]).map((customer: any) => (
                <Link key={customer.id} href={`/customers/${customer.id}`}>
                  <div
                    data-testid={`row-customer-${customer.id}`}
                    className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted font-semibold text-sm shrink-0">
                      {customer.firstName?.charAt(0) ?? "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {customer.firstName} {customer.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {customer.email || customer.phone || "No contact info"}
                      </p>
                    </div>
                    {customer.isBlocked && (
                      <span className="text-xs font-medium text-destructive border border-destructive/30 rounded-full px-2 py-0.5">
                        Blocked
                      </span>
                    )}
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
