import { mobileBottomNavLabel } from "@/lib/nav-sections";
import { Link, useLocation } from "wouter";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RitualNavItem } from "@/lib/persona-rituals";
import { splitMobileNav } from "@/lib/nav-sections";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

type Props = {
  items: RitualNavItem[];
  accent: string;
  badges?: Record<string, number>;
};

export function MobileBottomNav({ items, accent, badges }: Props) {
  const [location] = useLocation();
  const { primary, overflow } = splitMobileNav(items);

  const linkClass = (active: boolean) =>
    cn(
      "flex flex-col items-center justify-center gap-1 flex-1 min-h-[52px] min-w-0 px-0.5",
      active ? "text-foreground" : "text-muted-foreground",
    );

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex min-h-16 items-stretch justify-around border-t border-border bg-card/98 backdrop-blur-md px-1 pt-1 pb-[max(0.35rem,env(safe-area-inset-bottom))] md:hidden"
      data-testid="mobile-bottom-nav"
    >
      {primary.map((item) => {
        const isActive = location === item.href || location.startsWith(`${item.href}/`);
        const label = mobileBottomNavLabel(item.ritualName);
        return (
          <Link key={item.href} href={item.href} className="flex flex-1 min-w-0">
            <div className={linkClass(isActive)} style={isActive ? { color: accent } : undefined}>
              <span className="relative flex h-6 items-center justify-center">
                <item.icon className="h-5 w-5 shrink-0" strokeWidth={isActive ? 2.25 : 2} />
                {(badges?.[item.href] ?? 0) > 0 ? (
                  <span className="absolute -top-1 -right-2.5 min-w-[15px] h-[15px] px-0.5 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center leading-none">
                    {badges![item.href] > 9 ? "9+" : badges![item.href]}
                  </span>
                ) : null}
              </span>
              <span className="text-[10px] font-medium leading-tight text-center line-clamp-2 max-w-[4.75rem]">
                {label}
              </span>
            </div>
          </Link>
        );
      })}
      {overflow.length > 0 ? (
        <Sheet>
          <SheetTrigger asChild>
            <button
              type="button"
              className={cn(linkClass(false), "flex-1 border-0 bg-transparent")}
              aria-label="More navigation"
            >
              <MoreHorizontal className="h-5 w-5" />
              <span className="text-[10px] font-medium">More</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl pb-8 max-h-[70vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="font-serif text-left">Go to</SheetTitle>
            </SheetHeader>
            <div className="grid gap-1 mt-4">
              {overflow.map((item) => {
                const isActive = location === item.href || location.startsWith(`${item.href}/`);
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className="w-full justify-start gap-3 h-11"
                      style={isActive ? { borderColor: `${accent}44` } : undefined}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {item.ritualName}
                    </Button>
                  </Link>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>
      ) : null}
    </nav>
  );
}
