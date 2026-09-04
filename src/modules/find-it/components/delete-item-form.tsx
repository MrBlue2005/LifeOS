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
    <div className="danger-zone">
      <h2>Remove item</h2>
      <p>This permanently removes the item from Find It.</p>
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
  );
}
