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
