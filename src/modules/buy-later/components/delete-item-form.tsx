"use client";

import { useActionState } from "react";
import { deleteBuyLaterItemAction } from "../actions";
import { initialBuyLaterActionState } from "../types";
import { BuyLaterFeedback, BuyLaterSubmitButton } from "./form-controls";

export function DeleteBuyLaterItemForm({ itemId, itemName }: Readonly<{ itemId: string; itemName: string }>) {
  const [state, action] = useActionState(deleteBuyLaterItemAction, initialBuyLaterActionState);
  return <section className="danger-zone buy-later-delete" aria-labelledby="buy-delete-title"><div><p className="section-kicker">Permanent action</p><h2 id="buy-delete-title">Delete this record</h2><p>This removes the purchase intention completely. Purchased and dismissed decisions otherwise stay in History.</p></div><form action={action} onSubmit={(event) => { if (!window.confirm(`Permanently delete “${itemName}”?`)) event.preventDefault(); }}><input name="itemId" type="hidden" value={itemId} /><BuyLaterSubmitButton label="Delete permanently" pendingLabel="Deleting…" tone="danger" /><BuyLaterFeedback state={state} /></form></section>;
}
