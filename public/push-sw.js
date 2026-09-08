const DEFAULT_PATH = "/buy-later";
const ITEM_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function pathFromPayload(value) {
  return value && typeof value.itemId === "string" && ITEM_ID.test(value.itemId)
    ? `/buy-later/items/${value.itemId}`
    : DEFAULT_PATH;
}

function safePayload(event) {
  try { return event.data ? event.data.json() : null; } catch { return null; }
}

self.addEventListener("push", (event) => {
  const payload = safePayload(event);
  event.waitUntil(self.registration.showNotification("RX LifeOS", {
    body: "A Buy Later decision is ready.",
    data: { path: pathFromPayload(payload) },
    tag: "buy-later-reminder",
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const path = pathFromPayload(event.notification.data);
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const existing = windows.find((client) => new URL(client.url).origin === self.location.origin);
    if (existing) return existing.focus();
    return self.clients.openWindow(path);
  })());
});
