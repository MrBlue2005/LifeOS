"use client";

import { useActionState, useState } from "react";

import {
  createLocationAction,
  deleteLocationAction,
  updateLocationAction,
} from "../actions";
import { formatLocationPath } from "../domain/hierarchy";
import {
  getLocationPresentation,
  getMoveDestinationEntries,
} from "../location-presentation";
import {
  initialFindItActionState,
  type FindItLocation,
  type LocationTreeEntry,
} from "../types";
import { FormFeedback, SubmitButton } from "./form-controls";
import { MoreIcon, PlusIcon } from "./icons";

type LocationManagerProps = Readonly<{
  entries: readonly LocationTreeEntry[];
  locations: readonly FindItLocation[];
  itemCounts: Readonly<Record<string, number>>;
}>;

type LocationAction = "add" | "rename" | "move" | "delete";

function CountLabel({ count, noun }: Readonly<{ count: number; noun: string }>) {
  return <span>{count} {noun}{count === 1 ? "" : "s"}</span>;
}

function ChildLocationForm({ entry }: Readonly<{ entry: LocationTreeEntry }>) {
  const [state, action] = useActionState(
    createLocationAction,
    initialFindItActionState,
  );

  return (
    <form className="form-stack location-action-form" action={action}>
      <input type="hidden" name="parentId" value={entry.location.id} />
      <p className="location-form-context">
        Inside <strong>{formatLocationPath(entry.path)}</strong>
      </p>
      <label className="field">
        <span>Name</span>
        <input
          defaultValue={state.values.name}
          maxLength={100}
          name="name"
          placeholder="Top drawer"
          required
        />
      </label>
      <FormFeedback state={state} />
      <SubmitButton label="Add inside" pendingLabel="Adding…" />
    </form>
  );
}

function RenameLocationForm({ entry }: Readonly<{ entry: LocationTreeEntry }>) {
  const [state, action] = useActionState(
    updateLocationAction,
    initialFindItActionState,
  );

  return (
    <form className="form-stack location-action-form" action={action}>
      <input type="hidden" name="locationId" value={entry.location.id} />
      <input type="hidden" name="parentId" value={entry.location.parentId ?? ""} />
      <p className="location-form-context">
        Rename <strong>{formatLocationPath(entry.path)}</strong>
      </p>
      <label className="field">
        <span>New name</span>
        <input
          defaultValue={state.values.name ?? entry.location.name}
          maxLength={100}
          name="name"
          required
        />
      </label>
      <FormFeedback state={state} />
      <SubmitButton label="Save name" pendingLabel="Saving…" />
    </form>
  );
}

function MoveLocationForm({
  entry,
  entries,
  locations,
}: Readonly<{
  entry: LocationTreeEntry;
  entries: readonly LocationTreeEntry[];
  locations: readonly FindItLocation[];
}>) {
  const [state, action] = useActionState(
    updateLocationAction,
    initialFindItActionState,
  );
  const destinations = getMoveDestinationEntries(
    entry.location.id,
    entries,
    locations,
  );

  return (
    <form className="form-stack location-action-form" action={action}>
      <input type="hidden" name="locationId" value={entry.location.id} />
      <input type="hidden" name="name" value={entry.location.name} />
      <div className="location-form-context">
        <span>Moving</span>
        <strong>{formatLocationPath(entry.path)}</strong>
      </div>
      <label className="field">
        <span>New place</span>
        <select
          defaultValue={state.values.parentId ?? entry.location.parentId ?? ""}
          name="parentId"
        >
          <option value="">Move to top level</option>
          {destinations.map((destination) => (
            <option key={destination.location.id} value={destination.location.id}>
              Inside {formatLocationPath(destination.path)}
            </option>
          ))}
        </select>
      </label>
      <p className="form-hint">
        This location and everything inside it will move together.
      </p>
      <FormFeedback state={state} />
      <SubmitButton label="Move location" pendingLabel="Moving…" />
    </form>
  );
}

function DeleteLocationForm({
  entry,
  blockers,
}: Readonly<{
  entry: LocationTreeEntry;
  blockers: readonly string[];
}>) {
  const [state, action] = useActionState(
    deleteLocationAction,
    initialFindItActionState,
  );
  const blocked = blockers.length > 0;

  return (
    <div className="location-delete-panel">
      <p className="location-form-context">
        Delete <strong>{formatLocationPath(entry.path)}</strong>
      </p>
      {blocked ? (
        <div className="delete-blockers" role="status">
          <strong>This location isn&apos;t empty.</strong>
          <ul>
            {blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}
          </ul>
        </div>
      ) : (
        <p className="delete-ready">This empty location can be permanently deleted.</p>
      )}
      <form
        action={action}
        onSubmit={(event) => {
          if (!window.confirm(`Delete “${entry.location.name}”?`)) {
            event.preventDefault();
          }
        }}
      >
        <input type="hidden" name="locationId" value={entry.location.id} />
        <SubmitButton
          disabled={blocked}
          label="Delete location"
          pendingLabel="Deleting…"
          tone="danger"
        />
      </form>
      <FormFeedback state={state} />
    </div>
  );
}

