import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const actions = readFileSync(join(process.cwd(), "src", "modules", "buy-later", "actions.ts"), "utf8");

describe("Buy Later manual push action boundary", () => {
  it("takes no client targeting input and derives the current authenticated user", () => {
    expect(actions).toContain("export async function sendBuyLaterTestNotificationAction():");
    expect(actions).toContain("const context = await getActionContext()");
    expect(actions).toContain("userId: context.user.id");
    expect(actions).not.toContain("sendBuyLaterTestNotificationAction(userId");
  });

  it("does not create reminder delivery records", () => {
    expect(actions).not.toContain("buy_later_reminder_deliveries");
  });
});
