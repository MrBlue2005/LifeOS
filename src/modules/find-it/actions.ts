"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getAuthenticatedUser } from "@/core/auth/session";
import { createSupabaseServerClient } from "@/core/supabase/server";
import { wouldCreateLocationCycle } from "./domain/hierarchy";
import {
  isUuid,
  validateFindItAlias,
  type ItemInput,
  type LocationInput,
  validateItemInput,
  validateLocationInput,
} from "./domain/validation";
import { listLocations } from "./data/queries";
import type { FindItActionState, FindItAliasActionState } from "./types";

function actionError(
  message: string,
  values: Readonly<Record<string, string>> = {},
): FindItActionState {
  return { status: "error", message, values };
}

function aliasActionError(
  message: string,
  values: Readonly<Record<string, string>> = {},
): FindItAliasActionState {
  return { status: "error", message, values };
}

async function getActionContext() {
  const user = await getAuthenticatedUser();

  if (!user) {
    return null;
  }

  return {
    user,
    supabase: await createSupabaseServerClient(),
  };
}

function databaseMessage(code: string | undefined, fallback: string): string {
  if (code === "23505") {
    return "A location with that name already exists at this level.";
  }

  if (code === "23514") {
    return "That change would create an invalid location hierarchy.";
  }

  if (code === "23503") {
    return "That change references a location that is missing or still in use.";
  }

  return fallback;
}

function locationValues(input: LocationInput): Record<string, string> {
  return { name: input.name, parentId: input.parentId ?? "" };
}

function itemValues(input: ItemInput): Record<string, string> {
  return {
    name: input.name,
    description: input.description ?? "",
    locationId: input.locationId,
  };
}

async function ownedLocationExists(userId: string, locationId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("find_it_locations")
    .select("id")
    .eq("user_id", userId)
    .eq("id", locationId)
    .maybeSingle();

  return !error && Boolean(data);
}

export async function createLocationAction(
  _previousState: FindItActionState,
  formData: FormData,
): Promise<FindItActionState> {
  const input = validateLocationInput(formData);

  if (!input.success) {
    return actionError(input.message, input.values);
  }

  const context = await getActionContext();

  if (!context) {
    return actionError("Your session has expired. Sign in and try again.");
  }

  if (
    input.data.parentId &&
    !(await ownedLocationExists(context.user.id, input.data.parentId))
  ) {
    return actionError(
      "Choose a location from your own hierarchy.",
      locationValues(input.data),
    );
  }

  const { error } = await context.supabase.from("find_it_locations").insert({
    name: input.data.name,
    parent_id: input.data.parentId,
    user_id: context.user.id,
  });

  if (error) {
    return actionError(
      databaseMessage(error.code, "Could not create the location."),
      locationValues(input.data),
    );
  }

  revalidatePath("/find-it");
  revalidatePath("/find-it/locations");
  redirect("/find-it/locations?notice=location-created");
}

export async function updateLocationAction(
  _previousState: FindItActionState,
  formData: FormData,
): Promise<FindItActionState> {
  const locationId = formData.get("locationId");
  const input = validateLocationInput(formData);

  if (typeof locationId !== "string" || !isUuid(locationId)) {
    return actionError("Choose a valid location to update.");
  }

  if (!input.success) {
    return actionError(input.message, input.values);
  }

  const context = await getActionContext();

  if (!context) {
    return actionError("Your session has expired. Sign in and try again.");
  }

  const locations = await listLocations(context.user.id);
  const currentLocation = locations.find(({ id }) => id === locationId);

  if (!currentLocation) {
    return actionError("That location no longer exists.");
  }

  if (
    input.data.parentId &&
    !locations.some(({ id }) => id === input.data.parentId)
  ) {
    return actionError(
      "Choose a location from your own hierarchy.",
      locationValues(input.data),
    );
  }

  if (
    wouldCreateLocationCycle(locationId, input.data.parentId, locations)
  ) {
    return actionError(
      "A location cannot be moved inside itself.",
      locationValues(input.data),
    );
  }

  const { data, error } = await context.supabase
    .from("find_it_locations")
    .update({ name: input.data.name, parent_id: input.data.parentId })
    .eq("user_id", context.user.id)
    .eq("id", locationId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return actionError(
      databaseMessage(error?.code, "Could not update the location."),
      locationValues(input.data),
    );
  }

  revalidatePath("/find-it");
  revalidatePath("/find-it/locations");
  redirect("/find-it/locations?notice=location-updated");
}

export async function deleteLocationAction(
  _previousState: FindItActionState,
  formData: FormData,
): Promise<FindItActionState> {
  const locationId = formData.get("locationId");

  if (typeof locationId !== "string" || !isUuid(locationId)) {
    return actionError("Choose a valid location to delete.");
  }

  const context = await getActionContext();

  if (!context) {
    return actionError("Your session has expired. Sign in and try again.");
  }

  const [children, items] = await Promise.all([
    context.supabase
      .from("find_it_locations")
      .select("id", { count: "exact", head: true })
      .eq("user_id", context.user.id)
      .eq("parent_id", locationId),
    context.supabase
      .from("find_it_items")
      .select("id", { count: "exact", head: true })
      .eq("user_id", context.user.id)
      .eq("location_id", locationId),
  ]);

  if (children.error || items.error) {
    return actionError("Could not verify whether that location is empty.");
  }

  if ((children.count ?? 0) > 0 || (items.count ?? 0) > 0) {
    return actionError(
      "Move its child locations and items before deleting this location.",
    );
  }

  const { data, error } = await context.supabase
    .from("find_it_locations")
    .delete()
    .eq("user_id", context.user.id)
    .eq("id", locationId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return actionError(
      databaseMessage(error?.code, "Could not delete the location."),
    );
  }

  revalidatePath("/find-it");
  revalidatePath("/find-it/locations");
  redirect("/find-it/locations?notice=location-deleted");
}