function LocationEditor({
  entry,
  entries,
  locations,
  itemCounts,
}: Readonly<{
  entry: LocationTreeEntry;
  entries: readonly LocationTreeEntry[];
  locations: readonly FindItLocation[];
  itemCounts: Readonly<Record<string, number>>;
}>) {
  const [activeAction, setActiveAction] = useState<LocationAction | null>(null);
  const presentation = getLocationPresentation(entry, locations, itemCounts);
  const actionPanelId = `location-action-panel-${entry.location.id}`;

  return (
    <li className="location-row" data-root={entry.depth === 0 ? "true" : undefined}>
      <details onToggle={(event) => {
        if (!event.currentTarget.open) setActiveAction(null);
      }}>
        <summary aria-label={`Manage ${formatLocationPath(entry.path)}`}>
          <span className="location-depth-mark" aria-hidden="true">
            {entry.depth === 0 ? <span /> : <i />}
          </span>
          <span className="location-summary-copy">
            <span className="location-level">{presentation.levelLabel}</span>
            <strong className="location-name">{entry.location.name}</strong>
            <span className="location-context">{presentation.contextLabel}</span>
            <span className="location-counts">
              <CountLabel count={presentation.childCount} noun="place" />
              <CountLabel count={presentation.itemCount} noun="item" />
            </span>
          </span>
          <span className="location-manage-label">
            <span>Manage</span>
            <MoreIcon />
          </span>
        </summary>

        <div className="location-editor">
          <div
            className="location-action-tabs"
            aria-label={`Actions for ${entry.location.name}`}
            role="group"
          >
            {([
              ["add", "Add inside"],
              ["rename", "Rename"],
              ["move", "Move"],
              ["delete", "Delete"],
            ] as const).map(([value, label]) => (
              <button
                aria-controls={actionPanelId}
                aria-pressed={activeAction === value}
                className={value === "delete" ? "location-action-danger" : undefined}
                key={value}
                onClick={() => setActiveAction((current) => current === value ? null : value)}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>

          {activeAction ? (
            <div className="location-action-panel" id={actionPanelId}>
              {activeAction === "add" ? <ChildLocationForm entry={entry} /> : null}
              {activeAction === "rename" ? <RenameLocationForm entry={entry} /> : null}
              {activeAction === "move" ? (
                <MoveLocationForm entry={entry} entries={entries} locations={locations} />
              ) : null}
              {activeAction === "delete" ? (
                <DeleteLocationForm blockers={presentation.deletionBlockers} entry={entry} />
              ) : null}
            </div>
          ) : (
            <p className="location-action-prompt">Choose what you want to do.</p>
          )}
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
      <details className="new-root-card" open={locations.length ? undefined : true}>
        <summary>
          <span className="new-root-icon" aria-hidden="true"><PlusIcon /></span>
          <span className="new-root-summary-copy">
            <span className="section-kicker">New main place</span>
            <strong>Add a top-level location</strong>
            <span>Home, Office, or another main place</span>
          </span>
          <span className="new-root-toggle" aria-hidden="true">Add</span>
        </summary>
        <form className="form-stack new-root-form" action={createAction}>
          <input type="hidden" name="parentId" value="" />
          <label className="field">
            <span>Name</span>
            <input
              defaultValue={createState.values.name}
              maxLength={100}
              name="name"
              placeholder="Office"
              required
            />
          </label>
          <FormFeedback state={createState} />
          <SubmitButton label="Add top-level location" pendingLabel="Adding…" />
        </form>
      </details>

      <section className="location-browser" aria-labelledby="your-locations-title">
        <div className="location-browser-heading">
          <div>
            <p className="section-kicker">Your places</p>
            <h2 id="your-locations-title">Location hierarchy</h2>
          </div>
          {entries.length ? <span>{entries.length} total</span> : null}
        </div>
        {entries.length ? (
          <ol className="location-tree">
            {entries.map((entry) => (
              <LocationEditor
                entries={entries}
                entry={entry}
                itemCounts={itemCounts}
                key={entry.location.id}
                locations={locations}
              />
            ))}
          </ol>
        ) : (
          <div className="location-empty">
            <span className="empty-state-mark" aria-hidden="true"><PlusIcon /></span>
            <div>
              <h3>Create the places where you keep things.</h3>
              <p>Add your first top-level location above.</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
