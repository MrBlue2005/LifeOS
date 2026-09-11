import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const actions = readFileSync(
  join(process.cwd(), "src", "modules", "find-it", "actions.ts"),
  "utf8",
);

describe("Find It server-action exports", () => {
  it("keeps runtime exports in the use-server module async functions only", () => {
    expect(actions).toContain('"use server"');
    expect(actions).not.toMatch(/^export const /m);
    expect(actions).not.toMatch(/^export function /m);
    expect(actions.match(/^export async function /gm)).toHaveLength(8);
  });
});
