import { supabaseServer } from "./supabase/server";
import type { MenuCategory, MenuItem } from "./types";

export async function getMenu() {
  const supabase = await supabaseServer();
  const [{ data: cats }, { data: items }] = await Promise.all([
    supabase.from("menu_categories").select("*").eq("active", true).order("position"),
    supabase.from("menu_items").select("*").order("position"),
  ]);
  const categories = (cats ?? []) as MenuCategory[];
  const all = (items ?? []) as MenuItem[];
  return categories.map((c) => ({ ...c, items: all.filter((i) => i.category_id === c.id) }));
}
