import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const route = readFileSync(join(process.cwd(), "src", "app", "api", "internal", "buy-later", "reminders", "run", "route.ts"), "utf8");

describe("Buy Later reminder scheduler route boundary", () => {
  it("is Node-only, requires scheduler authorization, and takes no client targeting input", () => {
    expect(route).toContain('export const runtime = "nodejs"');
    expect(route).toContain('request.headers.get("authorization")');
    expect(route).toContain("isAuthorizedBuyLaterReminderSchedulerRequest");
    expect(route).toContain("runBuyLaterDueReminderScheduler({ rolloutDate: config.rolloutDate })");
    expect(route).not.toContain("request.json");
    expect(route).not.toContain("getAuthenticatedUser");
  });
});
