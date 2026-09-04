"use client";

import { useActionState } from "react";

import {
  createLocationAction,
  deleteLocationAction,
  updateLocationAction,
} from "../actions";
import {
  formatLocationPath,
  wouldCreateLocationCycle,
} from "../domain/hierarchy";
import {
  initialFindItActionState,
  type FindItLocation,
  type LocationTreeEntry,
} from "../types";
import { FormFeedback, SubmitButton } from "./form-controls";

type LocationManagerProps = Readonly<{
  entries: readonly LocationTreeEntry[];
  locations: readonly FindItLocation[];
  itemCounts: Readonly<Record<string, number>>;
}>;

function ParentOptions({
  entries,
}: Readonly<{
  entries: readonly LocationTreeEntry[];
}>) {
  return (
    <>
      <option value="">No parent — root location</option>
      {entries.map((entry) => (
        <option key={entry.location.id} value={entry.location.id}>
          {formatLocationPath(entry.path)}
        </option>
      ))}
    </>
  );
}

function LocationEditor({
  entry,
  entries,
  locations,
  itemCount,
}: Readonly<{
  entry: LocationTreeEntry;
  entries: readonly LocationTreeEntry[];
  locations: readonly FindItLocation[];
  itemCount: number;
}>) {
  const [updateState, updateAction] = useActionState(
    updateLocationAction,
    initialFindItActionState,
  );
  const [deleteState, deleteAction] = useActionState(
    deleteLocationAction,
    initialFindItActionState,
  );
  const childCount = locations.filter(
    ({ parentId }) => parentId === entry.location.id,
  ).length;
  const deletionBlocked = childCount > 0 || itemCount > 0;
  const parentEntries = entries.filter(
    (candidate) =>
      !wouldCreateLocationCycle(
        entry.location.id,
        candidate.location.id,
        locations,
      ),
  );

  return (
    <li className="location-row">
      <details>
        <summary>
          <span className="location-name">{entry.location.name}</span>
          <span className="location-path">{formatLocationPath(entry.path)}</span>
        </summary>

        <div className="location-editor">
          <form className="form-stack compact-form" action={updateAction}>
            <input type="hidden" name="locationId" value={entry.location.id} />
            <label className="field">
              <span>Name</span>
              <input
                defaultValue={updateState.values.name ?? entry.location.name}
                maxLength={100}
                name="name"
                required
              />
            </label>
            <label className="field">
              <span>Parent location</span>
              <select
                defaultValue={
                  updateState.values.parentId ?? entry.location.parentId ?? ""
                }
                name="parentId"
              >
                <ParentOptions entries={parentEntries} />
              </select>
            </label>
            <FormFeedback state={updateState} />
            <SubmitButton label="Save changes" pendingLabel="Saving…" />
          </form>

          <div className="danger-zone">
            <p>
              {deletionBlocked
                ? `Move ${childCount} child location${childCount === 1 ? "" : "s"} and ${itemCount} item${itemCount === 1 ? "" : "s"} before deleting.`
                : "This location is empty and can be permanently deleted."}
            </p>
            <form
              action={deleteAction}
              onSubmit={(event) => {
                if (!window.confirm(`Delete “${entry.location.name}”?`)) {
                  event.preventDefault();
                }
              }}
            >
              <input type="hidden" name="locationId" value={entry.location.id} />
              <SubmitButton
                disabled={deletionBlocked}
                label="Delete location"
                pendingLabel="Deleting…"
                tone="danger"
              />
            </form>
            <FormFeedback state={deleteState} />
          </div>
        </div>
      </details>
    </li>
  );
}

export function LocationManager({
  entries,
  locations,
  itemCounts,
}: LocationManagerProps) {
  const [createState, createAction] = useActionState(
    createLocationAction,
    initialFindItActionState,
  );

  return (
    <div className="location-layout">
      <section className="panel" aria-labelledby="new-location-title">
        <h2 id="new-location-title">Add a location</h2>
        <form className="form-stack" action={createAction}>
          <label className="field">
            <span>Name</span>
            <input
              autoFocus={locations.length === 0}
              defaultValue={createState.values.name}
              maxLength={100}
              name="name"
              placeholder="Home, office, drawer…"
              required
            />
          </label>
          <label className="field">
            <span>Inside</span>
            <select defaultValue={createState.values.parentId ?? ""} name="parentId">
              <ParentOptions entries={entries} />
            </select>
          </label>
          <FormFeedback state={createState} />
          <SubmitButton label="Add location" pendingLabel="Adding…" />
        </form>
      </section>

      <section className="location-browser" aria-labelledby="your-locations-title">
        <h2 id="your-locations-title">Your locations</h2>
        {entries.length ? (
          <ol className="location-tree">
            {entries.map((entry) => (
              <LocationEditor
                entries={entries}
                entry={entry}
                itemCount={itemCounts[entry.location.id] ?? 0}
                key={entry.location.id}
                locations={locations}
              />
            ))}
          </ol>
        ) : (
          <div className="empty-state">
            <h3>No locations yet</h3>
            <p>Create a root location such as Home or Office to begin.</p>
          </div>
        )}
      </section>
    </div>
  );
}
