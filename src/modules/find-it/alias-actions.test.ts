import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
  getAuthenticatedUser: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/core/auth/session", () => ({ getAuthenticatedUser: mocks.getAuthenticatedUser }));
vi.mock("@/core/supabase/server", () => ({
  createSupabaseServerClient: mocks.createSupabaseServerClient,
}));
vi.mock("./data/queries", () => ({ listLocations: vi.fn() }));

import {
  addItemAliasAction,
  initialFindItAliasActionState,
  removeItemAliasAction,
} from "./actions";

const itemId = "20000000-0000-4000-8000-000000000001";
const aliasId = "40000000-0000-4000-8000-000000000001";
const ownerId = "30000000-0000-4000-8000-000000000001";

function addForm(alias: string) {
  const formData = new FormData();
  formData.set("itemId", itemId);
  formData.set("alias", alias);
  return formData;
}

function removeForm() {
  const formData = new FormData();
  formData.set("itemId", itemId);
  formData.set("aliasId", aliasId);
  return formData;
}

function aliasActionClient({
  item = { id: itemId, name: "Flashlight" },
  insertError = null,
  removedAlias = { id: aliasId },
}: Readonly<{
  item?: { id: string; name: string } | null;
  insertError?: { code: string } | null;
  removedAlias?: { id: string } | null;
}>) {
  const insert = vi.fn().mockResolvedValue({ error: insertError });
  const maybeSingleItem = vi.fn().mockResolvedValue({ data: item, error: null });
  const maybeSingleRemoval = vi.fn().mockResolvedValue({
    data: removedAlias,
    error: null,
  });
  const removeSelect = vi.fn().mockReturnValue({ maybeSingle: maybeSingleRemoval });
  const removeId = vi.fn().mockReturnValue({ select: removeSelect });
  const removeItemId = vi.fn().mockReturnValue({ eq: removeId });
  const removeOwner = vi.fn().mockReturnValue({ eq: removeItemId });

  return {
    from: vi.fn((table: string) => {
      if (table === "find_it_items") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({ maybeSingle: maybeSingleItem }),
            }),
          }),
        };
      }

      return {
        delete: vi.fn().mockReturnValue({ eq: removeOwner }),
        insert,
      };
    }),
    insert,
    removeId,
    removeItemId,
    removeOwner,
  };
}

describe("Find It alias actions", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.getAuthenticatedUser.mockResolvedValue({ id: ownerId });
  });

  it("adds a normalized valid alias using only the authenticated owner", async () => {
    const client = aliasActionClient({});
    mocks.createSupabaseServerClient.mockResolvedValue(client);
    const formData = addForm("  Torch  ");
    formData.set("userId", "50000000-0000-4000-8000-000000000001");

    await expect(addItemAliasAction(initialFindItAliasActionState, formData)).resolves.toEqual({
      status: "success",
      message: "Alias added.",
      values: {},
    });
    expect(client.insert).toHaveBeenCalledWith({
      alias: "Torch",
      item_id: itemId,
      user_id: ownerId,
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/find-it");
    expect(mocks.revalidatePath).toHaveBeenCalledWith(`/find-it/items/${itemId}`);
  });

  it.each([
    ["", "Alias is required."],
    ["x".repeat(61), "Alias must be 60 characters or fewer."],
    [" FLASHLIGHT ", "An alias must be different from the item name."],
  ])("rejects invalid aliases before persistence", async (alias, message) => {
    const client = aliasActionClient({});
    mocks.createSupabaseServerClient.mockResolvedValue(client);

    await expect(addItemAliasAction(initialFindItAliasActionState, addForm(alias))).resolves.toMatchObject({
      status: "error",
      message,
    });
    expect(client.insert).not.toHaveBeenCalled();
  });

  it.each([
    ["23505", "That alias is already saved for this item."],
    ["23514", "You can add up to 12 aliases per item."],
  ])("translates expected database errors safely", async (code, message) => {
    const client = aliasActionClient({ insertError: { code } });
    mocks.createSupabaseServerClient.mockResolvedValue(client);

    await expect(addItemAliasAction(initialFindItAliasActionState, addForm("Torch"))).resolves.toMatchObject({
      status: "error",
      message,
    });
  });

  it("denies adding an alias when the requested item is not owned", async () => {
    const client = aliasActionClient({ item: null });
    mocks.createSupabaseServerClient.mockResolvedValue(client);

    await expect(addItemAliasAction(initialFindItAliasActionState, addForm("Torch"))).resolves.toMatchObject({
      status: "error",
      message: "That item no longer exists.",
    });
    expect(client.insert).not.toHaveBeenCalled();
  });

  it("removes only an owner-scoped alias", async () => {
    const client = aliasActionClient({});
    mocks.createSupabaseServerClient.mockResolvedValue(client);

    await expect(removeItemAliasAction(initialFindItAliasActionState, removeForm())).resolves.toEqual({
      status: "success",
      message: "Alias removed.",
      values: {},
    });
    expect(client.removeOwner).toHaveBeenCalledWith("user_id", ownerId);
    expect(client.removeItemId).toHaveBeenCalledWith("item_id", itemId);
    expect(client.removeId).toHaveBeenCalledWith("id", aliasId);
  });

  it("does not disclose or remove another user's alias", async () => {
    const client = aliasActionClient({ removedAlias: null });
    mocks.createSupabaseServerClient.mockResolvedValue(client);

    await expect(removeItemAliasAction(initialFindItAliasActionState, removeForm())).resolves.toMatchObject({
      status: "error",
      message: "That alias no longer exists or is unavailable.",
    });
  });
});
