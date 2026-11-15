import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabase";

export type Item = { id: string; name: string; description: string | null; price_cents: number; available: boolean; category_id: string };
export type Category = { id: string; name: string; moment: string | null; items: Item[] };

/** Carte du restaurant (catégories actives et leurs plats). */
export function useMenu() {
  const [menu, setMenu] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    const [{ data: cats, error: e1 }, { data: items, error: e2 }] = await Promise.all([
      supabase.from("menu_categories").select("id, name, moment").eq("active", true).order("position"),
      supabase.from("menu_items").select("id, name, description, price_cents, available, category_id").order("position"),
    ]);
    setError(e1 || e2 ? "La carte n'a pas pu se charger. Vérifiez votre connexion." : "");
    setMenu((cats ?? []).map((c) => ({ ...c, items: (items ?? []).filter((i) => i.category_id === c.id) })).filter((c) => c.items.length));
    setLoading(false);
  }, []);
  useEffect(() => {
    load(); // eslint-disable-line react-hooks/set-state-in-effect -- chargement asynchrone : l'état change après la réponse
  }, [load]);
  return { menu, loading, error, reload: load };
}
