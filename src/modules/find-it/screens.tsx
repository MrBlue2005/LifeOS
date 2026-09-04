import Link from "next/link";
import { notFound } from "next/navigation";

import { ConfigurationRequired } from "@/core/components/configuration-required";
import { DeleteItemForm } from "./components/delete-item-form";
import { ItemForm } from "./components/item-form";
import { LocationManager } from "./components/location-manager";
import {
  getItemById,
  listItems,
  listLocations,
} from "./data/queries";
import {
  buildLocationTree,
  formatLocationPath,
  getLocationPath,
} from "./domain/hierarchy";
import { isUuid, normalizeSearchQuery } from "./domain/validation";

function Notice({ value }: Readonly<{ value?: string }>) {
  const messages: Readonly<Record<string, string>> = {
    "item-created": "Item saved.",
    "item-deleted": "Item deleted.",
    "item-updated": "Item updated.",
    "location-created": "Location added.",
    "location-deleted": "Location deleted.",
    "location-updated": "Location updated.",
  };
  const message = value ? messages[value] : undefined;

  return message ? (
    <p className="notice" role="status">
      {message}
    </p>
  ) : null;
}

export function FindItConfigurationRequired() {
  return <ConfigurationRequired />;
}

export async function FindItHomeScreen({
  userId,
  rawQuery,
  notice,
}: Readonly<{ userId: string; rawQuery?: string; notice?: string }>) {
  const query = normalizeSearchQuery(rawQuery);
  const [items, locations] = await Promise.all([
    listItems(userId, query),
    listLocations(userId),
  ]);
  const results = items.map((item) => ({
    item,
    locationPath: getLocationPath(item.locationId, locations),
  }));

  return (
    <div className="find-it-page">
      <header className="module-heading">
        <div>
          <p className="eyebrow">Find It</p>
          <h1>Know where everything is.</h1>
        </div>
        <nav className="page-actions" aria-label="Find It actions">
          <Link className="secondary-link" href="/find-it/locations">
            Manage locations
          </Link>
          {locations.length ? (
            <Link className="primary-link" href="/find-it/items/new">
              Add item
            </Link>
          ) : null}
        </nav>
      </header>

      <Notice value={notice} />

      <form className="search-form" role="search">
        <label htmlFor="find-it-search">Search your items</label>
        <div className="search-row">
          <input
            className="search-input"
            defaultValue={query}
            id="find-it-search"
            maxLength={100}
            name="q"
            placeholder="Passport, registration certificate…"
            type="search"
          />
          <button className="primary-button" type="submit">
            Search
          </button>
        </div>
      </form>

      {!locations.length ? (
        <section className="empty-state prominent-empty" aria-labelledby="start-title">
          <h2 id="start-title">Start with a location</h2>
          <p>
            Create a place such as Home, then add rooms, furniture, or containers
            in whatever structure makes sense to you.
          </p>
          <Link className="primary-link" href="/find-it/locations">
            Create your first location
          </Link>
        </section>
      ) : (
        <section className="results-section" aria-labelledby="results-title">
          <div className="section-heading horizontal-heading">
            <h2 id="results-title">{query ? "Search results" : "Your items"}</h2>
            <span>{results.length} found</span>
          </div>
          {results.length ? (
            <ul className="item-results">
              {results.map(({ item, locationPath }) => (
                <li key={item.id}>
                  <Link href={`/find-it/items/${item.id}`}>
                    <strong>{item.name}</strong>
                    {item.description ? <span>{item.description}</span> : null}
                    <span className="result-path">
                      {formatLocationPath(locationPath)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-state">
              <h3>{query ? "No matching items" : "No items yet"}</h3>
              <p>
                {query
                  ? "Try a shorter part of the item name."
                  : "Add an item and choose where it lives."}
              </p>
              {!query ? (
                <Link className="primary-link" href="/find-it/items/new">
                  Add your first item
                </Link>
              ) : null}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export async function LocationsScreen({
  userId,
  notice,
}: Readonly<{ userId: string; notice?: string }>) {
  const [locations, items] = await Promise.all([
    listLocations(userId),
    listItems(userId),
  ]);
  const entries = buildLocationTree(locations);
  const itemCounts = items.reduce<Record<string, number>>((counts, item) => {
    counts[item.locationId] = (counts[item.locationId] ?? 0) + 1;
    return counts;
  }, {});

  return (
    <div className="find-it-page">
      <header className="module-heading">
        <div>
          <p className="eyebrow">Find It</p>
          <h1>Locations</h1>
          <p className="heading-copy">
            Build a hierarchy that matches the way your spaces actually work.
          </p>
        </div>
        <Link className="secondary-link" href="/find-it">
          Back to Find It
        </Link>
      </header>
      <Notice value={notice} />
      <LocationManager
        entries={entries}
        itemCounts={itemCounts}
        locations={locations}
      />
    </div>
  );
}

export async function NewItemScreen({ userId }: Readonly<{ userId: string }>) {
  const locations = await listLocations(userId);
  const entries = buildLocationTree(locations);

  return (
    <div className="find-it-page narrow-page">
      <header className="module-heading">
        <div>
          <p className="eyebrow">Find It</p>
          <h1>Add an item</h1>
        </div>
        <Link className="secondary-link" href="/find-it">
          Cancel
        </Link>
      </header>
      {locations.length ? (
        <ItemForm locationEntries={entries} />
      ) : (
        <div className="empty-state">
          <h2>Create a location first</h2>
          <p>Every Find It item needs a current location.</p>
          <Link className="primary-link" href="/find-it/locations">
            Manage locations
          </Link>
        </div>
      )}
    </div>
  );
}

export async function ItemDetailScreen({
  userId,
  itemId,
  notice,
}: Readonly<{ userId: string; itemId: string; notice?: string }>) {
  if (!isUuid(itemId)) {
    notFound();
  }

  const [item, locations] = await Promise.all([
    getItemById(userId, itemId),
    listLocations(userId),
  ]);

  if (!item) {
    notFound();
  }

  const entries = buildLocationTree(locations);
  const path = getLocationPath(item.locationId, locations);

  return (
    <div className="find-it-page narrow-page">
      <header className="module-heading">
        <div>
          <p className="eyebrow">Find It item</p>
          <h1>{item.name}</h1>
          <p className="current-location">{formatLocationPath(path)}</p>
        </div>
        <Link className="secondary-link" href="/find-it">
          Back to search
        </Link>
      </header>
      <Notice value={notice} />
      <section className="panel" aria-labelledby="edit-item-title">
        <h2 id="edit-item-title">Edit or move item</h2>
        <ItemForm item={item} locationEntries={entries} />
      </section>
      <DeleteItemForm itemId={item.id} itemName={item.name} />
    </div>
  );
}
