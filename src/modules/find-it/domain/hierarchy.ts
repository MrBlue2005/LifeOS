import type { FindItLocation, LocationTreeEntry } from "../types";

export function getLocationPath(
  locationId: string,
  locations: readonly FindItLocation[],
): readonly string[] {
  const byId = new Map(locations.map((location) => [location.id, location]));
  const path: string[] = [];
  const visited = new Set<string>();
  let currentId: string | null = locationId;

  while (currentId) {
    if (visited.has(currentId)) {
      throw new Error("Location hierarchy contains a cycle.");
    }

    visited.add(currentId);
    const location = byId.get(currentId);

    if (!location) {
      throw new Error("Location hierarchy contains a missing parent.");
    }

    path.unshift(location.name);
    currentId = location.parentId;
  }

  return path;
}

export function formatLocationPath(path: readonly string[]): string {
  return path.join(" → ");
}

export function wouldCreateLocationCycle(
  locationId: string,
  proposedParentId: string | null,
  locations: readonly FindItLocation[],
): boolean {
  if (!proposedParentId) {
    return false;
  }

  const byId = new Map(locations.map((location) => [location.id, location]));
  const visited = new Set<string>();
  let currentId: string | null = proposedParentId;

  while (currentId) {
    if (currentId === locationId || visited.has(currentId)) {
      return true;
    }

    visited.add(currentId);
    currentId = byId.get(currentId)?.parentId ?? null;
  }

  return false;
}

export function buildLocationTree(
  locations: readonly FindItLocation[],
): readonly LocationTreeEntry[] {
  const children = new Map<string | null, FindItLocation[]>();

  for (const location of locations) {
    const siblings = children.get(location.parentId) ?? [];
    siblings.push(location);
    children.set(location.parentId, siblings);
  }

  for (const siblings of children.values()) {
    siblings.sort((left, right) => left.name.localeCompare(right.name));
  }

  const result: LocationTreeEntry[] = [];
  const visited = new Set<string>();

  function visit(location: FindItLocation, depth: number, parentPath: string[]) {
    if (visited.has(location.id)) {
      return;
    }

    visited.add(location.id);
    const path = [...parentPath, location.name];
    result.push({ location, depth, path });

    for (const child of children.get(location.id) ?? []) {
      visit(child, depth + 1, path);
    }
  }

  for (const root of children.get(null) ?? []) {
    visit(root, 0, []);
  }

  return result;
}
