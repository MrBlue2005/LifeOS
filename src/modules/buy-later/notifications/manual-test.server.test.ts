import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  send: vi.fn(),
  status: vi.fn(),
}));

vi.mock("@/core/supabase/service.server", () => ({ createSupabaseServiceClient: mocks.createClient }));
vi.mock("@/core/notifications/web-push.server", () => ({ sendWebPush: mocks.send, webPushStatusCode: mocks.status }));

import { createBuyLaterTestPayload, manualPushTestCooldown, sendBuyLaterManualPushTest } from "./manual-test.server";

const subscriptions = [
  { id: "10000000-0000-4000-8000-000000000001", endpoint: "https://push.example/one", p256dh: "key-one", auth: "auth-one" },
  { id: "10000000-0000-4000-8000-000000000002", endpoint: "https://push.example/two", p256dh: "key-two", auth: "auth-two" },
];

function setup(rows = subscriptions) {
  const updateEq = vi.fn().mockResolvedValue({ error: null });
  const update = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: updateEq }) });
  const selectEqTwo = vi.fn().mockResolvedValue({ data: rows, error: null });
  const selectEqOne = vi.fn().mockReturnValue({ eq: selectEqTwo });
  mocks.createClient.mockReturnValue({ from: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ eq: selectEqOne }), update }) });
  return { update };
}

describe("Buy Later manual push test", () => {
  beforeEach(() => { mocks.createClient.mockReset(); mocks.send.mockReset(); mocks.status.mockReset(); manualPushTestCooldown.clear(); });

  it("keeps generic wording by default and only exposes an item name when explicitly allowed", () => {
    expect(createBuyLaterTestPayload(false, { id: subscriptions[0].id, name: "Headphones" })).toEqual({ title: "RX LifeOS", body: "A Buy Later decision is ready.", url: "/buy-later/items/10000000-0000-4000-8000-000000000001" });
    expect(createBuyLaterTestPayload(true, { id: subscriptions[0].id, name: "Headphones" }).body).toContain("Headphones");
    expect(createBuyLaterTestPayload(true).url).toBe("/buy-later");
  });

  it("sends only to all active subscriptions for the supplied authenticated owner", async () => {
    setup(); mocks.send.mockResolvedValue(undefined);
    await expect(sendBuyLaterManualPushTest({ userId: "owner", includeItemName: false, now: 1 })).resolves.toEqual({ ok: true, attempted: 2, sent: 2 });
    expect(mocks.send).toHaveBeenCalledTimes(2);
    expect(mocks.send.mock.calls[0][1]).toEqual({ title: "RX LifeOS", body: "A Buy Later decision is ready.", url: "/buy-later" });
  });

  it.each([404, 410])("deactivates a definitively expired subscription (%i)", async (statusCode) => {
    const { update } = setup([subscriptions[0]]); mocks.send.mockRejectedValue(new Error("expired")); mocks.status.mockReturnValue(statusCode);
    await sendBuyLaterManualPushTest({ userId: "owner", includeItemName: false, now: 1 });
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ active: false }));
  });

  it("does not deactivate a transient push failure", async () => {
    const { update } = setup([subscriptions[0]]); mocks.send.mockRejectedValue(new Error("temporary")); mocks.status.mockReturnValue(503);
    await expect(sendBuyLaterManualPushTest({ userId: "owner", includeItemName: false, now: 1 })).resolves.toMatchObject({ ok: false, attempted: 1, sent: 0 });
    expect(update).not.toHaveBeenCalled();
  });

  it("returns safe responses for no subscriptions and cooldown without leaking capability data", async () => {
    setup([]);
    await expect(sendBuyLaterManualPushTest({ userId: "owner", includeItemName: false, now: 1 })).resolves.toEqual({ ok: false, attempted: 0, sent: 0, message: "No active reminder subscription was found." });
    setup([subscriptions[0]]); mocks.send.mockResolvedValue(undefined);
    await sendBuyLaterManualPushTest({ userId: "owner", includeItemName: false, now: 2 });
    await expect(sendBuyLaterManualPushTest({ userId: "owner", includeItemName: false, now: 3 })).resolves.toMatchObject({ ok: false, message: expect.not.stringContaining("push.example") });
  });

  it("never returns subscription capability material", async () => {
    setup([subscriptions[0]]); mocks.send.mockResolvedValue(undefined);
    const result = await sendBuyLaterManualPushTest({ userId: "owner", includeItemName: false, now: 1 });
    expect(JSON.stringify(result)).not.toContain("push.example");
    expect(JSON.stringify(result)).not.toContain("key-one");
    expect(JSON.stringify(result)).not.toContain("auth-one");
  });
});
