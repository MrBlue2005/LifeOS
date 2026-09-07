import Link from "next/link";
import { notFound } from "next/navigation";

import { ConfigurationRequired } from "@/core/components/configuration-required";
import { DeleteItemForm } from "./components/delete-item-form";
import {
  ChevronIcon,
  ItemIcon,
  LocationIcon,
  PlusIcon,
  SearchIcon,
} from "./components/icons";
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
    <div className="find-it-page find-it-home">
      <header className="find-it-home-intro">
        <div className="module-identity">
          <span className="module-identity-mark" aria-hidden="true">
            <LocationIcon />
          </span>
          <p>
            RX LifeOS <span aria-hidden="true">/</span> <strong>Find It</strong>
          </p>
        </div>
        <h1>What are you trying to find?</h1>
        <p className="find-it-home-copy">
          Search the things you&apos;ve saved and see exactly where they are.
        </p>
      </header>

      <Notice value={notice} />

      <section
        className="find-it-search-area"
        aria-labelledby="find-it-search-label"
      >
        <form className="find-it-search-form" role="search">
          <label
            className="visually-hidden"
            id="find-it-search-label"
            htmlFor="find-it-search"
          >
            Search your saved items
          </label>
          <div className="search-row">
            <SearchIcon className="find-it-search-icon" />
            <input
              className="find-it-search-input"
              defaultValue={query}
              id="find-it-search"
              maxLength={100}
              name="q"
              placeholder="Passport, HDMI cable, car documents…"
              type="search"
            />
            {query ? (
              <Link className="search-clear" href="/find-it">
                Clear
              </Link>
            ) : null}
            <button className="search-submit" type="submit">
              Search
            </button>
          </div>
        </form>

        <nav className="find-it-quick-actions" aria-label="Find It actions">
          {locations.length ? (
            <Link
              className="quick-action quick-action-primary"
              href="/find-it/items/new"
            >
              <span className="quick-action-icon" aria-hidden="true">
                <PlusIcon />
              </span>
              <span>
                <strong>Add item</strong>
                <small>Save where something lives</small>
              </span>
            </Link>
          ) : null}
          <Link className="quick-action" href="/find-it/locations">
            <span className="quick-action-icon" aria-hidden="true">
              <LocationIcon />
            </span>
            <span>
              <strong>Manage locations</strong>
              <small>Organize rooms and storage</small>
            </span>
          </Link>
        </nav>
      </section>

      {!locations.length ? (
        <section className="find-it-empty" aria-labelledby="start-title">
          <span className="empty-state-mark" aria-hidden="true">
            <LocationIcon />
          </span>
          <div>
            <p className="section-kicker">Your first place</p>
            <h2 id="start-title">
              Save where you put things. Find them instantly later.
            </h2>
            <p>Start with Home, a room, or any place that makes sense to you.</p>
          </div>
          <Link className="primary-link" href="/find-it/locations">
            Create your first location
          </Link>
        </section>
      ) : (
        <section className="find-it-results" aria-labelledby="results-title">
          <div className="find-it-results-heading">
            <div>
              <p className="section-kicker">
                {query ? "Matching items" : "Saved items"}
              </p>
              <h2 id="results-title">
                {query ? `Results for “${query}”` : "Everything has a place"}
              </h2>
            </div>
            <span>
              {results.length} {results.length === 1 ? "item" : "items"}
            </span>
          </div>
          {results.length ? (
            <ul className="find-it-result-list">
              {results.map(({ item, locationPath }) => (
                <li key={item.id}>
                  <Link href={`/find-it/items/${item.id}`}>
                    <span className="result-item-mark" aria-hidden="true">
                      <span />
                    </span>
                    <span className="result-item-copy">
                      <strong>{item.name}</strong>
                      {item.description ? <span>{item.description}</span> : null}
                      <span className="result-path">
                        <LocationIcon />
                        {formatLocationPath(locationPath)}
                      </span>
                    </span>
                    <ChevronIcon className="result-chevron" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="find-it-empty compact-empty">
              <span className="empty-state-mark" aria-hidden="true">
                <SearchIcon />
              </span>
              <div>
                <h3>
                  {query ? "Nothing matched that search" : "No items saved yet"}
                </h3>
                <p>
                  {query
                    ? "Try part of the item name, or clear the search to see everything."
                    : "Add your first item and choose where it lives."}
                </p>
              </div>
              {query ? (
                <Link className="secondary-link" href="/find-it">
                  Clear search
                </Link>
              ) : (
                <Link className="primary-link" href="/find-it/items/new">
                  Add your first item
                </Link>
              )}
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
    <div className="find-it-page locations-page">
      <header className="module-heading locations-heading">
        <div>
          <div className="module-identity">
            <span className="module-identity-mark" aria-hidden="true">
              <LocationIcon />
            </span>
            <p>
              RX LifeOS <span aria-hidden="true">/</span> <strong>Find It</strong>
            </p>
          </div>
          <h1>Locations</h1>
          <p className="heading-copy">
            Organize the places where your things live.
          </p>
        </div>
        <Link className="secondary-link" href="/find-it">
          Back to search
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
    <div className="find-it-page narrow-page item-page">
      <header className="module-heading item-page-heading">
        <div>
          <div className="module-identity">
            <span className="module-identity-mark" aria-hidden="true">
              <LocationIcon />
            </span>
            <p>
              RX LifeOS <span aria-hidden="true">/</span> <strong>Find It</strong>
            </p>
          </div>
          <h1>Add an item</h1>
          <p className="heading-copy">Remember what it is and where it lives.</p>
        </div>
        <Link className="secondary-link" href="/find-it">
          Cancel
        </Link>
      </header>
      {locations.length ? (
        <section className="item-editor-card" aria-labelledby="add-item-title">
          <h2 className="visually-hidden" id="add-item-title">Item details</h2>
          <ItemForm locationEntries={entries} />
        </section>
      ) : (
        <section className="item-no-locations" aria-labelledby="no-locations-title">
          <span className="empty-state-mark" aria-hidden="true"><LocationIcon /></span>
          <div>
            <p className="section-kicker">One quick setup</p>
            <h2 id="no-locations-title">You need a place before you can save an item.</h2>
            <p>Create the room, drawer, shelf, or any place where this item lives.</p>
          </div>
          <Link className="primary-link" href="/find-it/locations">
            Create a location
          </Link>
        </section>
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
    <div className="find-it-page narrow-page item-page">
      <header className="module-heading item-page-heading">
        <div>
          <div className="module-identity">
            <span className="module-identity-mark" aria-hidden="true">
              <ItemIcon />
            </span>
            <p>
              Find It <span aria-hidden="true">/</span> <strong>Saved item</strong>
            </p>
          </div>
          <h1>{item.name}</h1>
          <p className="current-location">
            <LocationIcon />
            <span>{formatLocationPath(path)}</span>
          </p>
        </div>
        <Link className="secondary-link" href="/find-it">
          Back to search
        </Link>
      </header>
      <Notice value={notice} />
      <section className="item-editor-card" aria-labelledby="edit-item-title">
        <h2 className="visually-hidden" id="edit-item-title">Edit or move this item</h2>
        <ItemForm item={item} locationEntries={entries} />
      </section>
      <DeleteItemForm itemId={item.id} itemName={item.name} />
    </div>
  );
}
