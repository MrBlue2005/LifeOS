import type { BuyLaterStatus } from "../types";

export function canTransitionStatus(from: BuyLaterStatus, to: BuyLaterStatus): boolean {
  return from === "considering" && (to === "purchased" || to === "dismissed");
}
