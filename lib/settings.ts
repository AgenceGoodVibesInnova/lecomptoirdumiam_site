import { supabaseServer } from "./supabase/server";
import type { Settings } from "./types";

export async function getSettings(): Promise<Settings> {
  const supabase = await supabaseServer();
  const { data } = await supabase.from("settings").select("*").eq("id", 1).maybeSingle();
  return (
    (data as Settings | null) ?? {
      address: null, hours: null, phone: null, contact_email: null, instagram_url: null,
      ubereats_url: null, camping_name: "La Dune des Sables", opening_label: null, ordering_open: false,
    }
  );
}
