import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DesignProofVersionFrame } from "@/components/body-art/design-proof-version-frame";
import { clientGuestSurfacePathFromUrl } from "@/lib/guest-book-url";
import {
  Car,
  ClipboardList,
  Image,
  PawPrint,
  Scissors,
  Sparkles,
  Dumbbell,
} from "lucide-react";
import { GUEST_HUB_COPY } from "@workspace/policy";

export type GuestMyArtifacts = {
  pets: Array<{
    id: string;
    name: string;
    species: string;
    breed: string | null;
    behaviourNotes: string | null;
    allergyNotes: string | null;
  }>;
    proofs: Array<{
      proofId: string;
      status: string;
      note: string | null;
      imageUrl?: string | null;
      reviewUrl: string;
      version?: number;
      versions?: Array<{
        version: number;
        imageUrl: string | null;
        createdAt?: string;
      }>;
    }>;
  vehicleHighlight: string | null;
  consentItems?: Array<{
    id: string;
    label: string;
    status: string;
    kind: "consent" | "intake";
    actionUrl: string | null;
  }>;
  carePlan?: {
    name: string;
    sessionsCompleted: number;
    sessionsTotal: number;
    cadenceDays: number;
    status: string;
    nextBookHint?: string | null;
  } | null;
  wellnessPrep?: string[];
  preferredStylist?: { staffId: string; displayName: string } | null;
  beautyMemory?: { patchTestValid: boolean; fillDueHint: string | null } | null;
  fitnessStatus?: {
    enrollments: Array<{
      title: string;
      startsAt: string;
      status: string;
      waitlistPosition: number | null;
    }>;
  } | null;
};

