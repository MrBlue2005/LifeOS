import { describe, expect, it } from "vitest";

import {
  normalizeSearchQuery,
  toIlikeContainsPattern,
  validateItemInput,
  validateLocationInput,
} from "./validation";

const locationId = "10000000-0000-4000-8000-000000000001";

describe("Find It validation", () => {
  it("trims and accepts a valid nested location", () => {
    const formData = new FormData();
    formData.set("name", "  Bottom Drawer  ");
    formData.set("parentId", locationId);

    expect(validateLocationInput(formData)).toEqual({
      success: true,
      data: { name: "Bottom Drawer", parentId: locationId },
    });
  });

  it("rejects empty and overlong location names", () => {
    const empty = new FormData();
    empty.set("name", "   ");
    const long = new FormData();
    long.set("name", "a".repeat(101));

    expect(validateLocationInput(empty).success).toBe(false);
    expect(validateLocationInput(long).success).toBe(false);
  });

  it("requires an item name and valid current location", () => {
    const missingName = new FormData();
    missingName.set("locationId", locationId);
    const missingLocation = new FormData();
    missingLocation.set("name", "Passport");

    expect(validateItemInput(missingName).success).toBe(false);
    expect(validateItemInput(missingLocation).success).toBe(false);
  });

  it("normalizes deterministic search text and escapes SQL wildcards", () => {
    expect(normalizeSearchQuery("  car    registration  ")).toBe(
      "car registration",
    );
    expect(toIlikeContainsPattern("50%_off")).toBe("%50\\%\\_off%");
  });
});
