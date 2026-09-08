import { describe, expect, it } from "vitest";
import { canTransitionStatus } from "./lifecycle";

describe("Buy Later lifecycle", () => {
  it("only resolves active intentions into final decisions", () => {
    expect(canTransitionStatus("considering", "purchased")).toBe(true);
    expect(canTransitionStatus("considering", "dismissed")).toBe(true);
    expect(canTransitionStatus("purchased", "considering")).toBe(false);
    expect(canTransitionStatus("dismissed", "purchased")).toBe(false);
  });
});
