import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("notification server boundary", () => {
  it("keeps service-role and VAPID private-key reads in .server modules", () => {
    const privateConfig = readFileSync(join(process.cwd(), "src", "core", "config", "web-push.server.ts"), "utf8");
    const schedulerConfig = readFileSync(join(process.cwd(), "src", "core", "config", "buy-later-reminder-scheduler.server.ts"), "utf8");
    const serviceClient = readFileSync(join(process.cwd(), "src", "core", "supabase", "service.server.ts"), "utf8");
    const clientComponent = readFileSync(join(process.cwd(), "src", "modules", "buy-later", "components", "reminder-settings.tsx"), "utf8");
    expect(privateConfig).toContain("WEB_PUSH_VAPID_PRIVATE_KEY");
    expect(serviceClient).toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(schedulerConfig).toContain("BUY_LATER_REMINDER_CRON_SECRET");
    expect(clientComponent).not.toContain("WEB_PUSH_VAPID_PRIVATE_KEY");
    expect(clientComponent).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(clientComponent).not.toContain("BUY_LATER_REMINDER_CRON_SECRET");
  });
});
