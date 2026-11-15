import { supabaseServer, supabaseService } from "./supabase/server";

/**
 * Personne connectée pour une route d'API : session du site (cookies) ou, pour l'application mobile,
 * jeton Supabase dans l'en-tête « Authorization: Bearer … ».
 */
export async function requestUser(req: Request) {
  const h = req.headers.get("authorization");
  if (h?.startsWith("Bearer ")) {
    const { data } = await supabaseService().auth.getUser(h.slice(7));
    return data.user ?? null;
  }
  const { data } = await (await supabaseServer()).auth.getUser();
  return data.user ?? null;
}

const RANK = { lecteur: 1, editeur: 2, admin: 3 } as const;

/** Membre de l'équipe pour une route d'API (session web ou jeton de l'application). */
export async function requestStaff(req: Request, min: keyof typeof RANK = "editeur") {
  const user = await requestUser(req);
  if (!user) return null;
  const { data } = await supabaseService().from("staff").select("role").eq("user_id", user.id).maybeSingle();
  if (!data || RANK[data.role as keyof typeof RANK] < RANK[min]) return null;
  return { user, role: data.role as keyof typeof RANK };
}
