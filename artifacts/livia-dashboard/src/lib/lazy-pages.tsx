import { lazy, type ComponentType } from "react";

/** Code-split heavy routes — keeps sign-in / dashboard shell snappier on first load. */
function lazyPage<T extends ComponentType<object>>(
  loader: () => Promise<{ default: T }>,
) {
  return lazy(loader);
}

export const LazyBookingsPage = lazyPage(() => import("@/pages/bookings"));
export const LazyBookingNewPage = lazyPage(() => import("@/pages/booking-new"));
export const LazyBookingDetailPage = lazyPage(() => import("@/pages/booking-detail"));
export const LazyCustomersPage = lazyPage(() => import("@/pages/customers"));
export const LazyCustomerDetailPage = lazyPage(() => import("@/pages/customer-detail"));
export const LazyStaffPage = lazyPage(() => import("@/pages/staff"));
export const LazyStaffDetailPage = lazyPage(() => import("@/pages/staff-detail"));
export const LazyServicesPage = lazyPage(() => import("@/pages/services"));
export const LazySettingsPage = lazyPage(() => import("@/pages/settings"));
export const LazyAuditPage = lazyPage(() => import("@/pages/audit"));
export const LazyChainPage = lazyPage(() => import("@/pages/chain"));
export const LazyHostPage = lazyPage(() => import("@/pages/host"));
export const LazyBrandsPage = lazyPage(() => import("@/pages/brands"));
export const LazyRotaPage = lazyPage(() => import("@/pages/rota"));
export const LazyClassesPage = lazyPage(() => import("@/pages/classes"));
export const LazyFranchisePage = lazyPage(() => import("@/pages/franchise"));
export const LazyDesignProofsPage = lazyPage(() => import("@/pages/design-proofs"));
export const LazyEnquiriesRedirect = lazyPage(() => import("@/pages/enquiries-redirect"));
export const LazyQuotesPage = lazyPage(() => import("@/pages/quotes"));
export const LazyEventSitePage = lazyPage(() => import("@/pages/event-site"));
export const LazyMedspaHubPage = lazyPage(() => import("@/pages/medspa-hub"));
export const LazyToolkitPage = lazyPage(() => import("@/pages/toolkit"));
export const LazyExperiencePage = lazyPage(() => import("@/pages/experience"));
export const LazyPortalPage = lazyPage(() => import("@/pages/portal"));
export const LazyGuidesPage = lazyPage(() => import("@/pages/guides"));
export const LazyLifecyclePage = lazyPage(() => import("@/pages/lifecycle"));
export const LazyLaunchStatusPage = lazyPage(() => import("@/pages/launch-status"));
export const LazyInboxPage = lazyPage(() => import("@/pages/inbox"));
export const LazyMyDayPage = lazyPage(() => import("@/pages/my-day"));
export const LazyPremisesPage = lazyPage(() => import("@/pages/premises"));
export const LazyPremisesInvitePage = lazyPage(() => import("@/pages/premises-invite"));
export const LazyDayPackagesPage = lazyPage(() => import("@/pages/day-packages"));
export const LazyWellnessReportsPage = lazyPage(() => import("@/pages/wellness-reports"));
export const LazyWellnessReceptionPage = lazyPage(() => import("@/pages/wellness-reception"));
export const LazyWellnessChainPage = lazyPage(() => import("@/pages/wellness-chain"));
export const LazyWellnessTvPage = lazyPage(() => import("@/pages/wellness-tv"));
export const LazyWellnessAuditDiaryPage = lazyPage(() => import("@/pages/wellness-audit-diary"));
export const LazyWellnessGuestVaultPage = lazyPage(() => import("@/pages/wellness-guest-vault"));
export const LazyWellnessRetailPage = lazyPage(() => import("@/pages/wellness-retail"));
export const LazyStudioSetupPage = lazyPage(() => import("@/pages/studio-setup"));
export const LazyBeautyReceptionPage = lazyPage(() => import("@/pages/beauty-reception"));
export const LazyBeautyTvPage = lazyPage(() => import("@/pages/beauty-tv"));
export const LazyTenantStorePage = lazyPage(() => import("@/pages/store"));
export const LazyBeautyStorePage = LazyTenantStorePage;
export const LazyDemoShowcase = lazyPage(() => import("@/pages/demo/Showcase"));
