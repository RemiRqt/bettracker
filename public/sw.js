// Service Worker for BetTracker push notifications

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "BetTracker", body: event.data.text() };
  }

  const title = payload.title || "BetTracker";
  const options = {
    body: payload.body || "",
    icon: payload.icon || "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag: payload.tag || "bettracker-notification",
    data: {
      url: payload.url || "/series",
    },
    vibrate: [200, 100, 200],
    requireInteraction: false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/series";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        // Reuse an existing window: navigate it to the target, then focus
        const client = clients.find((c) => "focus" in c);
        if (client) {
          const target = new URL(url, self.location.origin).href;
          const nav =
            client.url !== target && "navigate" in client
              ? client.navigate(target).catch(() => client)
              : Promise.resolve(client);
          return nav.then((c) => (c || client).focus());
        }
        // Otherwise open a new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(url);
        }
      })
  );
});
