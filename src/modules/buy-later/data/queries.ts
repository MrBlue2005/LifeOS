import { createSupabaseServerClient } from "@/core/supabase/server";
import type { BuyLaterItem, BuyLaterStatus } from "../types";

const columns = "id,user_id,name,product_url,current_price,currency,note,reconsider_at,status,resolved_at,created_at,updated_at";

function mapItem(row: {
  id: string; user_id: string; name: string; product_url: string | null;
  current_price: string | null; currency: string | null; note: string | null;
  reconsider_at: string; status: BuyLaterStatus; resolved_at: string | null;
  created_at: string; updated_at: string;
}): BuyLaterItem {
  return {
    id: row.id, userId: row.user_id, name: row.name, productUrl: row.product_url,
    currentPrice: row.current_price === null ? null : String(row.current_price),
    currency: row.currency, note: row.note, reconsiderAt: row.reconsider_at,
    status: row.status, resolvedAt: row.resolved_at, createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listConsideringItems(userId: string): Promise<BuyLaterItem[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("buy_later_items").select(columns)
    .eq("user_id", userId).eq("status", "considering")
    .order("reconsider_at").order("created_at", { ascending: false });
  if (error) throw new Error("Could not load Buy Later items.");
  return data.map(mapItem);
}

export async function listResolvedItems(userId: string): Promise<BuyLaterItem[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("buy_later_items").select(columns)
    .eq("user_id", userId).in("status", ["purchased", "dismissed"])
    .order("resolved_at", { ascending: false });
  if (error) throw new Error("Could not load Buy Later history.");
  return data.map(mapItem);
}

export async function getBuyLaterItem(userId: string, itemId: string): Promise<BuyLaterItem | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("buy_later_items").select(columns)
    .eq("user_id", userId).eq("id", itemId).maybeSingle();
  if (error) throw new Error("Could not load this Buy Later item.");
  return data ? mapItem(data) : null;
}

export async function getBuyLaterNotificationPreferences(userId: string): Promise<{ pushEnabled: boolean; includeItemName: boolean } | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("buy_later_notification_preferences")
    .select("push_enabled,include_item_name").eq("user_id", userId).maybeSingle();
  if (error) throw new Error("Could not load reminder preferences.");
  return data ? { pushEnabled: data.push_enabled, includeItemName: data.include_item_name } : null;
}