export async function createItemAction(
  _previousState: FindItActionState,
  formData: FormData,
): Promise<FindItActionState> {
  const input = validateItemInput(formData);

  if (!input.success) {
    return actionError(input.message, input.values);
  }

  const context = await getActionContext();

  if (!context) {
    return actionError("Your session has expired. Sign in and try again.");
  }

  if (!(await ownedLocationExists(context.user.id, input.data.locationId))) {
    return actionError(
      "Choose a location from your own hierarchy.",
      itemValues(input.data),
    );
  }

  const { data, error } = await context.supabase
    .from("find_it_items")
    .insert({
      description: input.data.description,
      location_id: input.data.locationId,
      name: input.data.name,
      user_id: context.user.id,
    })
    .select("id")
    .single();

  if (error) {
    return actionError(
      databaseMessage(error.code, "Could not save the item."),
      itemValues(input.data),
    );
  }

  revalidatePath("/find-it");
  redirect(`/find-it/items/${data.id}?notice=item-created`);
}

export async function updateItemAction(
  _previousState: FindItActionState,
  formData: FormData,
): Promise<FindItActionState> {
  const itemId = formData.get("itemId");
  const input = validateItemInput(formData);

  if (typeof itemId !== "string" || !isUuid(itemId)) {
    return actionError("Choose a valid item to update.");
  }

  if (!input.success) {
    return actionError(input.message, input.values);
  }

  const context = await getActionContext();

  if (!context) {
    return actionError("Your session has expired. Sign in and try again.");
  }

  if (!(await ownedLocationExists(context.user.id, input.data.locationId))) {
    return actionError(
      "Choose a location from your own hierarchy.",
      itemValues(input.data),
    );
  }

  const { data, error } = await context.supabase
    .from("find_it_items")
    .update({
      description: input.data.description,
      location_id: input.data.locationId,
      name: input.data.name,
    })
    .eq("user_id", context.user.id)
    .eq("id", itemId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return actionError(
      databaseMessage(error?.code, "Could not update the item."),
      itemValues(input.data),
    );
  }

  revalidatePath("/find-it");
  revalidatePath(`/find-it/items/${itemId}`);
  redirect(`/find-it/items/${itemId}?notice=item-updated`);
}

export async function deleteItemAction(
  _previousState: FindItActionState,
  formData: FormData,
): Promise<FindItActionState> {
  const itemId = formData.get("itemId");

  if (typeof itemId !== "string" || !isUuid(itemId)) {
    return actionError("Choose a valid item to delete.");
  }

  const context = await getActionContext();

  if (!context) {
    return actionError("Your session has expired. Sign in and try again.");
  }

  const { data, error } = await context.supabase
    .from("find_it_items")
    .delete()
    .eq("user_id", context.user.id)
    .eq("id", itemId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return actionError("Could not delete the item.");
  }

  revalidatePath("/find-it");
  redirect("/find-it?notice=item-deleted");
}

export async function addItemAliasAction(
  _previousState: FindItAliasActionState,
  formData: FormData,
): Promise<FindItAliasActionState> {
  const itemId = formData.get("itemId");
  const aliasValue = formData.get("alias");

  if (typeof itemId !== "string" || !isUuid(itemId)) {
    return aliasActionError("Choose a valid item.");
  }

  const context = await getActionContext();

  if (!context) {
    return aliasActionError("Your session has expired. Sign in and try again.");
  }

  const { data: item, error: itemError } = await context.supabase
    .from("find_it_items")
    .select("id,name")
    .eq("user_id", context.user.id)
    .eq("id", itemId)
    .maybeSingle();

  if (itemError || !item) {
    return aliasActionError("That item no longer exists.");
  }

  const input = validateFindItAlias(
    typeof aliasValue === "string" ? aliasValue : "",
    item.name,
  );

  if (!input.success) {
    return aliasActionError(input.message, input.values);
  }

  const { error } = await context.supabase.from("find_it_item_aliases").insert({
    alias: input.data.alias,
    item_id: itemId,
    user_id: context.user.id,
  });

  if (error) {
    if (error.code === "23505") {
      return aliasActionError("That alias is already saved for this item.", {
        alias: input.data.alias,
      });
    }

    if (error.code === "23514") {
      return aliasActionError("You can add up to 12 aliases per item.", {
        alias: input.data.alias,
      });
    }

    return aliasActionError("Could not add the alias.", { alias: input.data.alias });
  }

  revalidatePath("/find-it");
  revalidatePath(`/find-it/items/${itemId}`);
  return { status: "success", message: "Alias added.", values: {} };
}

export async function removeItemAliasAction(
  _previousState: FindItAliasActionState,
  formData: FormData,
): Promise<FindItAliasActionState> {
  const itemId = formData.get("itemId");
  const aliasId = formData.get("aliasId");

  if (
    typeof itemId !== "string" ||
    typeof aliasId !== "string" ||
    !isUuid(itemId) ||
    !isUuid(aliasId)
  ) {
    return aliasActionError("Choose a valid alias to remove.");
  }

  const context = await getActionContext();

  if (!context) {
    return aliasActionError("Your session has expired. Sign in and try again.");
  }

  const { data, error } = await context.supabase
    .from("find_it_item_aliases")
    .delete()
    .eq("user_id", context.user.id)
    .eq("item_id", itemId)
    .eq("id", aliasId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return aliasActionError("That alias no longer exists or is unavailable.");
  }

  revalidatePath("/find-it");
  revalidatePath(`/find-it/items/${itemId}`);
  return { status: "success", message: "Alias removed.", values: {} };
}
