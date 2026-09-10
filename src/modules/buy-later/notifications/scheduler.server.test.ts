import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  config: vi.fn(),
  createClient: vi.fn(),
  send: vi.fn(),
  status: vi.fn(),
}));

vi.mock("@/core/config/web-push.server", () => ({ getWebPushServerConfig: mocks.config }));
vi.mock("@/core/supabase/service.server", () => ({ createSupabaseServiceClient: mocks.createClient }));
vi.mock("@/core/notifications/web-push.server", () => ({ sendWebPush: mocks.send, webPushStatusCode: mocks.status }));

import { BUY_LATER_REMINDER_BATCH_LIMITS, runBuyLaterDueReminderScheduler } from "./scheduler.server";

const claim = {
  delivery_id: "30000000-0000-4000-8000-000000000001", user_id: "10000000-0000-4000-8000-000000000001",
  item_id: "20000000-0000-4000-8000-000000000001", item_name: "Headphones", reconsider_at: "2026-09-15",
  subscription_id: "40000000-0000-4000-8000-000000000001", endpoint: "https://push.example/subscription", p256dh: "key", auth: "auth", include_item_name: false,
};

function setup(claims = [claim]) {
  const deliveryEq = vi.fn().mockResolvedValue({ error: null });
  const deliveryUpdate = vi.fn().mockReturnValue({ eq: deliveryEq });
  const subscriptionEq = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
  const subscriptionUpdate = vi.fn().mockReturnValue({ eq: subscriptionEq });
  const from = vi.fn((table: string) => table === "buy_later_reminder_deliveries"
    ? { update: deliveryUpdate }
    : { update: subscriptionUpdate });
  const rpc = vi.fn().mockResolvedValue({ data: claims, error: null });
  mocks.createClient.mockReturnValue({ rpc, from });
  return { rpc, deliveryUpdate, subscriptionUpdate };
}

describe("Buy Later automatic reminder scheduler", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.config.mockReturnValue({ publicKey: "public", privateKey: "private", subject: "mailto:push@example.com" });
  });

  it("claims first, then sends a private item deep-link payload", async () => {
    const { rpc, deliveryUpdate } = setup();
    mocks.send.mockResolvedValue(undefined);
    await expect(runBuyLaterDueReminderScheduler({ rolloutDate: "2026-09-15", now: new Date("2026-09-15T06:00:00.000Z") }))
      .resolves.toEqual({ usersProcessed: 1, itemsClaimed: 1, pushesAttempted: 1, pushesSent: 1, pushesFailed: 0, staleSubscriptionsCleaned: 0 });
    expect(rpc).toHaveBeenCalledWith("claim_buy_later_due_reminders", expect.objectContaining({
      rollout_date: "2026-09-15", max_users: BUY_LATER_REMINDER_BATCH_LIMITS.users,
      max_items_per_user: BUY_LATER_REMINDER_BATCH_LIMITS.itemsPerUser, max_pushes: BUY_LATER_REMINDER_BATCH_LIMITS.pushes,
    }));
    expect(mocks.send).toHaveBeenCalledWith(expect.objectContaining({ endpoint: claim.endpoint }), {
      title: "RX LifeOS", body: "A Buy Later decision is ready.", url: `/buy-later/items/${claim.item_id}`,
    });
    expect(deliveryUpdate).toHaveBeenCalledWith(expect.objectContaining({ state: "sent" }));
  });

  it.each([404, 410])("revokes expired subscriptions and their claimed delivery (%i)", async (statusCode) => {
    const { deliveryUpdate, subscriptionUpdate } = setup();
    mocks.send.mockRejectedValue(new Error("expired")); mocks.status.mockReturnValue(statusCode);
    await expect(runBuyLaterDueReminderScheduler({ rolloutDate: "2026-09-15", now: new Date("2026-09-15T06:00:00.000Z") }))
      .resolves.toMatchObject({ pushesFailed: 1, staleSubscriptionsCleaned: 1 });
    expect(subscriptionUpdate).toHaveBeenCalledWith(expect.objectContaining({ active: false }));
    expect(deliveryUpdate).toHaveBeenCalledWith(expect.objectContaining({ state: "revoked" }));
  });

  it("records transient provider failures without retrying or revoking the subscription", async () => {
    const { deliveryUpdate, subscriptionUpdate } = setup();
    mocks.send.mockRejectedValue(new Error("temporary")); mocks.status.mockReturnValue(503);
    await expect(runBuyLaterDueReminderScheduler({ rolloutDate: "2026-09-15" })).resolves.toMatchObject({ pushesSent: 0, pushesFailed: 1 });
    expect(deliveryUpdate).toHaveBeenCalledWith(expect.objectContaining({ state: "failed" }));
    expect(subscriptionUpdate).not.toHaveBeenCalled();
  });

  it("does not create claims when Web Push delivery is unconfigured", async () => {
    mocks.config.mockReturnValue(null);
    const { rpc } = setup();
    await expect(runBuyLaterDueReminderScheduler({ rolloutDate: "2026-09-15" })).rejects.toThrow("Notification delivery is not configured.");
    expect(rpc).not.toHaveBeenCalled();
  });
});
