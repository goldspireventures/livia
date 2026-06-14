import { useRouter } from "expo-router";
import { useEffect } from "react";
import { operatorRouteForResource, type PlatformResourceKind } from "@workspace/policy";
import { isPushSupportedInThisBuild, loadNotificationsModule } from "@/lib/push-notifications";

type PushData = {
  type?: string;
  businessId?: string;
  bookingId?: string;
  conversationId?: string;
  quoteId?: string;
  proofId?: string;
  resourceKind?: string;
  resourceId?: string;
  slug?: string;
  token?: string;
  guestKind?: string;
};

function routeFromResourceKind(kind: string | undefined, resourceId: string | undefined): string | null {
  if (!kind || !resourceId) return null;
  const allowed: PlatformResourceKind[] = [
    "booking",
    "conversation",
    "quote",
    "design_proof",
    "refund",
    "time_off",
  ];
  if (!allowed.includes(kind as PlatformResourceKind)) return null;
  return operatorRouteForResource(kind as PlatformResourceKind, resourceId).mobileHref;
}

function routeForPush(data: PushData | undefined): string | null {
  if (!data?.type) return null;

  const resourceRoute = routeFromResourceKind(
    data.resourceKind,
    data.resourceId ?? data.quoteId ?? data.proofId ?? data.bookingId ?? data.conversationId,
  );
  if (resourceRoute) return resourceRoute;

  switch (data.type) {
    case "guest.visit":
    case "guest.intake":
    case "guest.waitlist":
    case "guest.pay":
    case "guest.proof": {
      const kind = data.guestKind ?? data.type.replace("guest.", "");
      if (data.slug && data.token) {
        return `/guest-surface?kind=${encodeURIComponent(kind)}&slug=${encodeURIComponent(data.slug)}&token=${encodeURIComponent(data.token)}`;
      }
      return null;
    }
    case "booking.created":
    case "booking.cancelled":
    case "booking.pending":
      return data.bookingId ? `/booking/${data.bookingId}` : "/(tabs)/bookings";
    case "inbox.inbound":
    case "inbox.handoff":
    case "inbox.liv_booked":
      return data.conversationId
        ? `/conversation/${data.conversationId}`
        : "/(tabs)/inbox";
    case "design-proof.changes_requested":
    case "design-proof.approved":
    case "design-proof.awaiting_client":
      return data.proofId
        ? operatorRouteForResource("design_proof", data.proofId).mobileHref
        : "/design-proofs";
    case "quote.accepted":
    case "quote.deposit_paid":
    case "quote.client_withdrew":
      return data.quoteId
        ? operatorRouteForResource("quote", data.quoteId).mobileHref
        : "/quotes";
    case "twin.risk":
    case "twin.opportunity":
    case "commerce.signal":
    case "payment.failed":
    case "morning.briefing.ready":
      return "/(tabs)/index";
    case "test":
      return "/(tabs)";
    default:
      return "/(tabs)";
  }
}

/** Deep-link when the user taps a push notification (N1). No-op in Expo Go. */
export function usePushNavigation() {
  const router = useRouter();

  useEffect(() => {
    if (!isPushSupportedInThisBuild()) return;

    let sub: { remove: () => void } | undefined;
    let cancelled = false;

    void (async () => {
      const Notifications = await loadNotificationsModule();
      if (!Notifications || cancelled) return;

      function handle(data: PushData | undefined) {
        const path = routeForPush(data);
        if (path) router.push(path as never);
      }

      sub = Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data as PushData | undefined;
        handle(data);
      });

      const last = await Notifications.getLastNotificationResponseAsync();
      if (last) {
        const data = last.notification.request.content.data as PushData | undefined;
        handle(data);
      }
    })();

    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, [router]);
}
