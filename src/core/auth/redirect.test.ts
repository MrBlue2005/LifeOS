import { describe, expect, it } from "vitest";

import { getSafeRedirectPath } from "./redirect";

describe("getSafeRedirectPath", () => {
  it("keeps a local application path", () => {
    expect(getSafeRedirectPath("/find-it/items/new")).toBe(
      "/find-it/items/new",
    );
  });

  it("rejects external and protocol-relative redirects", () => {
    expect(getSafeRedirectPath("https://example.com")).toBe("/find-it");
    expect(getSafeRedirectPath("//example.com")).toBe("/find-it");
  });

  it("uses a caller-provided fallback for a missing path", () => {
    expect(getSafeRedirectPath(undefined, "/")).toBe("/");
  });
});
