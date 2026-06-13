import { useEffect, useState } from "react";
import { useBusiness } from "@/lib/business-context";
import { useToast } from "@/hooks/use-toast";
import { customFetch } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PersonaRitualHeader } from "@/components/ritual/persona-ritual-header";
import { PageFrame } from "@/components/ui/page-frame";
import { ExternalLink, Plus, Trash2 } from "lucide-react";

type MilestoneTemplate = { label: string; percent: number; dueDaysBeforeEvent?: number };

type Site = {
  heroTitle?: string | null;
  heroSubtitle?: string | null;
  aboutText?: string | null;
  defaultDepositPercent: number;
  quoteValidityDays: number;
  termsText?: string | null;
  setupFeeMinor: number;
  outdoorTermsExtra?: string | null;
  blockedDates: string[];
  gallery: Array<{ url: string; caption?: string; eventType?: string }>;
  milestoneDepositTemplate: MilestoneTemplate[];
};

export default function EventSitePage() {
  const { business } = useBusiness();
  const { toast } = useToast();
  const bid = business?.id ?? "";
  const [site, setSite] = useState<Site | null>(null);
  const [galleryUrl, setGalleryUrl] = useState("");
  const [blockedDate, setBlockedDate] = useState("");

  async function load() {
    if (!bid) return;
    try {
      setSite(await customFetch<Site>(`/api/businesses/${bid}/event-vendor/site`));
    } catch {
      setSite(null);
    }
  }

  useEffect(() => {
    void load();
  }, [bid]);

  async function save(patch: Partial<Site>) {
    if (!bid) return;
    try {
      const row = await customFetch<Site>(`/api/businesses/${bid}/event-vendor/site`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      setSite(row);
      toast({ title: "Saved" });
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    }
  }

  function updateMilestone(i: number, patch: Partial<MilestoneTemplate>) {
    if (!site) return;
    const milestoneDepositTemplate = [...site.milestoneDepositTemplate];
    milestoneDepositTemplate[i] = { ...milestoneDepositTemplate[i], ...patch };
    setSite({ ...site, milestoneDepositTemplate });
  }

  if (!site) return <PageFrame width="md">Loading…</PageFrame>;

  const publicUrl = business?.slug ? `${window.location.origin}/e/${business.slug}` : "";
  const publicGalleryUrl = business?.slug ? `${publicUrl}/gallery` : "";

  return (
    <PageFrame width="md" className="space-y-4" data-testid="event-site-page">
      <PersonaRitualHeader
        variant="page"
        title="Website"
        subtitle="Hero copy, gallery, deposit rules, and quote terms for your public site."
      />

      {publicUrl ? (
        <div className="rounded-xl border border-primary/20 bg-card/80 p-4 text-sm text-muted-foreground space-y-1">
          <p>
            Live website:{" "}
            <a href={publicUrl} className="text-primary underline inline-flex items-center gap-1" target="_blank" rel="noreferrer">
              {publicUrl}
              <ExternalLink className="h-3 w-3" />
            </a>
          </p>
          {publicGalleryUrl ? (
            <p className="text-xs">
              Pages: home ·{" "}
              <a href={publicGalleryUrl} className="underline" target="_blank" rel="noreferrer">
                gallery
              </a>{" "}
              ·{" "}
              <a href={`${publicUrl}/services`} className="underline" target="_blank" rel="noreferrer">
                services
              </a>{" "}
              ·{" "}
              <a href={`${publicUrl}/about`} className="underline" target="_blank" rel="noreferrer">
                about
              </a>{" "}
              ·{" "}
              <a href={`${publicUrl}/enquire`} className="underline" target="_blank" rel="noreferrer">
                enquire
              </a>
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="rounded-xl border bg-card/60 p-4 space-y-4">
      <div className="space-y-2">
        <Label>Hero title</Label>
        <Input
          value={site.heroTitle ?? ""}
          onChange={(e) => setSite({ ...site, heroTitle: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>Subtitle</Label>
        <Input
          value={site.heroSubtitle ?? ""}
          onChange={(e) => setSite({ ...site, heroSubtitle: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>About</Label>
        <Textarea
          value={site.aboutText ?? ""}
          onChange={(e) => setSite({ ...site, aboutText: e.target.value })}
          rows={4}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Default deposit %</Label>
          <Input
            type="number"
            value={site.defaultDepositPercent}
            onChange={(e) => setSite({ ...site, defaultDepositPercent: Number(e.target.value) })}
          />
        </div>
        <div className="space-y-2">
          <Label>Quote validity (days)</Label>
          <Input
            type="number"
            value={site.quoteValidityDays}
            onChange={(e) => setSite({ ...site, quoteValidityDays: Number(e.target.value) })}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Terms on quotes</Label>
        <Textarea
          value={site.termsText ?? ""}
          onChange={(e) => setSite({ ...site, termsText: e.target.value })}
          rows={3}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Travel & setup fee (€)</Label>
          <Input
            type="number"
            min={0}
            step={1}
            value={Math.round((site.setupFeeMinor ?? 0) / 100)}
            onChange={(e) =>
              setSite({ ...site, setupFeeMinor: Math.round(Number(e.target.value || 0) * 100) })
            }
            data-testid="event-site-setup-fee"
          />
          <p className="text-xs text-muted-foreground">Added as a line when venue is set on an enquiry.</p>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Outdoor / weather contingency (appended to quote terms)</Label>
        <Textarea
          value={site.outdoorTermsExtra ?? ""}
          onChange={(e) => setSite({ ...site, outdoorTermsExtra: e.target.value })}
          rows={2}
          placeholder="e.g. Outdoor installs may reschedule for high wind…"
          data-testid="event-site-outdoor-terms"
        />
      </div>
      </div>

      <div className="rounded-xl border bg-card/60 p-4 space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Default milestone schedule (applied to new quotes)</Label>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() =>
              setSite({
                ...site,
                milestoneDepositTemplate: [
                  ...site.milestoneDepositTemplate,
                  { label: "Balance", percent: 70, dueDaysBeforeEvent: 7 },
                ],
              })
            }
          >
            <Plus className="h-3 w-3 mr-1" />
            Add
          </Button>
        </div>
        {site.milestoneDepositTemplate.map((m, i) => (
          <div key={i} className="grid grid-cols-4 gap-2 items-center">
            <Input value={m.label} onChange={(e) => updateMilestone(i, { label: e.target.value })} />
            <Input
              type="number"
              value={m.percent}
              onChange={(e) => updateMilestone(i, { percent: Number(e.target.value) })}
            />
            <Input
              type="number"
              placeholder="Days before"
              value={m.dueDaysBeforeEvent ?? ""}
              onChange={(e) =>
                updateMilestone(i, {
                  dueDaysBeforeEvent: e.target.value ? Number(e.target.value) : undefined,
                })
              }
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() =>
                setSite({
                  ...site,
                  milestoneDepositTemplate: site.milestoneDepositTemplate.filter((_, j) => j !== i),
                })
              }
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
        {site.milestoneDepositTemplate.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Leave empty to use a single deposit milestone matching your default deposit %.
          </p>
        ) : null}
      </div>
      </div>

      <div className="rounded-xl border bg-card/60 p-4 space-y-4">
      <div className="space-y-2">
        <Label>Add gallery image URL</Label>
        <div className="flex gap-2">
          <Input value={galleryUrl} onChange={(e) => setGalleryUrl(e.target.value)} placeholder="https://…" />
          <Button
            type="button"
            onClick={() => {
              if (!galleryUrl) return;
              const gallery = [...site.gallery, { url: galleryUrl }];
              setSite({ ...site, gallery });
              setGalleryUrl("");
            }}
          >
            Add
          </Button>
        </div>
        <ul className="space-y-1 text-sm">
          {site.gallery.map((g) => (
            <li key={g.url} className="truncate text-muted-foreground">
              {g.caption ?? g.url}
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-2">
        <Label>Block event date (full)</Label>
        <div className="flex gap-2">
          <Input type="date" value={blockedDate} onChange={(e) => setBlockedDate(e.target.value)} />
          <Button
            type="button"
            onClick={() => {
              if (!blockedDate) return;
              const blockedDates = [...new Set([...site.blockedDates, blockedDate])];
              setSite({ ...site, blockedDates });
              setBlockedDate("");
            }}
          >
            Block
          </Button>
        </div>
        {site.blockedDates.length > 0 ? (
          <ul className="space-y-1 text-sm">
            {site.blockedDates.map((d) => (
              <li key={d} className="flex items-center justify-between gap-2 text-muted-foreground">
                <span>{d}</span>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() =>
                    setSite({ ...site, blockedDates: site.blockedDates.filter((x) => x !== d) })
                  }
                  aria-label={`Unblock ${d}`}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      </div>

      <Button onClick={() => void save(site)} data-testid="event-site-save">
        Save all
      </Button>
    </PageFrame>
  );
}
