import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAuthenticatedUser: vi.fn(),
  createSupabaseServerClient: vi.fn(),
  sendTest: vi.fn(),
  revalidatePath: vi.fn(),
  redirect: vi.fn(),
}));

function preferencesClient(pushEnabled: boolean) {
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: { push_enabled: pushEnabled, include_item_name: false }, error: null }),
        }),
      }),
    }),
  };
}

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/core/auth/session", () => ({ getAuthenticatedUser: mocks.getAuthenticatedUser }));
vi.mock("@/core/supabase/server", () => ({ createSupabaseServerClient: mocks.createSupabaseServerClient }));
vi.mock("./notifications/manual-test.server", () => ({ sendBuyLaterManualPushTest: mocks.sendTest }));

import { sendBuyLaterTestNotificationAction } from "./actions";

describe("Buy Later test-notification action", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.getAuthenticatedUser.mockResolvedValue({ id: "current-user", email: "person@example.com" });
    mocks.createSupabaseServerClient.mockResolvedValue(preferencesClient(true));
  });

  it("derives the current user and sends no client-selected target", async () => {
    mocks.sendTest.mockResolvedValue({ ok: true, attempted: 2, sent: 2 });
    await expect(sendBuyLaterTestNotificationAction()).resolves.toEqual({ ok: true, attempted: 2, sent: 2 });
    expect(mocks.sendTest).toHaveBeenCalledWith({ userId: "current-user", includeItemName: false });
  });

  it("rejects a disabled reminder preference before transport selection", async () => {
    mocks.createSupabaseServerClient.mockResolvedValue(preferencesClient(false));
    await expect(sendBuyLaterTestNotificationAction()).resolves.toEqual({ ok: false, message: "Enable reminders before sending a test notification." });
    expect(mocks.sendTest).not.toHaveBeenCalled();
  });
});
