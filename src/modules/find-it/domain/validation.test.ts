import { describe, expect, it } from "vitest";

import {
  MAX_ALIASES_PER_ITEM,
  MAX_ALIAS_LENGTH,
  normalizeFindItAlias,
  normalizeFindItAliasDisplay,
  normalizeSearchQuery,
  toIlikeContainsPattern,
  validateFindItAlias,
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
    expect(toIlikeContainsPattern("torch\\case")).toBe("%torch\\\\case%");
    expect(toIlikeContainsPattern("light's case")).toBe("%light's case%");
  });

  it("normalizes aliases without changing their meaningful display characters", () => {
    expect(normalizeFindItAliasDisplay("  Emergency   light's—case  ")).toBe("Emergency light's—case");
    expect(normalizeFindItAlias("  Lantern  ")).toBe("lantern");
    expect(normalizeFindItAliasDisplay("Șurub")).toBe("Șurub");
    expect(normalizeFindItAlias("șurub")).not.toBe(normalizeFindItAlias("surub"));
    expect(normalizeFindItAlias("  Șurub  ")).toBe("șurub");
    expect(toIlikeContainsPattern(normalizeFindItAlias("  Șurub  "))).toBe("%șurub%");
  });

  it("validates alias limits and rejects canonical-name equivalents", () => {
    expect(MAX_ALIASES_PER_ITEM).toBe(12);
    expect(validateFindItAlias("  Torch  ", "Flashlight")).toEqual({
      success: true,
      data: { alias: "Torch", normalizedAlias: "torch" },
    });
    expect(validateFindItAlias("   ").success).toBe(false);
    expect(validateFindItAlias("a".repeat(MAX_ALIAS_LENGTH + 1)).success).toBe(false);
    expect(validateFindItAlias("FLASHLIGHT", " flashlight ").success).toBe(false);
  });
});
