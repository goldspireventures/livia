import { Card, CardContent } from "@/components/ui/card";
import {
  guestMyModulesForVertical,
  GUEST_HUB_COPY,
  type GuestMyModuleId,
} from "@workspace/policy";
import {
  CalendarCheck,
  Car,
  ClipboardCheck,
  Image,
  MessageSquare,
  Package,
  PawPrint,
  Scissors,
  Sparkles,
  Stethoscope,
  Ticket,
} from "lucide-react";
import { cn } from "@/lib/utils";

const MODULE_ICONS: Record<GuestMyModuleId, typeof Sparkles> = {
  visit: CalendarCheck,
  message: MessageSquare,
  rebook: CalendarCheck,
  package: Package,
  proof: Image,
  consent: ClipboardCheck,
  memory: Sparkles,
  pet: PawPrint,
  vehicle: Car,
  class_pack: Ticket,
  care_plan: Stethoscope,
  stylist: Scissors,
};

const MODULE_TARGETS: Partial<Record<GuestMyModuleId, string>> = {
  visit: "guest-hub-visit-hero",
  message: "guest-hub-visit-message",
  proof: "guest-design-proof-panel",
  memory: "guest-hub-memory",
};

type Props = {
  vertical: string | null | undefined;
  /** Info-only tiles — uniform size, no navigation */
  displayOnly?: boolean;
  bookUrl?: string;
};

function scrollToTarget(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/** Vertical-tailored module grid for `/my` relationship surfaces. */
export function GuestMyVaultModules({ vertical, displayOnly = true, bookUrl }: Props) {
  const modules = guestMyModulesForVertical(vertical);
  const interactive = !displayOnly;

  function onModuleClick(id: GuestMyModuleId) {
    if (id === "rebook" && bookUrl) {
      window.location.href = bookUrl;
      return;
    }
    const target = MODULE_TARGETS[id];
    if (target) scrollToTarget(target);
  }

  return (
    <section className="space-y-2" data-testid="guest-my-vault-modules">
      <h2 className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
        {GUEST_HUB_COPY.relationshipSectionTitle}
      </h2>
      <ul className="grid gap-2 sm:grid-cols-2">
        {modules.map((m) => {
          const Icon = MODULE_ICONS[m.id];
          const clickable = interactive && (MODULE_TARGETS[m.id] || (m.id === "rebook" && bookUrl));

          const inner = (
            <CardContent className="flex items-center gap-2.5 py-2.5 px-3 min-h-[3.25rem]">
              <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-xs leading-tight">{m.label}</p>
                <p className="text-[11px] text-muted-foreground leading-snug mt-0.5 line-clamp-2">
                  {m.description}
                </p>
              </div>
            </CardContent>
          );

          return (
            <li key={m.id}>
              {clickable ? (
                <button
                  type="button"
                  onClick={() => onModuleClick(m.id)}
                  className={cn(
                    "w-full text-left rounded-lg border border-border/80 bg-card/50 h-full",
                    "hover:border-primary/35 hover:bg-primary/5 transition-colors cursor-pointer",
                  )}
                  data-testid={`guest-my-module-${m.id}`}
                >
                  {inner}
                </button>
              ) : (
                <Card
                  className={cn(
                    "border-border/80 bg-card/50 h-full",
                    displayOnly && "pointer-events-none select-none",
                  )}
                  data-testid={`guest-my-module-${m.id}`}
                >
                  {inner}
                </Card>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
