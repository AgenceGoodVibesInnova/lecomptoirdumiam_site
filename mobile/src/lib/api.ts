import { SITE } from "./config";
import { supabase } from "./supabase";

/** Appel d'API du site, avec le jeton de la personne connectée. Lève une erreur au message lisible. */
export async function api<T = Record<string, unknown>>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  let res: Response;
  try {
    res = await fetch(`${SITE}${path}`, {
      method: init.method ?? (init.body ? "POST" : "GET"),
      headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: init.body ? JSON.stringify(init.body) : undefined,
    });
  } catch {
    throw new Error("Pas de connexion internet. Réessayez.");
  }
  const json = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(json.error ?? "Une erreur est survenue. Réessayez.");
  return json;
}
