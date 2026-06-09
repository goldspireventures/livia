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

type Props = {
  vertical: string | null | undefined;
  /** Info-only tiles — uniform size, no navigation */
  displayOnly?: boolean;
};

/** Vertical-tailored module grid for `/my` relationship surfaces. */
export function GuestMyVaultModules({ vertical, displayOnly = true }: Props) {
  const modules = guestMyModulesForVertical(vertical);

  return (
    <section className="space-y-2" data-testid="guest-my-vault-modules">
      <h2 className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
        {GUEST_HUB_COPY.relationshipSectionTitle}
      </h2>
      <ul className="grid gap-2 sm:grid-cols-2">
        {modules.map((m) => {
          const Icon = MODULE_ICONS[m.id];

          return (
            <li key={m.id}>
              <Card
                className={`border-border/80 bg-card/50 h-full ${
                  displayOnly ? "pointer-events-none select-none" : ""
                }`}
                data-testid={`guest-my-module-${m.id}`}
              >
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
              </Card>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
