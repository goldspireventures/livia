import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useEffect } from "react";

type PushData = {
  type?: string;
  businessId?: string;
  bookingId?: string;
  conversationId?: string;
  slug?: string;
  token?: string;
  guestKind?: string;
};

function routeForPush(data: PushData | undefined): string | null {
  if (!data?.type) return null;
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
    case "test":
      return "/(tabs)";
    default:
      return "/(tabs)";
  }
}

/** Deep-link when the user taps a push notification (N1). */
export function usePushNavigation() {
  const router = useRouter();

  useEffect(() => {
    function handle(data: PushData | undefined) {
      const path = routeForPush(data);
      if (path) router.push(path as never);
    }

    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as PushData | undefined;
      handle(data);
    });

    void Notifications.getLastNotificationResponseAsync().then((last) => {
      if (!last) return;
      const data = last.notification.request.content.data as PushData | undefined;
      handle(data);
    });

    return () => sub.remove();
  }, [router]);
}
