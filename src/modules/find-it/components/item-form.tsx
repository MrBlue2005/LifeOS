"use client";

import { useActionState } from "react";

import { createItemAction, updateItemAction } from "../actions";
import { formatLocationPath } from "../domain/hierarchy";
import {
  initialFindItActionState,
  type FindItItem,
  type LocationTreeEntry,
} from "../types";
import { FormFeedback, SubmitButton } from "./form-controls";

type ItemFormProps = Readonly<{
  item?: FindItItem;
  locationEntries: readonly LocationTreeEntry[];
}>;

export function ItemForm({ item, locationEntries }: ItemFormProps) {
  const action = item ? updateItemAction : createItemAction;
  const [state, formAction] = useActionState(action, initialFindItActionState);

  return (
    <form className="form-stack item-form" action={formAction}>
      {item ? <input type="hidden" name="itemId" value={item.id} /> : null}
      <label className="field">
        <span>Item name</span>
        <input
          autoFocus
          defaultValue={state.values.name ?? item?.name ?? ""}
          maxLength={120}
          name="name"
          placeholder="Passport"
          required
        />
      </label>
      <label className="field">
        <span>
          Description <span className="optional-label">Optional</span>
        </span>
        <textarea
          defaultValue={state.values.description ?? item?.description ?? ""}
          maxLength={500}
          name="description"
          placeholder="A short note that helps distinguish this item"
        />
      </label>
      <label className="field">
        <span>Current location</span>
        <select
          defaultValue={state.values.locationId ?? item?.locationId ?? ""}
          name="locationId"
          required
        >
          <option disabled value="">
            Choose a location
          </option>
          {locationEntries.map((entry) => (
            <option key={entry.location.id} value={entry.location.id}>
              {formatLocationPath(entry.path)}
            </option>
          ))}
        </select>
      </label>
      <FormFeedback state={state} />
      <SubmitButton
        label={item ? "Save item" : "Add item"}
        pendingLabel="Saving…"
      />
    </form>
  );
}
