import { notFound } from "next/navigation";

import { BusinessWorkspaceNav } from "@/components/BusinessWorkspaceNav";
import { requireOwnerUserId } from "@/lib/ownerSession";
import { getBusinessById } from "@/services/business/businessService";
import { assertUserCanAccessBusiness } from "@/services/business/membershipService";
import { countUnreadInAppNotificationsForBusiness } from "@/services/notifications/inAppNotificationService";

export default async function BusinessWorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  const userId = await requireOwnerUserId();

  try {
    await assertUserCanAccessBusiness({
      userId,
      businessId,
      options: { emitAccessChecked: false },
    });
  } catch {
    notFound();
  }

  const business = await getBusinessById({ businessId });
  if (!business) {
    notFound();
  }

  const unreadBiz = await countUnreadInAppNotificationsForBusiness(userId, businessId);

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col px-4 py-6">
      <div className="mb-6 flex flex-col gap-4 border-b border-zinc-200 pb-4 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Business</p>
          <h1 className="text-lg font-semibold">{business.name}</h1>
          <p className="text-xs text-zinc-500">/{business.slug}</p>
        </div>
        <BusinessWorkspaceNav businessId={businessId} businessSlug={business.slug} unreadBiz={unreadBiz} />
      </div>
      {children}
    </div>
  );
}
