import type { WebPushPayload } from "@/core/notifications/web-push.server";

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function createBuyLaterReminderPayload(includeItemName: boolean, item?: Readonly<{ id: string; name: string }>): WebPushPayload {
  const validItem = item && isUuid(item.id);
  return {
    title: "RX LifeOS",
    body: includeItemName && validItem ? `Do you still want ${item.name}?` : "A Buy Later decision is ready.",
    url: validItem ? `/buy-later/items/${item.id}` : "/buy-later",
  };
}
