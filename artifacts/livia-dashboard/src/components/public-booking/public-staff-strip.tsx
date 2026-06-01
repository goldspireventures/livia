import { cn } from "@/lib/utils";
import { staffStripScrollHint } from "@/lib/public-featured-services";
import type { PublicStaffRow } from "@/lib/public-booking-helpers";

export function PublicStaffStrip({
  staff,
  selectedStaffId,
  onSelect,
  teamNoun,
}: {
  staff: PublicStaffRow[];
  selectedStaffId: string;
  onSelect: (staffId: string) => void;
  teamNoun: string;
}) {
  if (staff.length < 2) return null;

  const scrollHint = staffStripScrollHint(staff.length, teamNoun);
  const scrollable = staff.length >= 4;

  return (
    <section className="mb-6" aria-labelledby="public-staff-heading" data-testid="public-staff-strip">
      <div className="flex items-end justify-between gap-2 mb-3">
        <h2 id="public-staff-heading" className="text-sm font-medium">
          Choose your {teamNoun.toLowerCase()}
        </h2>
        {scrollHint ? (
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground shrink-0">
            {scrollHint}
          </p>
        ) : null}
      </div>
      <div
        className={cn("public-staff-scroll", scrollable && "public-staff-scroll--fade")}
        data-scrollable={scrollable ? "true" : undefined}
      >
        <div
          className="public-staff-scroll__track flex gap-3 pb-1 -mx-1 px-1 snap-x snap-mandatory"
          role="list"
          aria-label={`${teamNoun} selection`}
        >
          <button
            type="button"
            onClick={() => onSelect("")}
            className={cn(
              "snap-start shrink-0 flex flex-col items-center gap-2 min-w-[5.5rem] rounded-xl border px-3 py-3 transition-colors",
              !selectedStaffId
                ? "border-primary bg-primary/10 public-staff-card--selected"
                : "border-border hover:border-primary/40",
            )}
            data-testid="public-staff-any"
            role="listitem"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-xs font-medium">
              Any
            </span>
            <span className="text-[11px] font-medium text-center leading-tight">First available</span>
          </button>
          {staff.map((s) => {
            const active = selectedStaffId === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onSelect(s.id)}
                className={cn(
                  "snap-start shrink-0 flex flex-col items-center gap-2 min-w-[5.5rem] rounded-xl border px-3 py-3 transition-colors",
                  active
                    ? "border-primary bg-primary/10 public-staff-card--selected"
                    : "border-border hover:border-primary/40",
                )}
                data-testid={`public-staff-${s.id}`}
                role="listitem"
              >
                {s.photoUrl ? (
                  <img
                    src={s.photoUrl}
                    alt=""
                    className="h-12 w-12 rounded-full object-cover border border-border/50"
                  />
                ) : (
                  <span
                    className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-semibold text-white"
                    style={{ backgroundColor: s.color ?? "hsl(var(--primary))" }}
                  >
                    {s.displayName.charAt(0)}
                  </span>
                )}
                <span className="text-[11px] font-medium text-center leading-tight max-w-[6rem] truncate">
                  {s.displayName.split(" ")[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
