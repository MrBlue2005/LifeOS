import { createSupabaseServerClient } from "@/core/supabase/server";
import { toIlikeContainsPattern } from "../domain/validation";
import type {
  FindItItem,
  FindItLocation,
} from "../types";

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
    .select("id,user_id,name,description,location_id,created_at,updated_at")
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

export async function getItemById(
  userId: string,
  itemId: string,
): Promise<FindItItem | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("find_it_items")
    .select("id,user_id,name,description,location_id,created_at,updated_at")
    .eq("user_id", userId)
    .eq("id", itemId)
    .maybeSingle();

  if (error) {
    throw new Error("Could not load the item.");
  }

  return data ? mapItem(data) : null;
}
