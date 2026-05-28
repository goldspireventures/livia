import { useEffect, useRef } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useRegisterDeviceToken } from "@workspace/api-client-react";
import { apiFetch } from "@/lib/api-fetch";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

/** Register browser Web Push (VAPID) for staff alerts on desktop. */
export function useWebPush() {
  const { isSignedIn } = useAuth();
  const { mutateAsync: registerToken } = useRegisterDeviceToken();
  const done = useRef(false);

  useEffect(() => {
    if (!isSignedIn || typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    if (done.current) return;

    let cancelled = false;

    (async () => {
      const config = await apiFetch<{ vapidPublicKey: string | null; webPushEnabled: boolean }>(
        "/me/push-config",
      );
      if (cancelled || !config.webPushEnabled || !config.vapidPublicKey) return;

      const perm = await Notification.requestPermission();
      if (perm !== "granted" || cancelled) return;

      await navigator.serviceWorker.register("/sw.js");
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(config.vapidPublicKey) as BufferSource,
        });
      }

      const token = JSON.stringify(sub.toJSON());
      if (done.current) return;
      await registerToken({ data: { token, platform: "WEB" } });
      done.current = true;
    })().catch((err) => {
      console.warn("[web-push] registration failed", err);
    });

    return () => {
      cancelled = true;
    };
  }, [isSignedIn, registerToken]);
}
