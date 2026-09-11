"use client";

import { useActionState, useState } from "react";

import {
  addItemAliasAction,
  initialFindItAliasActionState,
  removeItemAliasAction,
  type FindItAliasActionState,
} from "../actions";
import type { FindItItemAlias } from "../types";
import { SubmitButton } from "./form-controls";

type AliasManagerProps = Readonly<{
  itemId: string;
  aliases: readonly FindItItemAlias[];
}>;

function AliasFeedback({
  message,
  status,
}: Readonly<{ message: string; status: "idle" | "error" | "success" }>) {
  if (!message) {
    return null;
  }

  return (
    <p
      aria-live="polite"
      className={status === "error" ? "field-error" : "alias-feedback"}
      id="item-alias-feedback"
      role={status === "error" ? "alert" : "status"}
    >
      {message}
    </p>
  );
}

export function AliasManager({ itemId, aliases }: AliasManagerProps) {
  const [alias, setAlias] = useState("");
  const [lastOperation, setLastOperation] = useState<"add" | "remove">("add");
  const [addState, addAction] = useActionState(async (
    previousState: FindItAliasActionState,
    formData: FormData,
  ) => {
    const nextState = await addItemAliasAction(previousState, formData);

    if (nextState.status === "success") {
      setAlias("");
    }

    return nextState;
  }, initialFindItAliasActionState);
  const [removeState, removeAction] = useActionState(
    removeItemAliasAction,
    initialFindItAliasActionState,
  );

  const feedback = lastOperation === "add" ? addState : removeState;

  return (
    <section className="item-aliases" aria-labelledby="item-aliases-title">
      <div className="item-aliases-heading">
        <div>
          <p className="section-kicker">Also known as</p>
          <h2 id="item-aliases-title">Other names you might remember</h2>
          <p>Help Find It recognize this item later.</p>
        </div>
        <span>{aliases.length}/12</span>
      </div>

      {aliases.length ? (
        <ul className="item-alias-list">
          {aliases.map((currentAlias) => (
            <li key={currentAlias.id}>
              <span>{currentAlias.alias}</span>
              <form action={removeAction} onSubmit={() => setLastOperation("remove")}>
                <input name="itemId" type="hidden" value={itemId} />
                <input name="aliasId" type="hidden" value={currentAlias.id} />
                <SubmitButton
                  ariaLabel={`Remove alias ${currentAlias.alias}`}
                  label="Remove"
                  pendingLabel="Removing…"
                  tone="danger"
                />
              </form>
            </li>
          ))}
        </ul>
      ) : (
        <p className="alias-empty">No aliases yet.</p>
      )}

      <form
        action={addAction}
        className="add-alias-form"
        onSubmit={() => setLastOperation("add")}
      >
        <input name="itemId" type="hidden" value={itemId} />
        <label htmlFor="item-alias-input">Add another name</label>
        <div>
          <input
            aria-describedby={feedback.message ? "item-alias-feedback" : undefined}
            aria-invalid={feedback.status === "error"}
            autoComplete="off"
            id="item-alias-input"
            maxLength={60}
            name="alias"
            onChange={(event) => setAlias(event.target.value)}
            placeholder="Torch"
            value={alias}
          />
          <SubmitButton label="Add alias" pendingLabel="Adding…" />
        </div>
      </form>

      <AliasFeedback message={feedback.message} status={feedback.status} />
    </section>
  );
}
