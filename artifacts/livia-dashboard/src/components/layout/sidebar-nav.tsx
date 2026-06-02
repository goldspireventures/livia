import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import type { RitualNavItem } from "@/lib/persona-rituals";
import { groupNavBySection } from "@/lib/nav-sections";

type Props = {
  items: RitualNavItem[];
  accent: string;
  /** href → count badge (inbox handoffs, pending bookings, etc.) */
  badges?: Record<string, number>;
  collapsed?: boolean;
  /** Beauty W4: flat list, gradient active pill (northstar sidebar). */
  beautyNav?: boolean;
};

export function SidebarNav({ items, accent, badges, collapsed, beautyNav }: Props) {
  const [location] = useLocation();
  const groups = beautyNav
    ? [{ id: "flat" as const, label: "", items }]
    : groupNavBySection(items);

  return (
    <nav
      className={cn(
        "relative flex-1 min-h-0 overflow-y-auto px-2 py-2",
        beautyNav ? "beauty-sidebar-nav z-10 space-y-0.5" : "relative z-[1] space-y-3",
      )}
      data-testid="sidebar-nav"
    >
      {groups.map((group) => (
        <div key={group.id}>
          {!collapsed && group.label && !beautyNav ? (
            <p className="px-3 mb-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/80">
              {group.label}
            </p>
          ) : null}
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const isActive =
                location === item.href || location.startsWith(`${item.href}/`);
              const navAttention = beautyNav && !isActive && (badges?.[item.href] ?? 0) > 0;
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    title={collapsed ? item.ritualName : undefined}
                    className={cn(
                      "relative flex items-center gap-2.5 rounded-lg py-2.5 text-sm font-medium transition-colors cursor-pointer",
                      collapsed ? "justify-center px-2" : "px-3",
                      beautyNav
                        ? cn(
                            "beauty-nav-item",
                            isActive && "beauty-nav-item--active",
                            navAttention && "beauty-nav-item--attention",
                            !isActive && "text-muted-foreground",
                          )
                        : cn(
                            isActive
                              ? "text-foreground"
                              : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                          ),
                    )}
                    style={
                      !beautyNav && isActive
                        ? { backgroundColor: `${accent}18`, color: accent }
                        : undefined
                    }
                    data-testid={`nav-${item.href.replace(/\//g, "") || "home"}`}
                    data-active={isActive ? "true" : undefined}
                  >
                    <item.icon
                      className={cn("shrink-0", beautyNav ? "h-[18px] w-[18px]" : "h-4 w-4")}
                      strokeWidth={beautyNav ? 1.5 : 2}
                    />
                    {!collapsed ? (
                      <span className="truncate flex-1">{item.ritualName}</span>
                    ) : null}
                    {(badges?.[item.href] ?? 0) > 0 ? (
                      collapsed ? (
                        <span
                          className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary"
                          aria-label={`${badges![item.href]} items need attention`}
                        />
                      ) : (
                        <span
                          className="ml-auto min-w-[1.25rem] h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold flex items-center justify-center tabular-nums"
                          aria-label={`${badges![item.href]} items need attention`}
                        >
                          {badges![item.href] > 99 ? "99+" : badges![item.href]}
                        </span>
                      )
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
