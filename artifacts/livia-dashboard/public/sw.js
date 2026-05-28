/* Livia web push — shows notifications when the dashboard tab is in the background. */
self.addEventListener("push", (event) => {
  let data = { title: "Livia", body: "", data: {} };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    /* ignore */
  }
  const url =
    data.data?.bookingId
      ? `/bookings`
      : data.data?.conversationId
        ? `/inbox`
        : "/dashboard";
  event.waitUntil(
    self.registration.showNotification(data.title || "Livia", {
      body: data.body || "",
      icon: "/favicon.svg",
      data: { url },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const path = event.notification.data?.url || "/dashboard";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ("focus" in client) {
          client.navigate(path);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(path);
    }),
  );
});
