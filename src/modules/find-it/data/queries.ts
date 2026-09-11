import { createSupabaseServerClient } from "@/core/supabase/server";
import {
  normalizeFindItAlias,
  toIlikeContainsPattern,
} from "../domain/validation";
import {
  FIND_IT_SEARCH_RESULT_LIMIT,
  mergeFindItSearchResults,
  type FindItAliasSearchRow,
} from "./search-results";
import type {
  FindItItem,
  FindItItemSearchResult,
  FindItLocation,
} from "../types";

const itemSelect = "id,user_id,name,description,location_id,created_at,updated_at";

function mapLocation(row: {
  id: string;
  user_id: string;
  name: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
}): FindItLocation {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    parentId: row.parent_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapItem(row: {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  location_id: string;
  created_at: string;
  updated_at: string;
}): FindItItem {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description,
    locationId: row.location_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listLocations(userId: string): Promise<FindItLocation[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("find_it_locations")
    .select("id,user_id,name,parent_id,created_at,updated_at")
    .eq("user_id", userId)
    .order("name");

  if (error) {
    throw new Error("Could not load locations.");
  }

  return data.map(mapLocation);
}

export async function listItems(
  userId: string,
  query = "",
): Promise<FindItItem[]> {
  const supabase = await createSupabaseServerClient();
  let request = supabase
    .from("find_it_items")
    .select(itemSelect)
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (query) {
    request = request.ilike("name", toIlikeContainsPattern(query));
  }

  const { data, error } = await request;

  if (error) {
    throw new Error("Could not load items.");
  }

  return data.map(mapItem);
}

export async function searchItems(
  userId: string,
  canonicalQuery: string,
): Promise<readonly FindItItemSearchResult[]> {
  const supabase = await createSupabaseServerClient();
  const aliasQuery = normalizeFindItAlias(canonicalQuery);
  const canonicalPattern = toIlikeContainsPattern(canonicalQuery);
  const aliasPattern = toIlikeContainsPattern(aliasQuery);

  const [canonicalResponse, aliasResponse] = await Promise.all([
    supabase
      .from("find_it_items")
      .select(itemSelect)
      .eq("user_id", userId)
      .ilike("name", canonicalPattern)
      .order("updated_at", { ascending: false })
      .order("id", { ascending: true })
      .limit(FIND_IT_SEARCH_RESULT_LIMIT),
    supabase
      .from("find_it_item_aliases")
      .select("id,item_id,alias,normalized_alias")
      .eq("user_id", userId)
      .ilike("normalized_alias", aliasPattern)
      .order("normalized_alias", { ascending: true })
      .order("id", { ascending: true }),
  ]);

  if (canonicalResponse.error || aliasResponse.error) {
    throw new Error("Could not search items.");
  }

  const aliasRows: FindItAliasSearchRow[] = aliasResponse.data.map((row) => ({
    itemId: row.item_id,
    alias: row.alias,
    normalizedAlias: row.normalized_alias,
  }));
  const aliasItemIds = [...new Set(aliasRows.map((row) => row.itemId))];
  let aliasItems: FindItItem[] = [];

  if (aliasItemIds.length) {
    const { data, error } = await supabase
      .from("find_it_items")
      .select(itemSelect)
      .eq("user_id", userId)
      .in("id", aliasItemIds);

    if (error) {
      throw new Error("Could not load alias-matched items.");
    }

    aliasItems = data.map(mapItem);
  }

  return mergeFindItSearchResults(
    canonicalResponse.data.map(mapItem),
    aliasRows,
    aliasItems,
  );
}

export async function getItemById(
  userId: string,
  itemId: string,
): Promise<FindItItem | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("find_it_items")
    .select(itemSelect)
    .eq("user_id", userId)
    .eq("id", itemId)
    .maybeSingle();

  if (error) {
    throw new Error("Could not load the item.");
  }

  return data ? mapItem(data) : null;
}
