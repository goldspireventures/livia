import { Link, useLocation } from "wouter";

import { ReactNode, useEffect, useState } from "react";

import { useBusiness } from "@/lib/business-context";

import { useMembership, type Role } from "@/lib/membership-context";

import {

  PERSONA_ACCENT,

  PERSONA_LABEL,

  isDemoLoginEnabled,

  usePersona,

} from "@/lib/persona";

import { getRitualNav } from "@/lib/persona-rituals";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { LiviaWordmark } from "@/components/brand/LiviaMark";
import { applyExperienceTheme, applyPresentationTheme } from "@/lib/experience-theme";
import { fetchUserLifecycle } from "@/lib/lifecycle-api";
import { useTenantExperience } from "@/lib/tenant-experience-api";

import { UserButton } from "@clerk/clerk-react";

const accountMenuAppearance = {
  elements: {
    userButtonTrigger: { "aria-label": "Open account menu" },
  },
} as const;

import { Eye, EyeOff } from "lucide-react";

import { useToast } from "@/hooks/use-toast";

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

import { KeysChangedRitual } from "@/components/lifecycle/keys-changed-ritual";
import { OnboardingProgressBanner } from "@/components/onboarding-progress-banner";
import { OperatorMaturityBanner } from "@/components/operator-maturity-banner";
import { PlatformTour } from "@/components/platform-tour";
import { NotificationAlertStrip } from "@/components/notification-alert-strip";
import { NotificationCenter } from "@/components/notification-center";
import { useWebPush } from "@/hooks/useWebPush";
import { HelpSupportDialog } from "@/components/help-support-dialog";
import { VerticalPackBanner } from "@/components/vertical-pack-banner";
import { ErrorBoundary } from "@/components/error-boundary";



function BusinessSwitcher() {

  const { business, businesses, setBusinessById } = useBusiness();

  if (!Array.isArray(businesses) || businesses.length < 2 || !business) return null;

  return (

    <div className="px-4 py-2 border-b border-border" data-testid="business-switcher">

      <label className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1 block">

        Location

      </label>

      <Select value={business.id} onValueChange={setBusinessById}>

        <SelectTrigger
          className="h-8 text-xs"
          data-testid="business-switcher-trigger"
          aria-label="Switch location"
        >

          <SelectValue />

        </SelectTrigger>

        <SelectContent>

          {businesses.map((b) => (

            <SelectItem key={b.id} value={b.id} data-testid={`business-switcher-option-${b.id}`}>

              {b.name ?? b.slug ?? b.id}

            </SelectItem>

          ))}

        </SelectContent>

      </Select>

    </div>

  );

}



function PersonaSwitcher() {

  const { business } = useBusiness();

  const { role, viewingAsStaffId, setViewingAsStaffId } = useMembership();

  const { toast } = useToast();

  const { data: staff } = useListStaff(business?.id ?? "", {}, {

    query: { enabled: !!business?.id && (role === "OWNER" || role === "ADMIN") } as never,

  });



  if (role !== "OWNER" && role !== "ADMIN") return null;



  const value = viewingAsStaffId ?? "__owner__";

  const staffList = (staff ?? []) as Staff[];



  return (

    <div className="px-4 py-2 border-t border-border">

      <label className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-1 mb-1">

        {viewingAsStaffId ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}

        View as team member

      </label>

      <Select

        value={value}

        onValueChange={(v) => {

          if (v === "__owner__") {

            setViewingAsStaffId(null);

            return;

          }

          const member = staffList.find((s) => s.id === v);

          setViewingAsStaffId(v);

          toast({

            title: member ? `Viewing as ${member.displayName}` : "Staff view enabled",

            description: "Read-only preview · logged in audit trail.",

          });

        }}

      >

        <SelectTrigger className="h-8 text-xs" aria-label="View as stylist">

          <SelectValue />

        </SelectTrigger>

        <SelectContent>

          <SelectItem value="__owner__">Myself ({role.toLowerCase()})</SelectItem>

          {staffList.map((s) => (

            <SelectItem key={s.id} value={s.id}>

              {s.displayName}

            </SelectItem>

          ))}

        </SelectContent>

      </Select>

    </div>

  );

}



