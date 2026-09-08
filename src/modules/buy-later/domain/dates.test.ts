import { describe, expect, it } from "vitest";
import { addMonth, daysUntilReconsideration, formatReconsiderationDistance, isBuyLaterItemDue, reconsiderationPresets } from "./dates";
import type { BuyLaterItem } from "../types";

const item = { status: "considering", reconsiderAt: "2026-09-07" } as BuyLaterItem;

describe("Buy Later dates", () => {
  it("marks active items due on or before today", () => {
    expect(isBuyLaterItemDue(item, "2026-09-07")).toBe(true);
    expect(isBuyLaterItemDue({ ...item, reconsiderAt: "2026-09-06" }, "2026-09-07")).toBe(true);
    expect(isBuyLaterItemDue({ ...item, reconsiderAt: "2026-09-08" }, "2026-09-07")).toBe(false);
    expect(isBuyLaterItemDue({ ...item, status: "purchased" }, "2026-09-07")).toBe(false);
  });

  it("uses date-only calendar arithmetic for waiting language", () => {
    expect(daysUntilReconsideration("2026-03-30", "2026-03-29")).toBe(1);
    expect(formatReconsiderationDistance("2026-09-15", "2026-09-08")).toBe("in 1 week");
    expect(formatReconsiderationDistance("2026-09-11", "2026-09-08")).toBe("in 3 days");
  });

  it("builds deterministic presets and clamps month ends", () => {
    expect(reconsiderationPresets("2026-09-07").map(({ value }) => value)).toEqual([
      "2026-09-08", "2026-09-10", "2026-09-14", "2026-09-21", "2026-10-07",
    ]);
    expect(addMonth("2026-01-31")).toBe("2026-02-28");
  });
});
