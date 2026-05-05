import { Link, useLocation } from "wouter";
import { ReactNode } from "react";
import { useBusiness } from "@/lib/business-context";
import { UserButton } from "@clerk/clerk-react";
import { LayoutDashboard, CalendarDays, Users, UsersRound, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Bookings", href: "/bookings", icon: CalendarDays },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Staff & Services", href: "/staff", icon: UsersRound },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { business } = useBusiness();

  return (
    <div className="flex min-h-[100dvh] w-full flex-col bg-background md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 flex-col border-r border-border bg-card/50 md:flex">
        <div className="flex h-16 shrink-0 items-center border-b border-border px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold">
              {business?.name.charAt(0).toUpperCase() || "B"}
            </div>
            <span className="font-semibold truncate max-w-[140px]">{business?.name || "Bliq"}</span>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.href || location.startsWith(`${item.href}/`);
            return (
              <Link key={item.name} href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors cursor-pointer",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </div>
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-4">
          <div className="flex items-center gap-3">
            <UserButton afterSignOutUrl="/sign-in" />
            <span className="text-sm font-medium text-muted-foreground">Account</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 pb-16 md:pb-0 h-[100dvh] overflow-y-auto">
        {/* Mobile Header */}
        <header className="flex h-14 items-center justify-between border-b border-border bg-card/50 px-4 md:hidden sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-xs">
              {business?.name.charAt(0).toUpperCase() || "B"}
            </div>
            <span className="font-semibold text-sm truncate max-w-[120px]">{business?.name || "Bliq"}</span>
          </div>
          <UserButton afterSignOutUrl="/sign-in" />
        </header>

        <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto">{children}</div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-border bg-card px-2 md:hidden">
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.href || location.startsWith(`${item.href}/`);
          return (
            <Link key={item.name} href={item.href}>
              <div
                className={cn(
                  "flex flex-col items-center justify-center gap-1 w-16 h-full cursor-pointer",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{item.name.split(" ")[0]}</span>
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
