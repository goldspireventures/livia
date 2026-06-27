import { useEventVendorSlug } from "@/lib/use-guest-book-slug";
import { usePublicGuestPwa } from "@/lib/public-guest-pwa";
import { useEventVendorSite } from "@/hooks/use-event-vendor-site";
import { EventVendorChrome } from "./event-vendor-chrome";
import {
  PublicSurfaceLoading,
  PublicSurfaceNotFound,
} from "@/components/public/public-surface-chrome";
import { isProductionCustomerSurface } from "@/lib/production-surface";
import type { ReactNode } from "react";

type Props = {
  children: (ctx: { slug: string; data: NonNullable<ReturnType<typeof useEventVendorSite>["data"]> }) => ReactNode;
};

export function EventVendorPageShell({ children }: Props) {
  const slug = useEventVendorSlug();
  const { data, loading, errorKind } = useEventVendorSite(slug);
  usePublicGuestPwa(slug);

  if (loading) return <PublicSurfaceLoading />;
  if (!data || !slug) {
    return (
      <PublicSurfaceNotFound
        code={errorKind === "unavailable" ? "503" : "404"}
        title={errorKind === "unavailable" ? "Website temporarily unavailable" : "Event vendor not found"}
        detail={
          errorKind === "unavailable"
            ? isProductionCustomerSurface
              ? "We could not load this site right now. Please try again in a few minutes."
              : "We could not load this public site right now. Try again in a few minutes, or open the demo vendor from the demo portal."
            : "This website doesn't exist or the link may be outdated."
        }
      />
    );
  }

  return <EventVendorChrome slug={slug} data={data}>{children({ slug, data })}</EventVendorChrome>;
}
