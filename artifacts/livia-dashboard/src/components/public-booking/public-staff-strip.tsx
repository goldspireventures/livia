import { cn } from "@/lib/utils";
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

  return (
    <section className="mb-6" aria-labelledby="public-staff-heading" data-testid="public-staff-strip">
      <h2 id="public-staff-heading" className="text-sm font-medium mb-3">
        Choose your {teamNoun.toLowerCase()}
      </h2>
      <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory">
        <button
          type="button"
          onClick={() => onSelect("")}
          className={cn(
            "snap-start shrink-0 flex flex-col items-center gap-2 min-w-[5.5rem] rounded-xl border px-3 py-3 transition-colors",
            !selectedStaffId
              ? "border-primary bg-primary/10"
              : "border-border hover:border-primary/40",
          )}
          data-testid="public-staff-any"
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
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/40",
              )}
              data-testid={`public-staff-${s.id}`}
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
    </section>
  );
}
