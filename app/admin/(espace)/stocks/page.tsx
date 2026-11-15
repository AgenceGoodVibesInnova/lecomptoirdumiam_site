import StockManager from "@/components/admin/StockManager";
import { requireStaff } from "@/lib/auth";
import type { StockItem } from "@/lib/types";

export default async function Stocks() {
  const { supabase, role } = await requireStaff();
  const { data } = await supabase.from("stock_items").select("*").order("name");
  return <StockManager items={(data ?? []) as StockItem[]} canEdit={role !== "lecteur"} />;
}
