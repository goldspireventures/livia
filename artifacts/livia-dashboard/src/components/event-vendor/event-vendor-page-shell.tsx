import { useEventVendorSlug } from "@/lib/use-guest-book-slug";
import { usePublicGuestPwa } from "@/lib/public-guest-pwa";
import { useEventVendorSite } from "@/hooks/use-event-vendor-site";
import { EventVendorChrome } from "./event-vendor-chrome";
import {
  PublicSurfaceLoading,
  PublicSurfaceNotFound,
} from "@/components/public/public-surface-chrome";
import type { ReactNode } from "react";

type Props = {
  children: (ctx: { slug: string; data: NonNullable<ReturnType<typeof useEventVendorSite>["data"]> }) => ReactNode;
};

export function EventVendorPageShell({ children }: Props) {
  const slug = useEventVendorSlug();
  const { data, loading } = useEventVendorSite(slug);
  usePublicGuestPwa(slug);

  if (loading) return <PublicSurfaceLoading />;
  if (!data || !slug) {
    return (
      <PublicSurfaceNotFound
        title="Event vendor not found"
        detail="This website doesn't exist or the link may be outdated."
      />
    );
  }

  return <EventVendorChrome slug={slug} data={data}>{children({ slug, data })}</EventVendorChrome>;
}
