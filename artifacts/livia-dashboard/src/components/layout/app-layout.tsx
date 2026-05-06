import { Link, useLocation } from "wouter";
import { ReactNode } from "react";
import { useBusiness } from "@/lib/business-context";
import { useMembership, type Role } from "@/lib/membership-context";
import { UserButton } from "@clerk/clerk-react";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  UsersRound,
  Settings,
  Inbox,
  Sun,
  Eye,
  EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useListStaff, type Staff } from "@workspace/api-client-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface NavItem {
  name: string;
  href: string;
  icon: typeof LayoutDashboard;
  // The minimum *effective* role allowed to see this item. STAFF only
  // sees items where `min === "STAFF"`.
  min: Role;
}

const NAV_ITEMS: NavItem[] = [
  { name: "My Day",          href: "/my-day",   icon: Sun,             min: "STAFF" },
  { name: "Dashboard",       href: "/dashboard",icon: LayoutDashboard, min: "ADMIN" },
  { name: "Inbox",           href: "/inbox",    icon: Inbox,           min: "ADMIN" },
  { name: "Bookings",        href: "/bookings", icon: CalendarDays,    min: "STAFF" },
  { name: "Customers",       href: "/customers",icon: Users,           min: "STAFF" },
  { name: "Staff & Services",href: "/staff",    icon: UsersRound,      min: "STAFF" },
  { name: "Settings",        href: "/settings", icon: Settings,        min: "STAFF" },
];

const RANK: Record<Role, number> = { STAFF: 1, ADMIN: 2, OWNER: 3 };

function visibleNav(effectiveRole: Role | null): NavItem[] {
  if (!effectiveRole) return [];
  return NAV_ITEMS.filter((i) => RANK[effectiveRole] >= RANK[i.min]);
}

function PersonaSwitcher() {
  const { business } = useBusiness();
  const { role, viewingAsStaffId, setViewingAsStaffId } = useMembership();
  const { data: staff } = useListStaff(business?.id ?? "", {}, {
    query: { enabled: !!business?.id && (role === "OWNER" || role === "ADMIN") } as any,
  });

  if (role !== "OWNER" && role !== "ADMIN") return null;

  const value = viewingAsStaffId ?? "__owner__";
  return (
    <div className="px-4 py-2 border-t border-border">
      <label className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-1 mb-1">
        {viewingAsStaffId ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
        View as
      </label>
      <Select
        value={value}
        onValueChange={(v) => setViewingAsStaffId(v === "__owner__" ? null : v)}
      >
        <SelectTrigger className="h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__owner__">Myself ({role.toLowerCase()})</SelectItem>
          {((staff ?? []) as Staff[]).map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.displayName} (staff)
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {viewingAsStaffId ? (
        <p className="text-[10px] text-muted-foreground mt-1">
          Read-only preview of a staff member's view.
        </p>
      ) : null}
    </div>
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { business } = useBusiness();
  const { effectiveRole, role, viewingAsStaffId } = useMembership();
  const items = visibleNav(effectiveRole);

  return (
    <div className="flex min-h-[100dvh] w-full flex-col bg-background md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 flex-col border-r border-border bg-card/50 md:flex">
        <div className="flex h-16 shrink-0 items-center border-b border-border px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold">
              {business?.name.charAt(0).toUpperCase() || "B"}
            </div>
            <div className="min-w-0">
              <span className="font-semibold truncate block max-w-[140px]">{business?.name || "Livia"}</span>
              {role ? (
                <Badge variant="outline" className="text-[9px] py-0 h-4">
                  {viewingAsStaffId ? "STAFF (preview)" : role}
                </Badge>
              ) : null}
            </div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {items.map((item) => {
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
        <PersonaSwitcher />
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
            <span className="font-semibold text-sm truncate max-w-[120px]">{business?.name || "Livia"}</span>
          </div>
          <UserButton afterSignOutUrl="/sign-in" />
        </header>

        <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto">{children}</div>
      </main>

      {/* Mobile Bottom Nav — at most 5 items, so trim sensibly */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-border bg-card px-2 md:hidden">
        {items.slice(0, 5).map((item) => {
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