export function GuestMyArtifactPanels({
  artifacts,
  vertical,
  hideProofs = false,
  hubToken,
  shopSlug,
}: {
  artifacts: GuestMyArtifacts;
  vertical?: string | null;
  /** Visit page renders proofs in the engagement strip — avoid duplicate cards. */
  hideProofs?: boolean;
  hubToken?: string | null;
  shopSlug?: string | null;
}) {
  const consentItems = artifacts.consentItems ?? [];
  const wellnessPrep = artifacts.wellnessPrep ?? [];
  const hasPets = artifacts.pets.length > 0;
  const hasProofs = !hideProofs && artifacts.proofs.length > 0;
  const hasVehicle = Boolean(artifacts.vehicleHighlight);
  const hasConsent = consentItems.length > 0;
  const hasCarePlan = Boolean(artifacts.carePlan);
  const hasWellnessPrep = wellnessPrep.length > 0;
  const hasStylist = Boolean(artifacts.preferredStylist);
  const hasBeautyMemory = Boolean(
    artifacts.beautyMemory?.fillDueHint || artifacts.beautyMemory?.patchTestValid === false,
  );
  const hasFitness = (artifacts.fitnessStatus?.enrollments.length ?? 0) > 0;

  if (
    !hasPets &&
    !hasProofs &&
    !hasVehicle &&
    !hasConsent &&
    !hasCarePlan &&
    !hasWellnessPrep &&
    !hasStylist &&
    !hasBeautyMemory &&
    !hasFitness
  ) {
    return null;
  }

  return (
    <section className="space-y-3" data-testid="guest-my-artifact-panels">
      {hasProofs ? (
        <Card className="border-primary/25" data-testid="guest-design-proof-panel">
          <CardContent className="py-4 space-y-3">
            <p className="text-[10px] uppercase tracking-widest font-mono text-primary flex items-center gap-1.5">
              <Image className="h-3.5 w-3.5" />
              {vertical === "body-art" ? "Design proof — approve before your session" : "Design proof"}
            </p>
            {artifacts.proofs.map((proof) => (
              <DesignProofVersionFrame
                key={proof.proofId}
                proof={proof}
                testIdPrefix="guest-my-proof"
                hubToken={hubToken}
                shopSlug={shopSlug}
              />
            ))}
          </CardContent>
        </Card>
      ) : null}

      {hasConsent ? (
        <Card
          id="guest-consent"
          className="border-violet-500/25 bg-violet-500/5"
          data-testid="guest-consent-panel"
        >
          <CardContent className="py-4 space-y-3">
            <p className="text-[10px] uppercase tracking-widest font-mono text-violet-700 dark:text-violet-300 flex items-center gap-1.5">
              <ClipboardList className="h-3.5 w-3.5" />
              Forms & consent
            </p>
            {consentItems.map((item) => {
              const href = item.actionUrl
                ? clientGuestSurfacePathFromUrl(item.actionUrl)
                : null;
              return (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-3 text-sm rounded-lg border border-transparent hover:border-violet-500/20 px-2 py-1.5 -mx-2 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground capitalize mt-0.5">
                      {item.status.replace(/_/g, " ")}
                    </p>
                  </div>
                  {href ? (
                    <Button size="sm" variant="outline" className="shrink-0 gap-1" asChild>
                      <Link href={href} data-testid={`guest-consent-complete-${item.id}`}>
                        Complete
                      </Link>
                    </Button>
                  ) : item.status === "pending" || item.status === "draft" ? (
                    <span className="text-xs text-muted-foreground shrink-0">With studio</span>
                  ) : null}
                </div>
              );
            })}
          </CardContent>
        </Card>
      ) : null}

      {hasCarePlan && artifacts.carePlan ? (
        <Card className="border-emerald-500/25 bg-emerald-500/5">
          <CardContent className="py-4 text-sm">
            <p className="text-[10px] uppercase tracking-widest font-mono text-emerald-700 dark:text-emerald-300 mb-2">
              Care plan
            </p>
            <p className="font-medium">{artifacts.carePlan.name}</p>
            <p className="text-muted-foreground mt-1 tabular-nums">
              Session {artifacts.carePlan.sessionsCompleted + 1} of {artifacts.carePlan.sessionsTotal}
              {" · "}
              every {artifacts.carePlan.cadenceDays} days
            </p>
            {artifacts.carePlan.nextBookHint ? (
              <p className="text-xs text-emerald-800/90 dark:text-emerald-200/90 mt-2">
                {artifacts.carePlan.nextBookHint}
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {hasStylist && artifacts.preferredStylist ? (
        <Card className="border-rose-500/25 bg-rose-500/5">
          <CardContent className="py-4 text-sm flex gap-3">
            <Scissors className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] uppercase tracking-widest font-mono text-muted-foreground mb-1">
                Your stylist
              </p>
              <p className="font-medium">{artifacts.preferredStylist.displayName}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Book again to stay with the same person.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {hasBeautyMemory && artifacts.beautyMemory ? (
        <Card className="border-fuchsia-500/25 bg-fuchsia-500/5">
          <CardContent className="py-4 text-sm">
            <p className="text-[10px] uppercase tracking-widest font-mono text-fuchsia-700 dark:text-fuchsia-300 mb-2">
              Studio memory
            </p>
            {artifacts.beautyMemory.patchTestValid ? (
              <p className="text-muted-foreground">Patch test on file — you&apos;re cleared for colour services.</p>
            ) : (
              <p className="text-amber-800/90 dark:text-amber-200/90">
                Patch test may be required — confirm when you book.
              </p>
            )}
            {artifacts.beautyMemory.fillDueHint ? (
              <p className="mt-2 font-medium">{artifacts.beautyMemory.fillDueHint}</p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {hasFitness && artifacts.fitnessStatus ? (
        <Card className="border-orange-500/25 bg-orange-500/5">
          <CardContent className="py-4 space-y-2 text-sm">
            <p className="text-[10px] uppercase tracking-widest font-mono text-orange-700 dark:text-orange-300 flex items-center gap-1.5">
              <Dumbbell className="h-3.5 w-3.5" />
              Classes
            </p>
            {artifacts.fitnessStatus.enrollments.map((e) => (
              <div key={`${e.title}-${e.startsAt}`}>
                <p className="font-medium">{e.title}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {e.status === "waitlisted"
                    ? `Waitlist #${e.waitlistPosition ?? "?"}`
                    : "Enrolled"}{" "}
                  · {new Date(e.startsAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {hasWellnessPrep ? (
        <Card className="border-teal-500/25 bg-teal-500/5">
          <CardContent className="py-4 text-sm">
            <p className="text-[10px] uppercase tracking-widest font-mono text-teal-700 dark:text-teal-300 flex items-center gap-1.5 mb-2">
              <Sparkles className="h-3.5 w-3.5" />
              Before your visit
            </p>
            <ul className="space-y-1 text-muted-foreground">
              {wellnessPrep.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {hasPets ? (
        <Card className="border-amber-500/25 bg-amber-500/5">
          <CardContent className="py-4 space-y-3">
            <p className="text-[10px] uppercase tracking-widest font-mono text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
              <PawPrint className="h-3.5 w-3.5" />
              {GUEST_HUB_COPY.petSectionTitle}
            </p>
            {artifacts.pets.map((pet) => (
              <div key={pet.id} className="text-sm">
                <p className="font-medium">
                  {pet.name}
                  <span className="text-muted-foreground font-normal">
                    {" "}
                    · {pet.species}
                    {pet.breed ? ` · ${pet.breed}` : ""}
                  </span>
                </p>
                {pet.behaviourNotes ? (
                  <p className="text-xs text-muted-foreground mt-1">{pet.behaviourNotes}</p>
                ) : null}
                {pet.allergyNotes ? (
                  <p className="text-xs text-amber-800/80 dark:text-amber-200/80 mt-1">
                    Allergies: {pet.allergyNotes}
                  </p>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {hasVehicle ? (
        <Card className="border-slate-500/25 bg-slate-500/5">
          <CardContent className="py-4 text-sm flex gap-3">
            <Car className="h-4 w-4 text-slate-600 dark:text-slate-300 shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] uppercase tracking-widest font-mono text-muted-foreground mb-1">
                Your vehicle
              </p>
              <p>{artifacts.vehicleHighlight}</p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <p className="text-[10px] text-center text-muted-foreground">
        {GUEST_HUB_COPY.artifactFooter}
      </p>
    </section>
  );
}
