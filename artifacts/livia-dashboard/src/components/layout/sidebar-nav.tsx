import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import type { RitualNavItem } from "@/lib/persona-rituals";
import { groupNavBySection } from "@/lib/nav-sections";

type Props = {
  items: RitualNavItem[];
  accent: string;
  /** href → count badge (inbox handoffs, pending bookings, etc.) */
  badges?: Record<string, number>;
};

export function SidebarNav({ items, accent, badges }: Props) {
  const [location] = useLocation();
  const groups = groupNavBySection(items);

  return (
    <nav className="flex-1 overflow-y-auto p-3 space-y-4" data-testid="sidebar-nav">
      {groups.map((group) => (
        <div key={group.id}>
          <p className="px-3 mb-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/80">
            {group.label}
          </p>
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const isActive =
                location === item.href || location.startsWith(`${item.href}/`);
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer",
                      isActive
                        ? "text-foreground"
                        : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                    )}
                    style={
                      isActive
                        ? { backgroundColor: `${accent}18`, color: accent }
                        : undefined
                    }
                    data-testid={`nav-${item.href.replace(/\//g, "") || "home"}`}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="truncate flex-1">{item.ritualName}</span>
                    {(badges?.[item.href] ?? 0) > 0 ? (
                      <span
                        className="ml-auto min-w-[1.25rem] h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold flex items-center justify-center tabular-nums"
                        aria-label={`${badges![item.href]} items need attention`}
                      >
                        {badges![item.href] > 99 ? "99+" : badges![item.href]}
                      </span>
                    ) : null}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
