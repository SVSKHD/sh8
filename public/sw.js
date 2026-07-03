/* Minimal hand-written service worker — no build step, no framework. Job:
   render a nicer native notification (icon/actions) via showNotification,
   and focus/open the app when one is clicked. The actual scheduling of
   *when* to notify happens in the main app (see useWishes.js) while it's
   open; this worker cannot wake the browser from a fully closed state at
   an arbitrary future time — that needs the Web Push API plus a push
   server, which is out of scope for this zero-backend app. */
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow("/");
    }),
  );
});
