"use client";

import { useActionState, useRef, useState } from "react";

import { createItemAction, updateItemAction } from "../actions";
import { formatLocationPath } from "../domain/hierarchy";
import {
  filterLocationEntries,
  findLocationEntry,
} from "../item-presentation";
import {
  initialFindItActionState,
  type FindItItem,
  type LocationTreeEntry,
} from "../types";
import { SubmitButton } from "./form-controls";
import { CheckIcon, LocationIcon, SearchIcon } from "./icons";

type ItemFormProps = Readonly<{
  item?: FindItItem;
  locationEntries: readonly LocationTreeEntry[];
}>;

function FieldError({ id, message }: Readonly<{ id: string; message?: string }>) {
  return message ? (
    <p className="field-error" id={id} role="alert">
      {message}
    </p>
  ) : null;
}

function LocationPicker({
  entries,
  isEditing,
  onSelect,
  selectedId,
  serverError,
}: Readonly<{
  entries: readonly LocationTreeEntry[];
  isEditing: boolean;
  onSelect: (locationId: string) => void;
  selectedId: string;
  serverError?: string;
}>) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const selectedEntry = findLocationEntry(entries, selectedId);
  const filteredEntries = filterLocationEntries(entries, query);
  const errorId = "item-location-error";

  function openPicker() {
    setQuery("");
    dialogRef.current?.showModal();
    window.requestAnimationFrame(() => searchRef.current?.focus());
  }

  function chooseLocation(locationId: string) {
    onSelect(locationId);
    dialogRef.current?.close();
  }

  return (
    <div className="item-location-field" data-location-picker>
      <input name="locationId" readOnly type="hidden" value={selectedId} />
      <div className="item-field-heading">
        <div>
          <span className="item-field-step">02</span>
          <span>{isEditing ? "Move item to" : "Current location"}</span>
        </div>
        <span>Required</span>
      </div>

      <button
        aria-describedby={serverError ? errorId : undefined}
        aria-haspopup="dialog"
        className="selected-location-button"
        data-invalid={serverError ? "true" : undefined}
        onClick={openPicker}
        type="button"
      >
        <span className="selected-location-icon" aria-hidden="true">
          <LocationIcon />
        </span>
        {selectedEntry ? (
          <span className="selected-location-copy">
            <span>{selectedEntry.path.slice(0, -1).join(" → ") || "Top level"}</span>
            <strong>{selectedEntry.location.name}</strong>
          </span>
        ) : (
          <span className="selected-location-copy">
            <span>Where does this item live?</span>
            <strong>Choose a location</strong>
          </span>
        )}
        <span className="selected-location-action">
          {selectedEntry ? "Change" : "Choose"}
        </span>
      </button>
      <FieldError id={errorId} message={serverError} />

      <dialog
        aria-labelledby="location-picker-title"
        className="location-picker-dialog"
        ref={dialogRef}
      >
        <div className="location-picker-header">
          <div>
            <p className="section-kicker">Choose a place</p>
            <h2 id="location-picker-title">
              {isEditing ? "Move item to…" : "Where is this item?"}
            </h2>
          </div>
          <button
            aria-label="Close location picker"
            className="picker-close"
            onClick={() => dialogRef.current?.close()}
            type="button"
          >
            Close
          </button>
        </div>

        <label className="location-filter">
          <SearchIcon />
          <span className="visually-hidden">Filter locations</span>
          <input
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search locations"
            ref={searchRef}
            type="search"
            value={query}
          />
        </label>

        <div className="location-picker-results">
          <p aria-live="polite">
            {filteredEntries.length} {filteredEntries.length === 1 ? "location" : "locations"}
          </p>
          {filteredEntries.length ? (
            <ul>
              {filteredEntries.map((entry) => {
                const isSelected = entry.location.id === selectedId;
                const parentPath = entry.path.slice(0, -1);

                return (
                  <li key={entry.location.id}>
                    <button
                      aria-pressed={isSelected}
                      onClick={() => chooseLocation(entry.location.id)}
                      type="button"
                    >
                      <span className="picker-depth" aria-hidden="true">
                        {entry.depth === 0 ? "Top" : `L${entry.depth + 1}`}
                      </span>
                      <span className="picker-location-copy">
                        <strong>{entry.location.name}</strong>
                        <span>
                          {parentPath.length
                            ? `Inside ${formatLocationPath(parentPath)}`
                            : "Top-level location"}
                        </span>
                      </span>
                      {isSelected ? <CheckIcon className="picker-check" /> : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="picker-empty">
              <strong>No locations found</strong>
              <span>Try another name or part of the path.</span>
            </div>
          )}
        </div>
      </dialog>
    </div>
  );
}

export function ItemForm({ item, locationEntries }: ItemFormProps) {
  const action = item ? updateItemAction : createItemAction;
  const [state, formAction] = useActionState(action, initialFindItActionState);
  const isEditing = Boolean(item);
  const initialLocationId = state.values.locationId ?? item?.locationId ?? "";
  const [selectedLocationId, setSelectedLocationId] = useState(initialLocationId);
  const [clientLocationError, setClientLocationError] = useState("");
  const [descriptionOpen, setDescriptionOpen] = useState(
    Boolean(state.values.description ?? item?.description),
  );
  const nameError = state.message.startsWith("Item name") ? state.message : undefined;
  const descriptionError = state.message.startsWith("Description")
    ? state.message
    : undefined;
  const locationError = /location|hierarchy/i.test(state.message)
    ? state.message
    : undefined;
  const otherError = state.message && !nameError && !descriptionError && !locationError
    ? state.message
    : undefined;

  return (
    <form
      className="item-form"
      action={formAction}
      onSubmit={(event) => {
        const locationInput = event.currentTarget.elements.namedItem("locationId");

        if (locationInput instanceof HTMLInputElement && !locationInput.value) {
          event.preventDefault();
          setClientLocationError("Choose where this item lives.");
          const picker = event.currentTarget.querySelector<HTMLElement>(
            "[data-location-picker]",
          );
          picker?.scrollIntoView({ behavior: "smooth", block: "center" });
          picker?.querySelector<HTMLButtonElement>("button")?.focus();
        }
      }}
    >
      {item ? <input type="hidden" name="itemId" value={item.id} /> : null}

      <label className="field item-name-field">
        <span className="item-field-heading">
          <span>
            <span className="item-field-step">01</span>
            <span>Item name</span>
          </span>
          <span>Required</span>
        </span>
        <input
          aria-describedby={nameError ? "item-name-error" : undefined}
          aria-invalid={Boolean(nameError)}
          autoComplete="off"
          autoFocus={!item}
          defaultValue={state.values.name ?? item?.name ?? ""}
          maxLength={120}
          name="name"
          placeholder="Passport"
          required
        />
        <FieldError id="item-name-error" message={nameError} />
      </label>

      <LocationPicker
        entries={locationEntries}
        isEditing={isEditing}
        onSelect={(locationId) => {
          setSelectedLocationId(locationId);
          setClientLocationError("");
        }}
        selectedId={selectedLocationId}
        serverError={clientLocationError || locationError}
      />

      <details
        className="item-description"
        onToggle={(event) => setDescriptionOpen(event.currentTarget.open)}
        open={descriptionOpen}
      >
        <summary>
          <span><span className="item-field-step">03</span> Description</span>
          <span>Optional</span>
        </summary>
        <label className="field">
          <span className="visually-hidden">Description</span>
          <textarea
            aria-describedby={descriptionError ? "item-description-error" : "description-hint"}
            aria-invalid={Boolean(descriptionError)}
            defaultValue={state.values.description ?? item?.description ?? ""}
            maxLength={500}
            name="description"
            placeholder="A short note to help you recognize it"
          />
          <span className="form-hint" id="description-hint">Add only what helps distinguish this item.</span>
          <FieldError id="item-description-error" message={descriptionError} />
        </label>
      </details>

      <FieldError id="item-form-error" message={otherError} />

      <div className="item-form-actions">
        <SubmitButton
          label={item ? "Save changes" : "Add item"}
          pendingLabel="Saving…"
        />
      </div>
    </form>
  );
}
