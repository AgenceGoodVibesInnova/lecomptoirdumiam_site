import MenuManager from "@/components/admin/MenuManager";
import { requireStaff } from "@/lib/auth";
import type { MenuCategory, MenuItem, StockItem } from "@/lib/types";

export default async function Carte() {
  const { supabase, role } = await requireStaff();
  const [{ data: c }, { data: i }, { data: s }] = await Promise.all([
    supabase.from("menu_categories").select("*").order("position"),
    supabase.from("menu_items").select("*").order("position").order("name"),
    supabase.from("stock_items").select("id, name, purchase_price_cents").order("name"),
  ]);
  return (
    <MenuManager
      categories={(c ?? []) as MenuCategory[]}
      items={(i ?? []) as MenuItem[]}
      stock={(s ?? []) as Pick<StockItem, "id" | "name" | "purchase_price_cents">[]}
      canEdit={role !== "lecteur"}
    />
  );
}
