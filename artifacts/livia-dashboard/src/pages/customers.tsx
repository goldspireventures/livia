import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { useBusiness } from "@/lib/business-context";
import { businessVocabulary } from "@workspace/policy";
import {
  useListCustomers,
  getListCustomersQueryKey,
  useCreateCustomer,
  listCustomers,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, Search, UserPlus, ChevronRight, Loader2 } from "lucide-react";
import { MergeSuggestionsPanel } from "@/components/merge-suggestions-panel";
import { useForm } from "react-hook-form";
import { invalidateOperationalState } from "@/lib/operational-cache";
import { OperationalPageShell } from "@/components/layout/operational-page-shell";
import { useBeautyChrome } from "@/lib/presentation-layout";
import {
  beautyAmbientPanel,
  beautyListScroll,
  beautyPanel,
  beautyPrimaryButton,
  beautyRow,
} from "@/lib/beauty-operational-ui";
import { cn } from "@/lib/utils";
import { onContainedScrollWheel } from "@/lib/use-contained-scroll";

const PAGE_SIZE = 40;

interface CustomerForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface CustomerRow {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  isBlocked?: boolean;
}

export default function CustomersPage() {
  const { business } = useBusiness();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [offset, setOffset] = useState(0);
  const [accumulated, setAccumulated] = useState<CustomerRow[]>([]);

  const debouncedSearch = useDebouncedValue(search, 300);
  const bid = business?.id ?? "";
  const beautyChrome = useBeautyChrome((business as { vertical?: string } | null)?.vertical);
  const clientNoun = businessVocabulary(
    (business as { vertical?: string } | null)?.vertical,
    business?.category,
  ).clientNoun.toLowerCase();
  const clientNounPlural = clientNoun.endsWith("s") ? `${clientNoun}es` : `${clientNoun}s`;

  useEffect(() => {
    setOffset(0);
    setAccumulated([]);
  }, [debouncedSearch, bid]);

  const { data, isLoading, isFetching } = useListCustomers(
    bid,
    { search: debouncedSearch || undefined, limit: PAGE_SIZE, offset },
    { query: { enabled: !!bid } as never },
  );

  const page = useMemo(() => {
    const raw = data as { data?: CustomerRow[]; total?: number } | CustomerRow[] | undefined;
    if (Array.isArray(raw)) return { data: raw, total: raw.length };
    return { data: raw?.data ?? [], total: raw?.total };
  }, [data]);

  useEffect(() => {
    if (!bid || isLoading) return;
    setAccumulated((prev) => {
      if (offset === 0) return page.data;
      const ids = new Set(prev.map((c) => c.id));
      const next = page.data.filter((c) => !ids.has(c.id));
      return [...prev, ...next];
    });
  }, [page.data, offset, bid, isLoading]);

  const total = page.total;
  const hasMore =
    total !== undefined ? accumulated.length < total : page.data.length === PAGE_SIZE;

  const loadMore = useCallback(async () => {
    if (!bid || !hasMore || isFetching) return;
    const nextOffset = offset + PAGE_SIZE;
    const more = await listCustomers(bid, {
      search: debouncedSearch || undefined,
      limit: PAGE_SIZE,
      offset: nextOffset,
    });
    const rows = (more as { data?: CustomerRow[] }).data ?? [];
    setOffset(nextOffset);
    setAccumulated((prev) => {
      const ids = new Set(prev.map((c) => c.id));
      return [...prev, ...(rows ?? []).filter((c) => !ids.has(c.id))];
    });
  }, [bid, hasMore, isFetching, offset, debouncedSearch]);

  const createCustomer = useCreateCustomer();
  const { register, handleSubmit, reset } = useForm<CustomerForm>();

  function onSubmit(vals: CustomerForm) {
    if (!bid) return;
    createCustomer.mutate(
      { businessId: bid, data: vals },
      {
        onSuccess: () => {
          invalidateOperationalState(qc, bid);
          qc.invalidateQueries({ queryKey: getListCustomersQueryKey(bid) });
          setOffset(0);
          setAccumulated([]);
          toast({ title: "Client added" });
          reset();
          setDialogOpen(false);
        },
        onError: () => toast({ title: "Failed to add client", variant: "destructive" }),
      },
    );
  }

  const listLoading = isLoading && offset === 0;

  return (
    <OperationalPageShell
      data-testid="customers-page"
      title="Clients"
      subtitle={
        total !== undefined
          ? `${total} ${clientNounPlural} — search, book, and view visit history.`
          : `Search, add ${clientNounPlural}, and open profiles for bookings and history.`
      }
      width="full"
      actions={
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              data-testid="button-add-customer"
              className={beautyPrimaryButton(beautyChrome)}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add client
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add client</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First name *</Label>
                  <Input {...register("firstName", { required: true })} data-testid="input-first-name" />
                </div>
                <div className="space-y-2">
                  <Label>Last name</Label>
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
                  {createCustomer.isPending ? "Adding…" : "Add client"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      }
    >
      {total !== undefined ? (
        <div className="grid grid-cols-2 gap-3 max-w-md">
          <Card className={beautyPanel(beautyChrome)}>
            <CardContent className="py-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Total {clientNounPlural}</p>
              <p
                className={cn(
                  "text-2xl font-semibold tabular-nums",
                  beautyChrome && "font-serif tracking-tight",
                )}
                style={beautyChrome ? { fontFamily: "var(--app-font-serif)" } : undefined}
              >
                {total}
              </p>
            </CardContent>
          </Card>
          <Card className={beautyPanel(beautyChrome)}>
            <CardContent className="py-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">In directory</p>
              <p
                className={cn(
                  "text-2xl font-semibold tabular-nums",
                  beautyChrome && "font-serif tracking-tight",
                )}
                style={beautyChrome ? { fontFamily: "var(--app-font-serif)" } : undefined}
              >
                {accumulated.length}
              </p>
              {hasMore ? (
                <p className="text-[10px] text-muted-foreground mt-1">Scroll the list for more</p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      ) : null}

      <MergeSuggestionsPanel />

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, or phone…"
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          data-testid="input-search-customers"
        />
      </div>

      <Card className={beautyAmbientPanel(beautyChrome)}>
        <CardContent className="p-0">
          {listLoading ? (
            <div className="divide-y divide-border">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))}
            </div>
          ) : accumulated.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Users className="h-9 w-9 text-muted-foreground mb-3 opacity-40" />
              <p className="font-medium">{search ? "No clients found" : "No clients yet"}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {search ? "Try a different search" : "Add your first client or let Liv capture them from bookings"}
              </p>
            </div>
          ) : (
            <>
              <div className={beautyListScroll()} onWheel={onContainedScrollWheel}>
                {accumulated.map((customer) => (
                  <Link key={customer.id} href={`/customers/${customer.id}`}>
                    <div
                      data-testid={`row-customer-${customer.id}`}
                      className={beautyRow(beautyChrome)}
                    >
                      <div
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-full font-semibold text-sm shrink-0",
                          beautyChrome
                            ? "bg-primary/12 text-primary"
                            : "bg-muted",
                        )}
                      >
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
              {hasMore && (
                <div className="p-4 border-t flex justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void loadMore()}
                    disabled={isFetching}
                    data-testid="button-load-more-customers"
                  >
                    {isFetching ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Loading…
                      </>
                    ) : (
                      "Load more"
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </OperationalPageShell>
  );
}
