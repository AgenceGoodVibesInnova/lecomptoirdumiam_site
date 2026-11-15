import { Alert } from "react-native";
import { router } from "expo-router";
import type { Line } from "./cart";
import type { Mode, Status } from "./format";
import { supabase } from "./supabase";

export type OrderItem = { menu_item_id: string | null; name: string; quantity: number; unit_price_cents: number };
export type Order = {
  id: string; number: number; mode: Mode; location: string | null; status: Status; total_cents: number;
  created_at: string; paid_at: string | null; note: string | null; is_demo?: boolean; order_items: OrderItem[];
};

export async function myOrders(limit = 30) {
  const { data } = await supabase.from("orders").select("id, number, mode, location, status, total_cents, created_at, paid_at, note, is_demo, order_items(menu_item_id, name, quantity, unit_price_cents)")
    .not("paid_at", "is", null).order("created_at", { ascending: false }).limit(limit);
  return (data ?? []) as Order[];
}

/**
 * « Recommander en 1 clic » : remplit le panier avec les plats d'une commande passée (prix et disponibilités actuels)
 * puis ouvre l'écran de commande pour vérifier et valider.
 */
export async function reorder(o: Order, cart: { start: (m: Mode, l?: string) => void; fill: (l: Line[]) => void }) {
  const ids = o.order_items.map((i) => i.menu_item_id).filter((x): x is string => !!x);
  const { data } = await supabase.from("menu_items").select("id, name, price_cents, available").in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
  const lines: Line[] = [];
  const missing: string[] = [];
  for (const it of o.order_items) {
    if (!it.menu_item_id) continue; // ligne de remise fidélité
    const m = data?.find((x) => x.id === it.menu_item_id);
    if (m?.available) lines.push({ id: m.id, name: m.name, price_cents: m.price_cents, qty: it.quantity });
    else missing.push(it.name);
  }
  if (!lines.length) return Alert.alert("Recommander", "Ces plats ne sont plus disponibles aujourd'hui.");
  cart.start(o.mode, o.mode === "mobilhome" ? o.location ?? "" : "");
  cart.fill(lines);
  router.push({ pathname: "/commander/[mode]", params: { mode: o.mode } });
  if (missing.length) Alert.alert("Quelques plats manquent", `Plus disponible aujourd'hui : ${missing.join(", ")}.`);
}

export const statusTone = (s: Status) => (s === "prete" ? "yellow" : s === "terminee" ? "green" : s === "annulee" ? "red" : "neutral") as "yellow" | "green" | "red" | "neutral";