export function AppLayout({ children }: { children: ReactNode }) {
  useWebPush();

  const [location] = useLocation();

  useEffect(() => {
    document.documentElement.classList.add("app-shell-locked");
    return () => document.documentElement.classList.remove("app-shell-locked");
  }, []);

  const { business, businesses } = useBusiness();
  const { data: tenantExperience } = useTenantExperience(business?.id);

  const { effectiveRole, role, viewingAsStaffId } = useMembership();

  const { kind: persona } = usePersona();

  const [showLifecycle, setShowLifecycle] = useState(false);

  useEffect(() => {
    applyExperienceTheme({
      vertical: (business as { vertical?: string } | null)?.vertical,
      category: (business as { category?: string } | null)?.category,
      country: (business as { country?: string } | null)?.country,
      persona,
    });
  }, [business, persona]);

  useEffect(() => {
    const p = tenantExperience?.presentation;
    if (p) {
      applyPresentationTheme({ cssPreset: p.cssPreset, brandAccentHex: p.brandAccentHex });
    }
  }, [tenantExperience?.presentation?.cssPreset, tenantExperience?.presentation?.brandAccentHex]);

  useEffect(() => {
    if (role !== "OWNER" && persona !== "org_admin") {
      setShowLifecycle(false);
      return;
    }
    if (businesses.length >= 2) {
      setShowLifecycle(true);
      return;
    }
    void fetchUserLifecycle()
      .then((d) => setShowLifecycle(d.suggestions.length > 0))
      .catch(() => setShowLifecycle(false));
  }, [role, persona, businesses.length]);

  const accent = PERSONA_ACCENT[persona];

  const items = getRitualNav(
    persona,
    effectiveRole,
    businesses.length,
    isDemoLoginEnabled,
    (business as { tier?: string } | null)?.tier,
    (business as { vertical?: string } | null)?.vertical,
    (business as { category?: string } | null)?.category,
    { showLifecycle },
  );



  const personaBadge =

    viewingAsStaffId ? "Previewing staff" : PERSONA_LABEL[persona].split("·")[0].trim();



  return (

    <div className="flex h-[100dvh] w-full overflow-hidden flex-col bg-background md:flex-row">

      <aside

        className="hidden w-64 flex-col border-r bg-card/50 md:flex"

        style={{ borderColor: `${accent}22` }}

      >

        <div

          className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-6"

          style={{ borderColor: `${accent}22` }}

        >

          <div className="flex items-center gap-3 min-w-0">

            <div className="min-w-0 flex-1">
              <LiviaWordmark size="sm" className="opacity-90" />
              <span className="font-medium text-xs truncate block max-w-[140px] text-muted-foreground mt-1">
                {business?.name || "Your shop"}
              </span>

              <Badge variant="outline" className="text-[9px] py-0 h-4 mt-0.5 truncate max-w-[140px]">

                {personaBadge}

              </Badge>

            </div>

          </div>

          <div className="flex items-center gap-1 shrink-0">
            <NotificationCenter />
            <VerticalPackBanner />
          </div>

        </div>

        <BusinessSwitcher />

        <SidebarNav items={items} accent={accent} />

        <PersonaSwitcher />

        <div className="border-t border-border p-4 space-y-3">
          <HelpSupportDialog />
          <UserButton afterSignOutUrl="/sign-in" appearance={accountMenuAppearance} />
        </div>

      </aside>



      <main className="app-shell-main flex flex-1 min-h-0 flex-col pb-16 md:pb-0 overflow-y-auto overscroll-y-contain">

        <header className="flex h-14 items-center justify-between border-b border-border bg-card/50 px-4 md:hidden sticky top-0 z-10">

          <div className="flex items-center gap-2 min-w-0">

            <div

              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-bold"

              style={{ backgroundColor: `${accent}33`, color: accent }}

            >

              {business?.name?.charAt(0)?.toUpperCase() || "L"}

            </div>

            <span className="font-semibold text-sm truncate">{business?.name || "Livia"}</span>

          </div>

          <div className="flex items-center gap-1">
            <NotificationCenter />
            <UserButton afterSignOutUrl="/sign-in" appearance={accountMenuAppearance} />
          </div>

        </header>



        <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
          <OnboardingProgressBanner />
          <OperatorMaturityBanner />
          <NotificationAlertStrip />
          <PlatformTour />
          <ErrorBoundary>{children}</ErrorBoundary>
        </div>
        <KeysChangedRitual />

      </main>



      <MobileBottomNav items={items} accent={accent} />


    </div>

  );

}


