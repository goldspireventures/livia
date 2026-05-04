/* global self */
self.addEventListener("push", (event) => {
  let data = { title: "Bliq", body: "" };
  try {
    if (event.data) {
      data = { ...data, ...event.data.json() };
    }
  } catch {
    // ignore
  }
  event.waitUntil(
    self.registration.showNotification(data.title, { body: data.body, data: { url: data.url || "/dashboard" } }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const raw = event.notification.data;
  const url = typeof raw === "object" && raw && "url" in raw && typeof raw.url === "string" ? raw.url : "/dashboard";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const c of clientList) {
        if ("focus" in c && c.url.includes(url)) return c.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    }),
  );
});
