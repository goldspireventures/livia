"use client";

import { useCallback, useEffect, useState } from "react";

type Props = {
  vapidPublicKey: string | null;
};

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
}

export function WebPushRegister({ vapidPublicKey }: Props) {
  const [clientCapable, setClientCapable] = useState<boolean | null>(null);
  const [status, setStatus] = useState<"idle" | "denied" | "error" | "subscribed">("idle");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    if (!vapidPublicKey) return;
    queueMicrotask(() => {
      const ok = "serviceWorker" in navigator && "PushManager" in window;
      setClientCapable(ok);
    });
  }, [vapidPublicKey]);

  const subscribe = useCallback(async () => {
    if (!vapidPublicKey) return;
    setMessage("");
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setStatus("denied");
        setMessage("Notifications were blocked.");
        return;
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
      const json = sub.toJSON();
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
        setStatus("error");
        setMessage("Could not read subscription keys.");
        return;
      }
      const res = await fetch("/api/me/web-push", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
        }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
        setStatus("error");
        setMessage(err.error?.message ?? `HTTP ${res.status}`);
        return;
      }
      setStatus("subscribed");
      setMessage("This device will get booking alerts for businesses you own or administer.");
    } catch (e) {
      setStatus("error");
      setMessage(e instanceof Error ? e.message : "Subscribe failed.");
    }
  }, [vapidPublicKey]);

  if (!vapidPublicKey) {
    return (
      <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-500">
        Push is not configured (set VAPID keys and <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">NEXT_PUBLIC_VAPID_PUBLIC_KEY</code>).
      </p>
    );
  }

  if (clientCapable === false) {
    return (
      <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-500">This browser does not support web push.</p>
    );
  }

  return (
    <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="font-medium">Browser notifications</h2>
      <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
        Get a push when someone books via your public page (owner/admin accounts only).
      </p>
      {status === "subscribed" ? (
        <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-400">{message || "Subscribed on this device."}</p>
      ) : (
        <button
          type="button"
          disabled={clientCapable !== true}
          onClick={() => void subscribe()}
          className="mt-3 rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          Enable push on this device
        </button>
      )}
      {status === "error" || status === "denied" ? (
        <p className="mt-2 text-xs text-red-700 dark:text-red-400">{message}</p>
      ) : null}
    </div>
  );
}
