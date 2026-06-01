import { useEffect, type ReactNode } from "react";
import {
  applyExperienceTheme,
  applyPresentationTheme,
  resolvePresentationColorMode,
} from "@/lib/experience-theme";
import {
  Calendar,
  Inbox,
  LayoutGrid,
  Settings,
  Sparkles,
  Users,
  Scissors,
} from "lucide-react";
import { BeautySidebarBrand } from "@/components/brand/beauty-sidebar-brand";
import { SidebarBeautyBloom } from "@/components/brand/sidebar-beauty-bloom";
import { cn } from "@/lib/utils";
import { isBeautyPresentationPreset, isBeautyVertical } from "@/lib/presentation-layout";

/** Northstar-aligned labels — matches dashboard-owner-solo.target density. */
const BEAUTY_PREVIEW_NAV: Array<{
  label: string;
  icon: typeof LayoutGrid;
  active?: boolean;
}> = [
  { label: "Today", icon: LayoutGrid, active: true },
  { label: "Inbox", icon: Inbox },
  { label: "Bookings", icon: Calendar },
  { label: "Services", icon: Scissors },
  { label: "Customers", icon: Users },
  { label: "Settings", icon: Settings },
];

type Props = {
  businessName: string;
  vertical?: string | null;
  cssPreset?: string | null;
  brandAccentHex?: string | null;
  children: ReactNode;
  /** Scaled iframe embed — compact sidebar + full canvas width */
  embed?: boolean;
};

/** Mini W4 chrome for Store appearance iframe — mirrors signed-in app layout. */
export function AppearancePreviewShell({
  businessName,
  vertical,
  cssPreset,
  brandAccentHex,
  children,
  embed = false,
}: Props) {
  const beauty = isBeautyVertical(vertical);
  const noirBeauty = beauty && isBeautyPresentationPreset(cssPreset);

  useEffect(() => {
    applyExperienceTheme({ vertical, persona: "owner" });
    if (cssPreset) {
      const colorMode = resolvePresentationColorMode(cssPreset);
      applyPresentationTheme({
        cssPreset,
        brandAccentHex: brandAccentHex ?? null,
        colorMode,
      });
    }
  }, [vertical, cssPreset, brandAccentHex]);

  return (
    <div
      className={cn(
        "flex w-full bg-background text-foreground",
        embed ? "min-h-[720px]" : "h-full min-h-0",
      )}
      data-testid="appearance-preview-shell"
    >
      <aside
        data-testid="app-shell-sidebar"
        className={cn(
          "app-shell-sidebar relative flex shrink-0 flex-col border-r border-border/40 overflow-hidden",
          embed ? "w-[11.5rem]" : "hidden sm:flex w-[13.5rem]",
          beauty && "beauty-sidebar-with-bloom",
          embed && beauty && "appearance-preview-sidebar",
          !noirBeauty && "bg-card/40",
        )}
      >
        {beauty ? (
          <>
            <div className="beauty-sidebar-stack relative z-[2] flex min-h-0 flex-1 flex-col">
              <BeautySidebarBrand businessName={businessName} compact={embed} />
              <nav
                className={cn(
                  "beauty-sidebar-nav relative flex-1 min-h-0 overflow-y-auto",
                  embed ? "px-1.5 py-1 space-y-0" : "px-2 py-2 space-y-0.5",
                )}
                aria-label="Preview navigation"
              >
                {BEAUTY_PREVIEW_NAV.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.label}
                      className={cn(
                        "beauty-nav-item flex items-center gap-2 rounded-lg font-medium",
                        embed ? "px-2.5 py-2 text-[12px]" : "gap-2.5 px-3 py-2.5 text-[13px]",
                        item.active ? "beauty-nav-item--active" : "text-muted-foreground",
                      )}
                    >
                      <Icon
                        className={cn("shrink-0", embed ? "h-4 w-4" : "h-[18px] w-[18px]")}
                        strokeWidth={1.5}
                        aria-hidden
                      />
                      <span className="truncate">{item.label}</span>
                    </div>
                  );
                })}
              </nav>
            </div>
            <div
              className={cn("beauty-sidebar-bloom-reserve", embed && "appearance-preview-bloom-reserve")}
              aria-hidden
            >
              <SidebarBeautyBloom />
            </div>
          </>
        ) : (
          <>
            <div className="px-3 py-3 text-xs text-muted-foreground truncate">{businessName}</div>
            <nav className="flex-1 px-2 py-2" aria-label="Preview navigation" />
          </>
        )}
      </aside>
      <main
        className={cn(
          "app-shell-main flex-1 min-w-0 overscroll-y-contain",
          embed ? "p-4 overflow-visible" : "overflow-y-auto p-4 sm:p-5",
        )}
      >
        {children}
      </main>
    </div>
  );
}
