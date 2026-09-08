import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const worker = readFileSync(join(process.cwd(), "public", "push-sw.js"), "utf8");

describe("Buy Later push worker contract", () => {
  it("has no fetch or offline behavior", () => {
    expect(worker).not.toContain('addEventListener("fetch"');
    expect(worker).not.toContain("caches.");
    expect(worker).not.toContain('addEventListener("sync"');
  });

  it("uses a fixed Buy Later path and only accepts a UUID item identifier", () => {
    expect(worker).toContain('const DEFAULT_PATH = "/buy-later"');
    expect(worker).toContain("ITEM_ID.test(value.itemId)");
    expect(worker).not.toContain("payload.url");
    expect(worker).toContain("new URL(client.url).origin === self.location.origin");
  });
});
