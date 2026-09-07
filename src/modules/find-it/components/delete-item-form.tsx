"use client";

import { useActionState } from "react";

import { deleteItemAction } from "../actions";
import { initialFindItActionState } from "../types";
import { FormFeedback, SubmitButton } from "./form-controls";

export function DeleteItemForm({
  itemId,
  itemName,
}: Readonly<{ itemId: string; itemName: string }>) {
  const [state, action] = useActionState(
    deleteItemAction,
    initialFindItActionState,
  );

  return (
    <section className="danger-zone item-delete-zone" aria-labelledby="delete-item-title">
      <div>
        <p className="section-kicker">Permanent action</p>
        <h2 id="delete-item-title">Delete this item</h2>
        <p>This removes it from Find It. This action cannot be undone.</p>
      </div>
      <div className="item-delete-action">
        <form
          action={action}
          onSubmit={(event) => {
            if (!window.confirm(`Delete “${itemName}”?`)) {
              event.preventDefault();
            }
          }}
        >
          <input type="hidden" name="itemId" value={itemId} />
          <SubmitButton
            label="Delete item"
            pendingLabel="Deleting…"
            tone="danger"
          />
        </form>
        <FormFeedback state={state} />
      </div>
    </section>
  );
}
