import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useBusiness } from "@/lib/business-context";
import { clientGuestBookAbsoluteUrl } from "@/lib/guest-book-url";
import { customFetch } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Building2, Plus, ExternalLink } from "lucide-react";
import { PersonaRitualHeader } from "@/components/ritual/persona-ritual-header";
import { PageFrame } from "@/components/ui/page-frame";
import { VerticalBadge } from "@/components/ui/vertical-badge";
import { verticalToneClass } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { LIVIA_FORM_EXAMPLES } from "@workspace/policy";

type PremisesTenant = {
  businessId: string;
  publicLabel: string;
  slug: string;
  name: string;
  vertical: string;
  isPrimary: boolean;
};

type PremisesDetail = {
  id: string;
  slug: string;
  displayName: string;
  city: string | null;
  tenants: PremisesTenant[];
};

const VERTICALS = [
  "hair",
  "beauty",
  "wellness",
  "medspa",
  "pet-grooming",
  "body-art",
  "allied-health",
] as const;

export default function PremisesPage() {
  const { business } = useBusiness();
  const { toast } = useToast();
  const [premises, setPremises] = useState<PremisesDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [coTenantOpen, setCoTenantOpen] = useState<string | null>(null);
  const [coName, setCoName] = useState("");
  const [coSlug, setCoSlug] = useState("");
  const [coLabel, setCoLabel] = useState("");
  const [coVertical, setCoVertical] = useState<string>("beauty");
  const [inviteOpen, setInviteOpen] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLabel, setInviteLabel] = useState("");
  const [lastInvitePath, setLastInvitePath] = useState<string | null>(null);

  async function reload() {
    setLoading(true);
    try {
      const rows = await customFetch<PremisesDetail[]>("/api/me/premises");
      setPremises(rows);
    } catch {
      setPremises([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  async function handleCreate() {
    if (!business?.id || !displayName.trim()) return;
    try {
      await customFetch("/api/me/premises", {
        method: "POST",
        body: JSON.stringify({
          displayName: displayName.trim(),
          anchorBusinessId: business.id,
          anchorPublicLabel: business.name,
        }),
      });
      toast({ title: "Premises created", description: "Share the unified address link with customers." });
      setCreateOpen(false);
      setDisplayName("");
      void reload();
    } catch {
      toast({ title: "Could not create premises", variant: "destructive" });
    }
  }

  async function handleInviteCoOwner(premisesId: string) {
    if (!business?.id || !inviteEmail.trim() || !inviteLabel.trim()) return;
    try {
      const result = await customFetch<{
        acceptPath: string;
        token: string;
      }>(`/api/premises/${premisesId}/co-tenant-invites`, {
        method: "POST",
        body: JSON.stringify({
          invitingBusinessId: business.id,
          invitedEmail: inviteEmail.trim(),
          publicLabel: inviteLabel.trim(),
        }),
      });
      const fullPath = result.acceptPath;
      setLastInvitePath(fullPath);
      toast({
        title: "Invite created",
        description: `Share ${fullPath} with the other owner — they accept with their own Livia account.`,
      });
      setInviteOpen(null);
      setInviteEmail("");
      setInviteLabel("");
    } catch {
      toast({ title: "Could not create invite", variant: "destructive" });
    }
  }

  async function handleProvisionCoTenant(premisesId: string) {
    if (!coName.trim() || !coSlug.trim() || !coLabel.trim()) return;
    try {
      await customFetch(`/api/premises/${premisesId}/provision-tenant`, {
        method: "POST",
        body: JSON.stringify({
          name: coName.trim(),
          slug: coSlug.trim().toLowerCase(),
          publicLabel: coLabel.trim(),
          vertical: coVertical,
          tier: "solo",
        }),
      });
      toast({ title: "Co-tenant provisioned", description: "Separate business, same building — own clients and GDPR." });
      setCoTenantOpen(null);
      setCoName("");
      setCoSlug("");
      setCoLabel("");
      void reload();
    } catch (e) {
      toast({
        title: "Provision failed",
        description: e instanceof Error ? e.message : "Check slug uniqueness",
        variant: "destructive",
      });
    }
  }

  return (
    <PageFrame>
      <PersonaRitualHeader
        variant="page"
        title="Shared premises"
        subtitle="One address, multiple independent businesses — hair downstairs, spa upstairs, each with its own tenant, clients, and Liv."
      />

      {!createOpen ? (
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Link this shop to a premises
        </Button>
      ) : (
        <Card className="hover-elevate">
          <CardHeader>
            <CardTitle className="text-base">New premises</CardTitle>
            <CardDescription>
              Customers book at <code className="text-xs">/p/your-slug</code> and pick the right business.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Building name (customer-facing)</Label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Dundrum House — Hair & Spa"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => void handleCreate()}>Create</Button>
              <Button variant="ghost" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      ) : premises.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground max-w-md mx-auto">
            No shared premises yet. Use this when two or more independent businesses share one address
            (salon + spa, barber + nails). Demo: provision world then open{" "}
            <Link href="/p/dundrum-house" className="text-primary hover:underline">
              /p/dundrum-house
            </Link>
            .
          </CardContent>
        </Card>
      ) : (
        premises.map((p) => (
          <Card key={p.id} className="hover-elevate overflow-hidden">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                {p.displayName}
              </CardTitle>
              <CardDescription>
                {p.city ? `${p.city} · ` : ""}
                <a
                  href={`/p/${p.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  /p/{p.slug}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {p.tenants.map((t) => (
                  <li
                    key={t.businessId}
                    className={cn(
                      "flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 border rounded-lg px-3 py-3 transition-colors hover:border-primary/30",
                      verticalToneClass(t.vertical),
                    )}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{t.publicLabel}</span>
                        <VerticalBadge vertical={t.vertical} />
                        {t.isPrimary ? (
                          <span className="text-xs text-primary font-medium">Primary</span>
                        ) : null}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 truncate">{t.name}</p>
                    </div>
                    <a href={clientGuestBookAbsoluteUrl(t.slug)} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="w-full sm:w-auto">
                        Booking page
                      </Button>
                    </a>
                  </li>
                ))}
              </ul>
              {coTenantOpen === p.id ? (
                <div className="border rounded-lg p-4 space-y-3 bg-muted/30 animate-in fade-in duration-200">
                  <p className="text-sm font-medium">Add co-tenant at this address</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Business name</Label>
                      <Input value={coName} onChange={(e) => setCoName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Slug</Label>
                      <Input value={coSlug} onChange={(e) => setCoSlug(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Customer-facing label</Label>
                      <Input value={coLabel} onChange={(e) => setCoLabel(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Vertical</Label>
                      <Select value={coVertical} onValueChange={setCoVertical}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {VERTICALS.map((v) => (
                            <SelectItem key={v} value={v}>
                              {v.replace("-", " ")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => void handleProvisionCoTenant(p.id)}>
                      Provision tenant
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setCoTenantOpen(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => setCoTenantOpen(p.id)}>
                    Add co-tenant (you own both)
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setInviteOpen(p.id)}>
                    Invite separate owner
                  </Button>
                </div>
              )}
              {inviteOpen === p.id ? (
                <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                  <p className="text-sm font-medium">Invite another owner by email</p>
                  <p className="text-xs text-muted-foreground">
                    They keep their own tenant and clients — only the shared address page links you.
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Owner email</Label>
                      <Input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder={LIVIA_FORM_EXAMPLES.ownerEmail}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Customer-facing label</Label>
                      <Input
                        value={inviteLabel}
                        onChange={(e) => setInviteLabel(e.target.value)}
                        placeholder="e.g. Harbour Light Spa"
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => void handleInviteCoOwner(p.id)}>
                      Send invite link
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setInviteOpen(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : null}
              {lastInvitePath ? (
                <p className="text-xs text-muted-foreground">
                  Last invite:{" "}
                  <Link href={lastInvitePath} className="text-primary hover:underline">
                    {lastInvitePath}
                  </Link>
                </p>
              ) : null}
            </CardContent>
          </Card>
        ))
      )}
    </PageFrame>
  );
}
