import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAuthenticatedUser: vi.fn(),
  getSupabasePublicConfig: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/core/auth/session", () => ({ getAuthenticatedUser: mocks.getAuthenticatedUser }));
vi.mock("@/core/config/supabase", () => ({ getSupabasePublicConfig: mocks.getSupabasePublicConfig }));

import { requireBuyLaterUser } from "./access";

describe("requireBuyLaterUser", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.getSupabasePublicConfig.mockReturnValue({ url: "https://example.supabase.co", publishableKey: "public" });
    mocks.getAuthenticatedUser.mockResolvedValue(null);
    mocks.redirect.mockImplementation(() => { throw new Error("redirect"); });
  });

  it("preserves a safe intake return path through sign-in", async () => {
    const nextPath = "/buy-later/import?url=https%3A%2F%2Fexample.com%2Fproduct&title=Desk+lamp";
    await expect(requireBuyLaterUser(nextPath)).rejects.toThrow("redirect");
    expect(mocks.redirect).toHaveBeenCalledWith(`/auth/sign-in?next=${encodeURIComponent(nextPath)}`);
  });

  it("does not allow an external authentication return path", async () => {
    await expect(requireBuyLaterUser("https://evil.example")).rejects.toThrow("redirect");
    expect(mocks.redirect).toHaveBeenCalledWith("/auth/sign-in?next=%2Fbuy-later");
  });
});
