import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
  getSupabasePublicConfig: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/core/config/supabase", () => ({
  getSupabasePublicConfig: mocks.getSupabasePublicConfig,
}));
vi.mock("@/core/supabase/server", () => ({
  createSupabaseServerClient: mocks.createSupabaseServerClient,
}));

import { signInAction, signUpAction } from "./actions";
import { initialAuthActionState } from "./types";

function formData(next?: string) {
  const data = new FormData();
  data.set("email", "person@example.com");
  data.set("password", "password");
  if (next !== undefined) data.set("next", next);
  return data;
}

describe("auth action return paths", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.getSupabasePublicConfig.mockReturnValue({
      url: "https://example.supabase.co",
      publishableKey: "test",
    });
  });

  it("returns to a safe Buy Later intake after sign in", async () => {
    mocks.createSupabaseServerClient.mockResolvedValue({
      auth: { signInWithPassword: vi.fn().mockResolvedValue({ error: null }) },
    });

    await signInAction(
      initialAuthActionState,
      formData("/buy-later/import?url=https%3A%2F%2Fexample.com%2Fproduct"),
    );

    expect(mocks.redirect).toHaveBeenCalledWith(
      "/buy-later/import?url=https%3A%2F%2Fexample.com%2Fproduct",
    );
  });

  it("returns to a safe Find It path after immediate sign up", async () => {
    mocks.createSupabaseServerClient.mockResolvedValue({
      auth: { signUp: vi.fn().mockResolvedValue({ data: { session: {} }, error: null }) },
    });

    await signUpAction(initialAuthActionState, formData("/find-it/items/abc"));

    expect(mocks.redirect).toHaveBeenCalledWith("/find-it/items/abc");
  });

  it.each([
    "https://example.com",
    "//example.com",
    "javascript:alert(1)",
    "data:text/html,test",
    "/\\example.com",
  ])("falls back safely for invalid sign-up return path %s", async (next) => {
    mocks.createSupabaseServerClient.mockResolvedValue({
      auth: { signUp: vi.fn().mockResolvedValue({ data: { session: {} }, error: null }) },
    });

    await signUpAction(initialAuthActionState, formData(next));

    expect(mocks.redirect).toHaveBeenCalledWith("/find-it");
  });

  it("uses the safe default when no sign-in return path is supplied", async () => {
    mocks.createSupabaseServerClient.mockResolvedValue({
      auth: { signInWithPassword: vi.fn().mockResolvedValue({ error: null }) },
    });

    await signInAction(initialAuthActionState, formData());

    expect(mocks.redirect).toHaveBeenCalledWith("/find-it");
  });
});
