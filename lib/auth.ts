import { redirect } from "next/navigation";
import { supabaseServer } from "./supabase/server";
import type { Role } from "./types";

export async function currentUser() {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  return data.user;
}

/** Vérifie que la personne connectée fait partie de l'équipe ; renvoie son rôle. */
export async function requireStaff(min: Role = "lecteur") {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/connexion");
  const { data } = await supabase.from("staff").select("role, email").eq("user_id", user.id).maybeSingle();
  if (!data) redirect("/admin/connexion?refus=1");
  const rank: Record<Role, number> = { lecteur: 1, editeur: 2, admin: 3 };
  const role = data.role as Role;
  if (rank[role] < rank[min]) throw new Error("Vous n'avez pas les droits pour cette action.");
  return { user, role, email: data.email as string, supabase };
}
